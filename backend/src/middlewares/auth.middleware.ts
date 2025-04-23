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

// 토큰에서 사용자 ID 추출하는 함수
const extractUserIdFromToken = (token: string): number => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    return decoded.userId;
  } catch (error) {
    throw ApiError.unauthorized('유효하지 않은 토큰입니다.');
  }
};

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
    let token = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // 'Bearer ' 이후의 문자열
    }
    
    // 토큰이 없는 경우
    if (!token) {
      throw ApiError.unauthorized('인증 토큰이 제공되지 않았습니다.');
    }
    
    try {
      // 토큰 검증
      const userId = extractUserIdFromToken(token);
      
      // 사용자 정보 조회
      const user = await User.findOne({ where: { id: userId } });
      
      if (!user) {
        throw ApiError.unauthorized('사용자를 찾을 수 없습니다.');
      }
      
      if (!user.isActive) {
        throw ApiError.unauthorized('비활성화된 계정입니다.');
      }
      
      // 사용자 정보를 요청 객체에 추가
      req.user = user;
      
      // 다음 미들웨어로 이동
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('인증 오류:', error);
      throw ApiError.unauthorized('유효하지 않은 토큰입니다.');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 인증 미들웨어 - 스트리밍 요청용 (쿼리 파라미터로 토큰 전달)
 */
export const authenticateStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 쿼리 파라미터에서 인증 토큰 가져오기
    const authToken = req.query.auth_token as string;
    
    // 요청 로깅
    logger.debug(`스트리밍 인증 시도: URL=${req.originalUrl}, 쿼리=${JSON.stringify(req.query)}`);
    
    // 토큰이 없는 경우
    if (!authToken) {
      logger.warn('스트리밍 인증 실패: 인증 토큰이 제공되지 않음');
      throw ApiError.unauthorized('인증 토큰이 제공되지 않았습니다.');
    }
    
    try {
      // 토큰 검증
      logger.debug('스트리밍 인증: 토큰 검증 시도');
      const userId = extractUserIdFromToken(authToken);
      
      // 사용자 정보 조회
      const user = await User.findOne({ where: { id: userId } });
      
      if (!user) {
        logger.warn(`스트리밍 인증 실패: 사용자 ID ${userId} 찾을 수 없음`);
        throw ApiError.unauthorized('사용자를 찾을 수 없습니다.');
      }
      
      if (!user.isActive) {
        logger.warn(`스트리밍 인증 실패: 사용자 ID ${userId}는 비활성 상태`);
        throw ApiError.unauthorized('비활성화된 계정입니다.');
      }
      
      // 사용자 정보를 요청 객체에 추가
      req.user = user;
      
      logger.info(`스트리밍 인증 성공: 사용자 ID ${userId}, URL=${req.originalUrl}`);
      
      // 다음 미들웨어로 이동
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('스트리밍 인증 오류:', error);
      throw ApiError.unauthorized('유효하지 않은 토큰입니다.');
    }
  } catch (error) {
    logger.error(`스트리밍 인증 처리 중 오류 발생: ${error instanceof Error ? error.message : 'Unknown error'}`);
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