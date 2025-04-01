import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenType } from '../utils/jwt';
import User from '../models/user.model';
import logger from '../utils/logger';

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
 * 토큰에서 Authorization 헤더를 추출하는 함수
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Bearer 토큰 형식 확인
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * 사용자 인증 미들웨어
 * 이 미들웨어는 JWT 액세스 토큰을 검증하고
 * 요청 객체에 사용자 정보를 추가합니다.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 토큰 추출
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: '인증 토큰이 제공되지 않았습니다.',
      });
      return;
    }
    
    // 토큰 검증
    const decoded = verifyToken(token, TokenType.ACCESS);
    
    // 사용자 조회
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.active) {
      res.status(401).json({
        success: false,
        message: '사용자를 찾을 수 없거나 비활성화된 계정입니다.',
      });
      return;
    }
    
    // 요청 객체에 사용자 정보 추가
    req.user = user;
    req.token = token;
    
    next();
  } catch (error: any) {
    logger.error('인증 오류:', error);
    
    // 명확한 오류 메시지 제공
    if (error.message.includes('만료')) {
      res.status(401).json({
        success: false,
        message: '인증 토큰이 만료되었습니다.',
        code: 'TOKEN_EXPIRED',
      });
    } else {
      res.status(401).json({
        success: false,
        message: '유효하지 않은 인증 토큰입니다.',
        code: 'INVALID_TOKEN',
      });
    }
  }
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