import dotenv from 'dotenv';
import path from 'path';

// 환경 변수 로드
dotenv.config({
  path: path.join(__dirname, `../../.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`),
});

interface AppConfig {
  env: string;
  port: number;
  corsOrigin: string | string[];
  fileUploadPath: string;
  logLevel: string;
  jwtSecret: string;
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
}

const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  fileUploadPath: process.env.FILE_UPLOAD_PATH || path.join(__dirname, '../../uploads'),
  logLevel: process.env.LOG_LEVEL || 'info',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_key',
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
};

export default config; 