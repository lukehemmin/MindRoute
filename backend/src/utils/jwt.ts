import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/config';
import { UserRole } from '../models/user.model';

// 사용자 토큰에 포함될 페이로드 인터페이스
export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

// 토큰 생성 함수
export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn,
  };
  return jwt.sign(payload, String(config.jwtSecret), options);
};

// 리프레시 토큰 생성 함수
export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.refreshTokenExpiresIn,
  };
  return jwt.sign(payload, String(config.jwtSecret), options);
};

// 토큰 검증 함수
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, String(config.jwtSecret)) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('토큰이 유효하지 않거나 만료되었습니다.');
  }
};

// 리프레시 토큰을 통한 새 액세스 토큰 생성
export const refreshAccessToken = (refreshToken: string): string => {
  try {
    const payload = verifyToken(refreshToken);
    return generateToken(payload);
  } catch (error) {
    throw new Error('리프레시 토큰이 유효하지 않거나 만료되었습니다.');
  }
}; 