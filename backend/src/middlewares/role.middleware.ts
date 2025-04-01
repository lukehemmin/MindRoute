import { Request, Response, NextFunction } from 'express';
import { ApiError } from './error.middleware';

/**
 * 관리자 권한 검사 미들웨어
 * 
 * authenticate 미들웨어 이후에 사용해야 합니다.
 * req.user 객체에서 role을 확인하여 관리자 여부를 검사합니다.
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // authenticate 미들웨어에서 설정한 user 객체 확인
  if (!req.user) {
    return next(ApiError.unauthorized('인증이 필요합니다.'));
  }
  
  const { role } = req.user as any;
  
  // 관리자 권한 확인
  if (role !== 'admin') {
    return next(ApiError.forbidden('관리자 권한이 필요합니다.'));
  }
  
  next();
};

/**
 * 특정 역할 검사 미들웨어
 * 
 * authenticate 미들웨어 이후에 사용해야 합니다.
 * 허용된 역할 목록을 매개변수로 받아 req.user.role과 비교합니다.
 */
export const hasRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // authenticate 미들웨어에서 설정한 user 객체 확인
    if (!req.user) {
      return next(ApiError.unauthorized('인증이 필요합니다.'));
    }
    
    const { role } = req.user as any;
    
    // 허용된 역할인지 확인
    if (!allowedRoles.includes(role)) {
      return next(ApiError.forbidden('접근 권한이 없습니다.'));
    }
    
    next();
  };
}; 