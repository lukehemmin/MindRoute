import { Request, Response, NextFunction } from 'express';
import aiService from '../services/ai.service';
import logger from '../utils/logger';

/**
 * 사용 가능한 모든 AI 제공업체 목록 조회
 */
export const getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const providers = await aiService.getProviders();
    res.json({ success: true, data: providers });
  } catch (error: any) {
    logger.error('프로바이더 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로바이더 목록을 가져오는 데 실패했습니다.',
      error: error.message || '알 수 없는 오류',
    });
  }
};

/**
 * 특정 제공업체의 모델 목록 조회
 */
export const getModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    
    if (!providerId) {
      res.status(400).json({
        success: false,
        message: '제공업체 ID가 필요합니다.',
      });
      return;
    }
    
    const models = await aiService.getModels(providerId);
    res.json({ success: true, data: models });
  } catch (error: any) {
    logger.error('모델 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '모델 목록을 가져오는 데 실패했습니다.',
      error: error.message || '알 수 없는 오류',
    });
  }
};

/**
 * 채팅 완성 요청 처리
 */
export const chatCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    const { messages, model, temperature, maxTokens } = req.body;
    const userId = (req as any).user?.id;
    
    // 필수 입력값 검증
    if (!providerId) {
      res.status(400).json({
        success: false,
        message: '제공업체 ID가 필요합니다.',
      });
      return;
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        success: false,
        message: 'messages 배열이 필요합니다.',
      });
      return;
    }
    
    if (!model) {
      res.status(400).json({
        success: false,
        message: '모델명이 필요합니다.',
      });
      return;
    }
    
    // 요청 처리
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [];
    
    const response = await aiService.chat({
      userId,
      providerId,
      messages,
      model,
      temperature,
      maxTokens,
      files,
    });
    
    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    logger.error('채팅 완성 오류:', error);
    
    // 오류 유형에 따른 적절한 응답 처리
    if (error.message?.includes('not available') || error.message?.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    if (error.message?.includes('not allowed') || error.message?.includes('unauthorized')) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: '채팅 요청 처리 중 오류가 발생했습니다.',
      error: error.message || '알 수 없는 오류',
    });
  }
};

/**
 * 텍스트 완성 요청 처리
 */
export const textCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId } = req.params;
    const { prompt, model, temperature, maxTokens } = req.body;
    const userId = (req as any).user?.id;
    
    // 필수 입력값 검증
    if (!providerId) {
      res.status(400).json({
        success: false,
        message: '제공업체 ID가 필요합니다.',
      });
      return;
    }
    
    if (!prompt) {
      res.status(400).json({
        success: false,
        message: '텍스트 프롬프트가 필요합니다.',
      });
      return;
    }
    
    if (!model) {
      res.status(400).json({
        success: false,
        message: '모델명이 필요합니다.',
      });
      return;
    }
    
    // 요청 처리
    const response = await aiService.completion({
      userId,
      providerId,
      prompt,
      model,
      temperature,
      maxTokens,
    });
    
    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    logger.error('텍스트 완성 오류:', error);
    
    // 오류 유형에 따른 적절한 응답 처리
    if (error.message?.includes('not available') || error.message?.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    if (error.message?.includes('not allowed') || error.message?.includes('unauthorized')) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: '텍스트 완성 요청 처리 중 오류가 발생했습니다.',
      error: error.message || '알 수 없는 오류',
    });
  }
}; 