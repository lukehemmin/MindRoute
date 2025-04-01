import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface AppError extends Error {
  statusCode?: number;
  data?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || '서버 오류가 발생했습니다.';
  
  // 요청 정보 로깅
  logger.error(`${req.method} ${req.path} - 상태 코드: ${statusCode}, 메시지: ${message}`);
  
  // 개발 환경에서만 오류 스택 로깅
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    logger.error(err.stack);
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    data: err.data || null,
    // 개발 환경에서만 스택 정보 포함
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(statusCode: number, message: string, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, data?: any): ApiError {
    return new ApiError(400, message, data);
  }

  static unauthorized(message: string = '인증이 필요합니다.', data?: any): ApiError {
    return new ApiError(401, message, data);
  }

  static forbidden(message: string = '접근 권한이 없습니다.', data?: any): ApiError {
    return new ApiError(403, message, data);
  }

  static notFound(message: string = '요청한 리소스를 찾을 수 없습니다.', data?: any): ApiError {
    return new ApiError(404, message, data);
  }

  static conflict(message: string, data?: any): ApiError {
    return new ApiError(409, message, data);
  }

  static internal(message: string = '서버 내부 오류가 발생했습니다.', data?: any): ApiError {
    return new ApiError(500, message, data);
  }
} 