import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../index';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

// 기본 API 엔드포인트용 속도 제한
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 요청 수
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '너무 많은 요청을 보냈습니다. 15분 후에 다시 시도하세요.' },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// 인증 관련 엔드포인트용 강화된 속도 제한 (로그인/회원가입)
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 10, // IP당 최대 요청 수
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '너무 많은 인증 시도가 있었습니다. 1시간 후에 다시 시도하세요.' },
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// AI 완성 API 엔드포인트용 속도 제한
export const completionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 20, // IP당 최대 요청 수
  standardHeaders: true, 
  legacyHeaders: false,
  message: { error: '너무 많은 AI 요청을 보냈습니다. 잠시 후 다시 시도하세요.' },
  handler: (req, res, next, options) => {
    logger.warn(`Completion API rate limit exceeded: ${req.ip}`);
    res.status(429).json(options.message);
  }
});

// API 키 기반 동적 요청 제한 미들웨어
export const apiKeyRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 요청에서 API 키 추출
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return next(); // API 키 없으면 다음 미들웨어로 (기본 제한 적용)
    }

    // API 키 조회
    const apiKeyData = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true }
    });

    if (!apiKeyData || !apiKeyData.isActive) {
      return next(new AppError('유효하지 않은 API 키입니다.', 401));
    }

    // TODO: 사용자별 또는 API 키별 커스텀 제한 로직
    // 여기서 사용자의 요금제나 권한에 따라 다른 제한을 적용할 수 있습니다.
    // 예: DB에서 사용자의 요금제를 조회하여 다른 제한 적용

    // 사용자 정보를 요청 객체에 추가
    req.user = apiKeyData.user;
    req.apiKeyId = apiKeyData.id;
    
    next();
  } catch (error) {
    logger.error('API 키 검증 중 오류 발생:', error);
    next(new AppError('요청 처리 중 오류가 발생했습니다.', 500));
  }
};

// Express 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: any;
      apiKeyId?: number;
    }
  }
}
