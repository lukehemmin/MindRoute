import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/error.middleware';
import logger from '../utils/logger';
import { encrypt, decrypt } from '../utils/encryption';
import axios from 'axios';

/**
 * 제공업체 API 연결 테스트
 * 다양한 AI 제공 업체에 대한 API 키 유효성 검사
 */
export const testProviderConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, apiKey, endpointUrl } = req.body;

    if (!type || !apiKey) {
      throw ApiError.badRequest('타입과 API 키가 필요합니다.');
    }

    logger.info(`제공업체 API 연결 테스트 시작: ${type}`);

    let isValid = false;
    let message = '';
    
    // 제공업체 유형에 따른 API 연결 테스트
    switch (type.toLowerCase()) {
      case 'openai':
        // OpenAI API 테스트
        isValid = await testOpenAI(apiKey, endpointUrl);
        message = isValid 
          ? 'OpenAI API 연결 테스트 성공' 
          : 'OpenAI API 연결 테스트 실패';
        break;
        
      case 'anthropic':
        // Anthropic API 테스트
        isValid = await testAnthropic(apiKey, endpointUrl);
        message = isValid 
          ? 'Anthropic API 연결 테스트 성공' 
          : 'Anthropic API 연결 테스트 실패';
        break;
        
      case 'google':
        // Google AI API 테스트
        isValid = await testGoogle(apiKey, endpointUrl);
        message = isValid 
          ? 'Google AI API 연결 테스트 성공' 
          : 'Google AI API 연결 테스트 실패';
        break;
        
      default:
        throw ApiError.badRequest(`지원하지 않는 제공업체 유형: ${type}`);
    }

    // 응답 반환
    res.status(200).json({
      success: isValid,
      message: message,
    });
    
  } catch (error) {
    logger.error(`제공업체 API 테스트 오류:`, error);
    
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.internal('제공업체 API 테스트 중 오류가 발생했습니다.'));
    }
  }
};

/**
 * OpenAI API 테스트
 */
async function testOpenAI(apiKey: string, endpointUrl?: string): Promise<boolean> {
  try {
    const url = endpointUrl || 'https://api.openai.com/v1/models';
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10초 타임아웃
    });
    
    return response.status === 200;
  } catch (error) {
    logger.error('OpenAI API 테스트 실패:', error);
    return false;
  }
}

/**
 * Anthropic API 테스트
 */
async function testAnthropic(apiKey: string, endpointUrl?: string): Promise<boolean> {
  try {
    const url = endpointUrl || 'https://api.anthropic.com/v1/models';
    
    const response = await axios.get(url, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10초 타임아웃
    });
    
    return response.status === 200;
  } catch (error) {
    logger.error('Anthropic API 테스트 실패:', error);
    return false;
  }
}

/**
 * Google AI API 테스트
 */
async function testGoogle(apiKey: string, endpointUrl?: string): Promise<boolean> {
  try {
    // Google AI API는 모델 목록 대신 기본 모델 정보 엔드포인트 사용
    const url = endpointUrl || `https://generativelanguage.googleapis.com/v1/models/gemini-pro?key=${apiKey}`;
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10초 타임아웃
    });
    
    return response.status === 200;
  } catch (error) {
    logger.error('Google AI API 테스트 실패:', error);
    return false;
  }
} 