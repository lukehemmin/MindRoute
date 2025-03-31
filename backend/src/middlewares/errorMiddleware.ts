import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../services/providers/baseProvider';
import { logError } from '../utils/monitoring';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 에러 로깅
  logError(err, req);
  
  // API 에러인 경우 에러 상태 코드 사용
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: true,
      message: err.message,
    });
  }

  // Prisma 에러 처리
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: true,
      message: '데이터베이스 요청 오류',
    });
  }

  // 인증 에러 처리
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: true,
      message: '인증 실패',
    });
  }

  // 기타 에러는 500으로 처리
  return res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' 
      ? '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.' 
      : err.message,
  });
};
