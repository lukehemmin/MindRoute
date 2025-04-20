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

    const models = await aiService.getModels(providerId);

    res.status(200).json({
      success: true,
      models: models,
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
    const { model, messages, userApiKeyId, temperature, maxTokens } = req.body;
    const userId = req.user?.id;

    // 요청 유효성 검사
    if (!model) {
      throw ApiError.badRequest('모델 ID는 필수입니다.');
    }

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
      temperature: temperature !== undefined ? parseFloat(temperature) : undefined,
      maxTokens: maxTokens !== undefined ? parseInt(maxTokens) : undefined,
      files,
      userApiKeyId
    });

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