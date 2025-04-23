import dotenv from 'dotenv';
import path from 'path';
import ConfigManager from '../utils/configManager';
import { SystemConfig } from '../models/systemConfig.model';
import logger from '../utils/logger';

// 환경 변수 로드
dotenv.config({
  path: path.join(__dirname, `../../.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`),
});

// ConfigManager 인스턴스
const configManager = ConfigManager.getInstance();

interface AppConfig {
  env: string;
  port: number;
  corsOrigin: string | string[];
  fileUploadPath: string;
  logLevel: string;
  jwtSecret: string;
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
  encryptionKey: string;
}

// 기본 설정 정의
const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  fileUploadPath: process.env.FILE_UPLOAD_PATH || path.join(__dirname, '../../uploads'),
  logLevel: process.env.LOG_LEVEL || 'info',
  jwtSecret: process.env.JWT_SECRET || 'dev_temp_jwt_secret_key', // 개발 환경에서 사용할 기본값 제공
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || 'dev_temp_encryption_key', // 개발 환경에서 사용할 기본값 제공
};

/**
 * 중요 보안 키 로드 (비동기)
 * - DB에서 키를 로드하거나 생성하고 메모리에 캐싱
 * - 최초 앱 실행 시 환경 변수에서 초기 값 가져오기 시도
 */
export const initializeSecurityKeys = async (): Promise<void> => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    
    // ConfigManager 초기화
    logger.info('보안 키 초기화 시작...');
    await configManager.initialize();
    
    // JWT 시크릿 키 로드 또는 생성
    let jwtSecret = await configManager.getConfig(SystemConfig.KEYS.JWT_SECRET);
    logger.info(`DB에서 로드한 JWT 시크릿 키: ${jwtSecret ? '존재함' : '없음'}`);
    
    // 첫 실행 시 환경 변수에서 가져오기 시도
    if (!jwtSecret && process.env.JWT_SECRET) {
      logger.info('환경 변수에서 JWT_SECRET을 가져와 DB에 저장합니다.');
      await configManager.setConfig(
        SystemConfig.KEYS.JWT_SECRET, 
        process.env.JWT_SECRET,
        '환경 변수에서 가져온 JWT 시크릿 키'
      );
      jwtSecret = process.env.JWT_SECRET;
    } else if (!jwtSecret) {
      // 자동 생성
      logger.info('자동으로 JWT 시크릿 키를 생성합니다.');
      jwtSecret = await configManager.getOrCreateSystemKey(
        SystemConfig.KEYS.JWT_SECRET,
        '자동 생성된 JWT 시크릿 키'
      );
    }
    
    // JWT 키 유효성 확인
    if (!jwtSecret || jwtSecret.trim() === '' || jwtSecret === 'null' || jwtSecret === 'undefined') {
      if (isProd) {
        throw new Error('유효하지 않은 JWT 시크릿 키입니다.');
      } else {
        logger.warn('JWT 시크릿 키가 유효하지 않아 기본값을 사용합니다.');
        jwtSecret = 'dev_temp_jwt_secret_key';
      }
    }
    
    // 암호화 키 로드 또는 생성
    let encryptionKey = await configManager.getConfig(SystemConfig.KEYS.ENCRYPTION_KEY);
    logger.info(`DB에서 로드한 암호화 키: ${encryptionKey ? '존재함' : '없음'}`);
    
    // 첫 실행 시 환경 변수에서 가져오기 시도
    if (!encryptionKey && process.env.ENCRYPTION_KEY) {
      logger.info('환경 변수에서 ENCRYPTION_KEY를 가져와 DB에 저장합니다.');
      await configManager.setConfig(
        SystemConfig.KEYS.ENCRYPTION_KEY, 
        process.env.ENCRYPTION_KEY,
        '환경 변수에서 가져온 암호화 키'
      );
      encryptionKey = process.env.ENCRYPTION_KEY;
    } else if (!encryptionKey) {
      // 자동 생성
      logger.info('자동으로 암호화 키를 생성합니다.');
      encryptionKey = await configManager.getOrCreateSystemKey(
        SystemConfig.KEYS.ENCRYPTION_KEY,
        '자동 생성된 암호화 키'
      );
    }
    
    // 암호화 키 유효성 확인
    if (!encryptionKey || encryptionKey.trim() === '' || encryptionKey === 'null' || encryptionKey === 'undefined') {
      if (isProd) {
        throw new Error('유효하지 않은 암호화 키입니다.');
      } else {
        logger.warn('암호화 키가 유효하지 않아 기본값을 사용합니다.');
        encryptionKey = 'dev_temp_encryption_key';
      }
    }
    
    // 설정 갱신
    config.jwtSecret = jwtSecret;
    config.encryptionKey = encryptionKey;
    
    logger.info(`JWT 시크릿 키 설정 완료 (길이: ${jwtSecret.length})`);
    logger.info(`암호화 키 설정 완료 (길이: ${encryptionKey.length})`);
    logger.info('보안 키가 성공적으로 초기화되었습니다.');
  } catch (error) {
    logger.error('보안 키 초기화 중 오류가 발생했습니다:', error);
    
    if (process.env.NODE_ENV === 'production') {
      logger.error('프로덕션 환경에서 보안 키를 로드하지 못했습니다. 애플리케이션을 종료합니다.');
      process.exit(1);
    } else {
      // 개발 환경일 경우 임시 키 사용
      logger.warn('개발 환경에서 임시 보안 키를 사용합니다.');
      // 설정값이 이미 기본값으로 초기화되어 있으므로 다시 설정할 필요 없음
      if (!config.jwtSecret || config.jwtSecret.trim() === '') {
        config.jwtSecret = 'dev_temp_jwt_secret_key';
      }
      if (!config.encryptionKey || config.encryptionKey.trim() === '') {
        config.encryptionKey = 'dev_temp_encryption_key';
      }
    }
  }
};

export default config; 