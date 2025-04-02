import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { ApiError } from './error.middleware';
import logger from '../utils/logger';
import config from '../config/app.config';
import { TokenType, TokenPayload } from '../utils/jwt';

// 인증된 요청에 사용자 정보를 추가하기 위한 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

/**
 * 인증 확인 미들웨어
 * Authorization 헤더의 JWT 토큰을 검증하고 요청 객체에 사용자 정보를 추가합니다.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Authorization 헤더에서 토큰 가져오기
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('인증 토큰이 제공되지 않았습니다.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('유효한 인증 토큰이 제공되지 않았습니다.');
    }

    // 토큰 검증
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    if (!decoded) {
      throw ApiError.unauthorized('유효하지 않은 토큰입니다.');
    }

    // 토큰 유형 확인
    if (decoded.type !== TokenType.ACCESS) {
      throw ApiError.unauthorized('유효하지 않은 토큰 유형입니다.');
    }

    // 사용자 조회 (userId 필드 사용)
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      logger.error(`인증 실패: 사용자 ID ${decoded.userId}를 찾을 수 없습니다.`);
      throw ApiError.unauthorized('사용자를 찾을 수 없습니다.');
    }

    // 토큰 만료 여부 확인
    const currentTimestamp = Math.floor(Date.now() / 1000);
    // TokenPayload 타입에는 exp 속성이 없지만 jwt.verify() 결과에는 추가됨
    const jwtDecoded = decoded as TokenPayload & { exp?: number; iat?: number };
    if (jwtDecoded.exp && jwtDecoded.exp < currentTimestamp) {
      throw ApiError.unauthorized('토큰이 만료되었습니다.');
    }

    // 요청 객체에 사용자 정보 추가
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    // JWT 검증 오류 처리
    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized('유효하지 않은 토큰입니다.'));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('토큰이 만료되었습니다.'));
    }
    
    next(error);
  }
};

/**
 * 권한 확인 미들웨어
 * 특정 역할을 가진 사용자만 접근 가능하도록 합니다.
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('인증이 필요합니다.'));
      return;
    }

    const hasRole = roles.includes(req.user.role);
    if (!hasRole) {
      next(ApiError.forbidden('이 작업을 수행할 권한이 없습니다.'));
      return;
    }

    next();
  };
};

/**
 * 관리자 권한 확인 미들웨어
 * 이 미들웨어는 인증된 사용자가 관리자인지 확인합니다.
 * 반드시 authenticate 미들웨어 이후에 사용해야 합니다.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: '인증되지 않은 요청입니다.',
    });
    return;
  }
  
  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.',
    });
    return;
  }
  
  next();
}; 