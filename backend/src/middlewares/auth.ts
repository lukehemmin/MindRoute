import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { ApiKeyService } from '../services/ApiKeyService';

// req.user 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roleId: string;
        isAdmin: boolean;
      };
    }
  }
}

// JWT 토큰 검증 미들웨어
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 이미 인증된 경우 (API 키 인증 등에서 이미 처리됨)
  if (req.user) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(); // 토큰이 없는 경우 다음 미들웨어로 진행 (API 키 인증 등 시도)
  }

  // Bearer 토큰 형식 확인
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return next();
  }

  const token = tokenParts[1];

  try {
    // 토큰 검증
    const jwtSecret = process.env.JWT_SECRET || 'mindroute-default-jwt-secret';
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
      roleId: string;
    };

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true }
    });

    if (!user || !user.isActive) {
      return next();
    }

    // req.user에 사용자 정보 설정
    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      isAdmin: user.role.name === 'admin'
    };

    next();
  } catch (error) {
    logger.error('JWT authentication error:', error);
    next(); // 토큰 검증 실패 시 다음 미들웨어로 진행 (API 키 인증 등 시도)
  }
};

// API 키 인증 미들웨어
export const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 이미 인증된 경우 (JWT 인증 등에서 이미 처리됨)
  if (req.user) {
    return next();
  }

  // 헤더에서 API 키 추출
  const apiKey = req.headers['x-api-key'] as string;

  // body에서 API 키 추출 (헤더에 없는 경우)
  const bodyApiKey = req.body?.apiKey;
  
  // 쿼리 파라미터에서 API 키 추출 (헤더와 바디에 없는 경우)
  const queryApiKey = req.query?.apiKey as string;

  const key = apiKey || bodyApiKey || queryApiKey;

  if (!key) {
    return next(); // API 키가 없는 경우 다음 미들웨어로 진행
  }

  try {
    const apiKeyService = new ApiKeyService();
    const keyInfo = await apiKeyService.getApiKeyByToken(key);

    if (!keyInfo || !keyInfo.isActive) {
      return next();
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: keyInfo.userId },
      include: { role: true }
    });

    if (!user || !user.isActive) {
      return next();
    }

    // req.user에 사용자 정보 설정
    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      isAdmin: user.role.name === 'admin'
    };

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    next();
  }
};

// 관리자 권한 확인 미들웨어
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: '인증되지 않았습니다' });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({ error: '관리자 권한이 필요합니다' });
    return;
  }

  next();
};
