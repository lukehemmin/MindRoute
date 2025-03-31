import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import User from '../models/user.model';
import logger from '../utils/logger';

// 요청 객체에 사용자 정보를 추가하기 위한 인터페이스 확장
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// 인증 미들웨어
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Authorization 헤더 확인
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: '인증 토큰이 필요합니다.' });
      return;
    }

    // Bearer 토큰 추출
    const token = authHeader.split(' ')[1];

    // 토큰 검증
    try {
      const decoded = verifyToken(token);
      req.user = decoded;

      // 사용자가 실제로 존재하고 활성 상태인지 확인 (선택 사항)
      const user = await User.findByPk(decoded.id);
      if (!user || !user.active) {
        res.status(401).json({ message: '유효하지 않거나 비활성화된 사용자입니다.' });
        return;
      }

      next();
    } catch (error) {
      res.status(401).json({ message: '토큰이 유효하지 않거나 만료되었습니다.' });
    }
  } catch (error) {
    logger.error(`인증 미들웨어 오류: ${error}`);
    res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' });
  }
};

// 관리자 권한 확인 미들웨어
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    return;
  }
  next();
}; 