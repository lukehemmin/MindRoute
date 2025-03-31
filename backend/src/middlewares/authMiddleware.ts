import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import config from '../config/config';

const prisma = new PrismaClient();

// JWT 페이로드 타입 정의
interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

// Request 객체 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// JWT 인증 미들웨어
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: '인증 토큰이 제공되지 않았습니다',
      });
    }

    const token = authHeader.split(' ')[1];

    // 토큰 검증
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // 사용자 정보를 요청 객체에 추가
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: true,
        message: '유효하지 않은 인증 토큰입니다',
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: true,
        message: '만료된 인증 토큰입니다',
      });
    }
    next(error);
  }
};

// 관리자 권한 확인 미들웨어
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: true,
      message: '인증되지 않은 요청입니다',
    });
  }

  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({
      error: true,
      message: '관리자 권한이 필요합니다',
    });
  }

  next();
};

// 요청 속도 제한 미들웨어
export const checkRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next();
  }

  try {
    // 사용자의 속도 제한 규칙 조회
    const rateLimit = await prisma.rateLimitRule.findFirst({
      where: { userId: req.user.id },
    });

    if (!rateLimit) {
      return next();
    }

    // 지정된 시간 창 내의 API 사용 로그 개수 조회
    const windowStart = new Date(Date.now() - rateLimit.window * 1000);
    const requestCount = await prisma.apiUsageLog.count({
      where: {
        userId: req.user.id,
        timestamp: { gte: windowStart },
      },
    });

    // 속도 제한 초과 시 에러 응답
    if (requestCount >= rateLimit.limit) {
      return res.status(429).json({
        error: true,
        message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
