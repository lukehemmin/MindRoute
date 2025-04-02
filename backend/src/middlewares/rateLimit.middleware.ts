import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../utils/logger';

/**
 * 기본 속도 제한 미들웨어
 * 공통 옵션을 가진 기본 속도 제한 설정
 */
export const defaultRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 15분간 최대 100회 요청 허용
  standardHeaders: true, // 표준 RateLimit 헤더 포함
  legacyHeaders: false, // X-RateLimit-* 헤더 비활성화
  message: { 
    success: false, 
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' 
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`속도 제한 초과: ${req.ip}`);
    res.status(429).json({ 
      success: false, 
      message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' 
    });
  },
});

/**
 * 인증 라우트용 속도 제한 미들웨어
 * 로그인 및 회원가입과 같은 인증 관련 엔드포인트에 더 엄격한 제한 적용
 */
export const authRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5분 (1시간에서 5분으로 변경)
  max: 100, // IP당 5분당 최대 30회 요청 허용 (10회에서 30회로 증가)
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: '인증 요청이 너무 많습니다. 5분 후에 다시 시도해주세요.' 
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`인증 속도 제한 초과: ${req.ip}`);
    res.status(429).json({ 
      success: false, 
      message: '인증 요청이 너무 많습니다. 5분 후에 다시 시도해주세요.' 
    });
  },
  // 개발 환경에서는 속도 제한 기능 비활성화 옵션 추가
  skip: (req: Request) => {
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * AI API 요청용 속도 제한 미들웨어
 * AI 요청과 같은 리소스 집약적인 작업에 대한 제한
 */
export const aiApiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 50, // IP당 1시간당 최대 50회 요청 허용
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'AI API 요청이 너무 많습니다. 나중에 다시 시도해주세요.' 
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`AI API 속도 제한 초과: ${req.ip}`);
    res.status(429).json({ 
      success: false, 
      message: 'AI API 요청이 너무 많습니다. 나중에 다시 시도해주세요.' 
    });
  },
});

/**
 * 관리자 API용 속도 제한 미들웨어
 * 관리자 작업에 대한 더 높은 한도 제공
 */
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 200, // IP당 15분당 최대 200회 요청 허용
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: '관리자 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' 
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`관리자 API 속도 제한 초과: ${req.ip}`);
    res.status(429).json({ 
      success: false, 
      message: '관리자 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' 
    });
  },
}); 