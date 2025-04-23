import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/error.middleware';
import logger from '../utils/logger';
import aiService from '../services/ai.service';

/**
 * 사용 가능한 모든 AI 제공업체 목록 조회
 */
export const getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const providers = await aiService.getProviders();
    
    res.status(200).json({
      success: true,
      providers: providers,
    });
  } catch (error) {
    logger.error('제공업체 목록 조회 오류:', error);
    next(new ApiError(500, '제공업체 목록을 가져오는 중 오류가 발생했습니다.'));
  }
};

/**
 * 특정 제공업체의 모델 목록 조회
 */
export const getModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;

    if (!providerId) {
      throw ApiError.badRequest('프로바이더 ID는 필수입니다.');
    }

    // 데이터베이스에서 직접 모델 정보 가져오기
    const modelService = require('../services/modelService').default;
    const models = await modelService.getModelsByProviderId(providerId);

    // API 응답 형식으로 변환
    const formattedModels = models.map((model: any) => ({
      id: model.id,
      name: model.name,
      providerId: model.providerId,
      modelId: model.modelId,
      available: model.active,
      capabilities: [
        model.allowImages ? 'images' : null,
        model.allowVideos ? 'videos' : null,
        model.allowFiles ? 'files' : null
      ].filter(Boolean),
      maxTokens: model.maxTokens,
      contextWindow: model.contextWindow,
      inputPrice: model.inputPrice,
      outputPrice: model.outputPrice,
      settings: model.settings
    }));

    res.status(200).json({
      success: true,
      models: formattedModels,
    });
  } catch (error: any) {
    logger.error(`모델 목록 조회 오류 (${req.params.providerId}):`, error);
    next(new ApiError(error.status || 500, error.message || '모델 목록을 가져오는 중 오류가 발생했습니다.'));
  }
};

/**
 * 채팅 완성 요청 처리
 */
export const chatCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    
    // GET 요청 (스트리밍용)과 POST 요청(일반) 구분 처리
    const isGetRequest = req.method === 'GET';
    let model, messages, userApiKeyId, temperature, maxTokens, streaming;
    
    if (isGetRequest) {
      // GET 요청에서는 쿼리 파라미터에서 정보 가져오기
      model = req.query.model as string;
      userApiKeyId = req.query.userApiKeyId as string;
      temperature = req.query.temperature ? parseFloat(req.query.temperature as string) : undefined;
      maxTokens = req.query.maxTokens ? parseInt(req.query.maxTokens as string) : undefined;
      streaming = req.query.streaming === 'true';
      
      // 메시지는 EventSource 연결 후 별도 엔드포인트로 처리
      messages = [];
    } else {
      // POST 요청에서는 본문에서 정보 가져오기
      const requestBody = req.body;
      model = requestBody.model;
      messages = requestBody.messages;
      userApiKeyId = requestBody.userApiKeyId;
      temperature = requestBody.temperature;
      maxTokens = requestBody.maxTokens;
      streaming = requestBody.streaming;
    }
    
    const userId = req.user?.id;

    // 요청 유효성 검사
    if (!model) {
      throw ApiError.badRequest('모델 ID는 필수입니다.');
    }
    
    // GET 방식의 스트리밍 요청인 경우 SSE 설정
    if (isGetRequest && streaming) {
      logger.info(`스트리밍 연결 요청: 사용자 ID=${userId}, 프로바이더=${providerId}, 모델=${model}`);
      logger.debug(`요청 헤더: ${JSON.stringify(req.headers)}`);
      logger.debug(`요청 쿼리: ${JSON.stringify(req.query)}`);
      
      // 인증 확인 로깅
      if (!req.user) {
        logger.error('스트리밍 요청 인증 실패: 사용자 정보 없음');
        return next(new ApiError(401, '인증이 필요합니다. 다시 로그인해주세요.'));
      }
      
      logger.info(`인증된 사용자: ID=${req.user.id}, 이메일=${req.user.email}`);
      
      // SSE 헤더 설정
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginx Proxy 버퍼링 방지
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      });
      
      // 준비 메시지 전송
      res.write(`data: ${JSON.stringify({
        content: '',
        done: false,
        status: 'ready',
        message: '스트리밍 연결이 준비되었습니다.',
        userId: userId, // 인증 확인을 위해 사용자 ID 전송
        timestamp: new Date().toISOString()
      })}\n\n`);
      
      // 클라이언트 메시지 처리는 streamMessages 함수로 별도 처리
      // 이 요청은 열린 상태로 유지됨
      
      // 연결 종료 이벤트 리스너
      req.on('close', () => {
        logger.info(`스트리밍 연결 종료: 사용자 ID=${userId}, 프로바이더=${providerId}`);
      });
      
      return;
    }

    // 일반 POST 요청인 경우 메시지 유효성 검사
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw ApiError.badRequest('유효한 메시지 배열이 필요합니다.');
    }

    // 업로드된 파일 처리
    const files = req.uploadedFiles || [];
    logger.info(`채팅 요청에 ${files.length}개의 파일이 첨부되었습니다.`);

    // AI 서비스 호출
    const response = await aiService.chat({
      userId: userId as number,
      providerId,
      model,
      messages,
      temperature: temperature !== undefined ? parseFloat(temperature as string) : undefined,
      maxTokens: maxTokens !== undefined ? parseInt(maxTokens as string) : undefined,
      files,
      userApiKeyId,
      streaming: streaming !== undefined ? Boolean(streaming) : undefined
    });

    // 스트리밍 응답 처리
    if (response.stream) {
      // 스트리밍 헤더 설정
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      let fullContent = '';
      let promptTokens = 0;
      let completionTokens = 0;

      // 스트림 이벤트 처리
      for await (const chunk of response.stream) {
        // 응답 데이터 처리
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          completionTokens += 1; // 간단한 예측 (실제 토큰 수는 다를 수 있음)
          
          // 클라이언트로 청크 전송
          res.write(`data: ${JSON.stringify({
            content,
            done: false
          })}\n\n`);
        }
      }

      // 스트림 종료 이벤트 전송
      res.write(`data: ${JSON.stringify({
        content: '',
        done: true,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens
        }
      })}\n\n`);
      
      res.end();
      return;
    }

    // 일반 응답 처리
    res.status(200).json({
      success: true,
      data: {
        id: `chat-${Date.now()}`,
        providerId,
        model,
        response: {
          content: response.message.content,
          role: response.message.role,
        },
        usage: response.usage,
        userApiKeyId: userApiKeyId, // 사용한 API 키 ID 반환
      },
    });
  } catch (error: any) {
    logger.error('AI 요청 오류:', error);
    next(new ApiError(error.status || 500, error.message || 'AI 요청을 처리하는 중 오류가 발생했습니다.'));
  }
};

/**
 * 텍스트 완성 요청 처리
 */
export const textCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    const { model, prompt, userApiKeyId, temperature, maxTokens } = req.body;
    const userId = req.user?.id;

    // 요청 유효성 검사
    if (!model) {
      throw ApiError.badRequest('모델 ID는 필수입니다.');
    }

    if (!prompt || typeof prompt !== 'string') {
      throw ApiError.badRequest('유효한 프롬프트가 필요합니다.');
    }

    // AI 서비스 호출
    const response = await aiService.completion({
      userId: userId as number,
      providerId,
      model,
      prompt,
      temperature,
      maxTokens,
      userApiKeyId
    });

    res.status(200).json({
      success: true,
      data: {
        id: `completion-${Date.now()}`,
        providerId,
        model,
        response: response.text,
        usage: response.usage,
        userApiKeyId: userApiKeyId, // 사용한 API 키 ID 반환
      },
    });
  } catch (error: any) {
    logger.error('AI 요청 오류:', error);
    next(new ApiError(error.status || 500, error.message || 'AI 요청을 처리하는 중 오류가 발생했습니다.'));
  }
};

/**
 * 스트리밍 메시지 처리 - EventSource 방식의 스트리밍을 위한 메시지 처리
 */
export const streamMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    const { messages, eventSourceId } = req.body;
    const userId = req.user?.id;

    logger.debug(`스트리밍 메시지 요청: 사용자 ID=${userId}, 프로바이더=${providerId}, 이벤트 ID=${eventSourceId}`);
    logger.debug(`메시지 수: ${messages?.length || 0}`);

    // 요청 유효성 검사
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logger.warn(`스트리밍 메시지 오류: 유효하지 않은 메시지 형식 (사용자 ID=${userId})`);
      throw ApiError.badRequest('유효한 메시지 배열이 필요합니다.');
    }

    if (!eventSourceId) {
      logger.warn(`스트리밍 메시지 오류: 이벤트 소스 ID 누락 (사용자 ID=${userId})`);
      throw ApiError.badRequest('이벤트 소스 ID가 필요합니다.');
    }

    // 메시지를 세션 스토리지에 저장 (실제 구현에서는 Redis 등 사용)
    // 여기서는 간단히 응답만 보냅니다.
    logger.info(`스트리밍 메시지 처리 성공: 사용자 ID=${userId}, 이벤트 ID=${eventSourceId}`);
    
    res.status(200).json({
      success: true,
      message: '메시지가 성공적으로 처리되었습니다.',
      eventSourceId
    });
  } catch (error: any) {
    const errorMessage = error.message || '메시지 처리 중 오류가 발생했습니다.';
    const errorStatus = error.status || 500;
    
    logger.error(`스트리밍 메시지 처리 오류: ${errorMessage}`, error);
    next(new ApiError(errorStatus, errorMessage));
  }
}; 