import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/user.model';
import RefreshToken from '../models/refreshtoken.model';
import authConfig from '../config/auth.config';
import logger from './logger';

// 토큰 유형 정의
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

// 토큰 페이로드 인터페이스
export interface TokenPayload {
  type: TokenType;
  userId: number;
  role: string;
  email: string;
  jti?: string; // JWT ID (UUID)
}

// 토큰 생성 함수
export const generateToken = (
  user: User,
  type: TokenType,
  jti?: string
): string => {
  const payload: TokenPayload = {
    type,
    userId: user.id,
    role: user.role,
    email: user.email,
  };

  // 리프레시 토큰의 경우 토큰 식별자(jti) 추가
  if (type === TokenType.REFRESH) {
    payload.jti = jti || uuidv4();
  }

  const secret = type === TokenType.ACCESS
    ? authConfig.jwt.accessTokenSecret
    : authConfig.jwt.refreshTokenSecret;

  // jwt.sign에 직접 options 객체 전달
  return jwt.sign(
    payload,
    secret as Secret,
    {
      expiresIn: type === TokenType.ACCESS
        ? authConfig.jwt.accessTokenExpiration
        : authConfig.jwt.refreshTokenExpiration
    } as SignOptions
  );
};

// 액세스 토큰 생성 함수
export const generateAccessToken = (user: User): string => {
  return generateToken(user, TokenType.ACCESS);
};

// 리프레시 토큰 생성 및 저장 함수
export const generateRefreshToken = async (
  user: User,
  userAgent?: string,
  ipAddress?: string
): Promise<string> => {
  try {
    const tokenId = uuidv4();
    const token = generateToken(user, TokenType.REFRESH, tokenId);
    
    // 리프레시 토큰 만료 시간 계산
    const expiresIn = authConfig.jwt.refreshTokenExpiration;
    const expiryDate = new Date();
    if (typeof expiresIn === 'string') {
      const match = expiresIn.match(/^(\d+)([smhd])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
          case 's':
            expiryDate.setSeconds(expiryDate.getSeconds() + value);
            break;
          case 'm':
            expiryDate.setMinutes(expiryDate.getMinutes() + value);
            break;
          case 'h':
            expiryDate.setHours(expiryDate.getHours() + value);
            break;
          case 'd':
            expiryDate.setDate(expiryDate.getDate() + value);
            break;
        }
      } else {
        // 기본 14일
        expiryDate.setDate(expiryDate.getDate() + 14);
      }
    } else if (typeof expiresIn === 'number') {
      // 초 단위로 간주
      expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    } else {
      // 기본 14일
      expiryDate.setDate(expiryDate.getDate() + 14);
    }

    // 데이터베이스에 리프레시 토큰 저장
    await RefreshToken.create({
      id: tokenId,
      userId: user.id,
      token,
      expires: expiryDate,
      userAgent,
      ipAddress,
      revoked: false,
    });

    return token;
  } catch (error) {
    logger.error('리프레시 토큰 생성 오류:', error);
    throw new Error('리프레시 토큰 생성 중 오류가 발생했습니다.');
  }
};

// 토큰 검증 함수
export const verifyToken = (
  token: string,
  type: TokenType
): TokenPayload => {
  try {
    const secret = type === TokenType.ACCESS
      ? authConfig.jwt.accessTokenSecret
      : authConfig.jwt.refreshTokenSecret;
    
    const decoded = jwt.verify(token, secret as Secret) as TokenPayload;
    
    // 토큰 유형 확인
    if (decoded.type !== type) {
      throw new Error('잘못된 토큰 유형입니다.');
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('토큰이 만료되었습니다.');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('유효하지 않은 토큰입니다.');
    }
    throw error;
  }
};

// 리프레시 토큰 검증 및 새 액세스 토큰 발급 함수
export const refreshAccessToken = async (
  refreshToken: string
): Promise<string> => {
  try {
    // 리프레시 토큰 검증
    const payload = verifyToken(refreshToken, TokenType.REFRESH);
    
    if (!payload.jti) {
      throw new Error('유효하지 않은 리프레시 토큰입니다.');
    }
    
    // 데이터베이스에서 리프레시 토큰 찾기
    const tokenDoc = await RefreshToken.findOne({
      where: {
        id: payload.jti,
        token: refreshToken,
        revoked: false,
      },
    });
    
    if (!tokenDoc) {
      throw new Error('리프레시 토큰을 찾을 수 없거나 취소되었습니다.');
    }
    
    // 토큰 만료 여부 확인
    if (tokenDoc.isExpired()) {
      // 만료된 토큰 취소 처리
      await tokenDoc.update({
        revoked: true,
        revokedReason: '만료됨',
      });
      throw new Error('리프레시 토큰이 만료되었습니다.');
    }
    
    // 사용자 찾기
    const user = await User.findByPk(payload.userId);
    
    if (!user || !user.isActive) {
      throw new Error('사용자를 찾을 수 없거나 비활성화되었습니다.');
    }
    
    // 새 액세스 토큰 발급
    return generateAccessToken(user);
  } catch (error) {
    logger.error('액세스 토큰 갱신 오류:', error);
    throw error;
  }
};

// 리프레시 토큰 취소 함수
export const revokeRefreshToken = async (
  tokenId: string,
  reason: string = '사용자에 의해 취소됨'
): Promise<boolean> => {
  try {
    const result = await RefreshToken.update(
      {
        revoked: true,
        revokedReason: reason,
      },
      {
        where: {
          id: tokenId,
          revoked: false,
        },
      }
    );
    
    return result[0] > 0;
  } catch (error) {
    logger.error('리프레시 토큰 취소 오류:', error);
    throw new Error('리프레시 토큰 취소 중 오류가 발생했습니다.');
  }
};

// 사용자의 모든 리프레시 토큰 취소 함수
export const revokeAllUserTokens = async (
  userId: number,
  reason: string = '사용자에 의해 모두 취소됨'
): Promise<boolean> => {
  try {
    const result = await RefreshToken.update(
      {
        revoked: true,
        revokedReason: reason,
      },
      {
        where: {
          userId,
          revoked: false,
        },
      }
    );
    
    return result[0] > 0;
  } catch (error) {
    logger.error('사용자 토큰 모두 취소 오류:', error);
    throw new Error('사용자 토큰 취소 중 오류가 발생했습니다.');
  }
}; 