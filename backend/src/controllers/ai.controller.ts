import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/error.middleware';
import logger from '../utils/logger';

/**
 * 사용 가능한 모든 AI 제공업체 목록 조회
 */
export const getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 실제 구현에서는 데이터베이스에서 조회
    const providers = [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'OpenAI API 서비스',
        isActive: true,
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Anthropic Claude 모델',
        isActive: true,
      },
    ];

    res.status(200).json({
      success: true,
      data: providers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 제공업체의 모델 목록 조회
 */
export const getModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;

    // 실제 구현에서는 데이터베이스에서 조회
    const models = {
      openai: [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          description: 'GPT-4 모델',
          isActive: true,
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'GPT-3.5 Turbo 모델',
          isActive: true,
        },
      ],
      anthropic: [
        {
          id: 'claude-3-opus',
          name: 'Claude 3 Opus',
          description: 'Claude 3 Opus 모델',
          isActive: true,
        },
        {
          id: 'claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          description: 'Claude 3 Sonnet 모델',
          isActive: true,
        },
      ],
    };

    if (!models[providerId as keyof typeof models]) {
      throw ApiError.notFound(`프로바이더 ID ${providerId}에 대한 모델을 찾을 수 없습니다.`);
    }

    res.status(200).json({
      success: true,
      data: models[providerId as keyof typeof models],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 채팅 완성 요청 처리
 */
export const chatCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    const { model, messages } = req.body;

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

    // TODO: 실제 AI 서비스에 요청 전송

    // 임시 응답
    res.status(200).json({
      success: true,
      data: {
        id: `chat-${Date.now()}`,
        providerId,
        model,
        response: {
          content: '이것은 AI 응답의 예시입니다. 실제 구현에서는 AI 제공자의 API를 통해 응답을 받아야 합니다.',
          role: 'assistant',
        },
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 텍스트 완성 요청 처리
 */
export const textCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    const { model, prompt } = req.body;

    // 요청 유효성 검사
    if (!model) {
      throw ApiError.badRequest('모델 ID는 필수입니다.');
    }

    if (!prompt || typeof prompt !== 'string') {
      throw ApiError.badRequest('유효한 프롬프트가 필요합니다.');
    }

    // TODO: 실제 AI 서비스에 요청 전송

    // 임시 응답
    res.status(200).json({
      success: true,
      data: {
        id: `completion-${Date.now()}`,
        providerId,
        model,
        response: '이것은 텍스트 완성 API의 예시 응답입니다. 실제 구현에서는 AI 제공자의 API를 통해 응답을 받아야 합니다.',
        usage: {
          promptTokens: 50,
          completionTokens: 30,
          totalTokens: 80,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}; 