import config from './app.config';
import logger from '../utils/logger';

const auth = {
  jwt: {
    // 액세스 토큰 설정
    // 실제 값은 app.config.ts의 initializeSecurityKeys()에서 설정됨
    get accessTokenSecret() {
      const secret = config.jwtSecret;
      if (!secret || secret.trim() === '') {
        logger.error('JWT 시크릿 키가 비어 있습니다. app.config.ts의 initializeSecurityKeys()가 제대로 실행되었는지 확인하세요.');
        return 'temporary_jwt_secret_for_development_only';
      }
      return secret;
    },
    accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m', // 15분
    
    // 리프레시 토큰 설정
    get refreshTokenSecret() {
      const secret = config.jwtSecret;
      if (!secret || secret.trim() === '') {
        logger.error('JWT 시크릿 키가 비어 있습니다. app.config.ts의 initializeSecurityKeys()가 제대로 실행되었는지 확인하세요.');
        return 'temporary_jwt_secret_for_development_only';
      }
      return secret;
    },
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d', // 7일
  },
  
  // 비밀번호 설정
  password: {
    saltRounds: 10, // bcrypt salt rounds
    minLength: 8,   // 최소 길이
  },
  
  // 초기 관리자 계정 설정
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@mindroute.com',
    password: process.env.ADMIN_PASSWORD || 'changeme123',
    name: process.env.ADMIN_NAME || 'Admin',
    useRawPassword: true, // 해시 없이 직접 비밀번호 사용 (개발 환경에서만 사용)
  },

  // 암호화 설정
  encryption: {
    // 실제 값은 app.config.ts의 initializeSecurityKeys()에서 설정됨
    get key() {
      const key = config.encryptionKey;
      if (!key || key.trim() === '') {
        logger.error('암호화 키가 비어 있습니다. app.config.ts의 initializeSecurityKeys()가 제대로 실행되었는지 확인하세요.');
        return 'temporary_encryption_key_for_development_only';
      }
      return key;
    },
    algorithm: 'aes-256-cbc',
  },
};

export default auth; 