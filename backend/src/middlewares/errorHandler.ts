import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 앱 에러 클래스
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 글로벌 에러 핸들러
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // AppError 인스턴스인 경우 (예상된 에러)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
    return;
  }

  // 그 외 예기치 않은 에러
  res.status(500).json({
    status: 'error',
    message: '서버 내부 오류가 발생했습니다'
  });
};

// 404 Not Found 핸들러
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`요청하신 경로 ${req.originalUrl}을(를) 찾을 수 없습니다`, 404);
  next(error);
};
