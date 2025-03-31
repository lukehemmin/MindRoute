import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  // MongoDB URI 제거 (PostgreSQL로 마이그레이션)
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',  // 실제 배포 시 강력한 비밀 키로 변경 필요
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  // 암호화 키 추가
  encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key-must-be-32-chars',
};

export default config; 