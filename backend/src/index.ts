import app, { initializeApp } from './app';
import db from './config/database';
import logger from './utils/logger';
import config, { initializeSecurityKeys } from './config/app.config';

// 포트 설정
const PORT = config.port || 3000;

// 앱 시작 함수
const startServer = async () => {
  try {
    // 데이터베이스 연결
    await db.authenticate();
    logger.info('데이터베이스 연결 성공');
    
    // 데이터베이스 동기화
    await db.sync({ alter: true });
    logger.info('데이터베이스 동기화 완료');
    
    // 보안 키 초기화 (DB에서 로드 또는 생성)
    try {
      await initializeSecurityKeys();
      // 로드된 키 값이 유효한지 확인
      if (!config.jwtSecret || config.jwtSecret.trim() === '') {
        throw new Error('JWT 시크릿 키가 비어 있습니다.');
      }
      if (!config.encryptionKey || config.encryptionKey.trim() === '') {
        throw new Error('암호화 키가 비어 있습니다.');
      }
      logger.info('보안 키 초기화 완료');
      logger.info(`JWT 시크릿 키 길이: ${config.jwtSecret.length}`);
      logger.info(`암호화 키 길이: ${config.encryptionKey.length}`);
    } catch (error) {
      logger.error(`보안 키 초기화 실패: ${error instanceof Error ? error.message : 'unknown error'}`);
      throw error; // 서버 시작을 중단시키기 위해 다시 throw
    }
    
    // 앱 초기화 (초기 관리자 계정 생성 등)
    await initializeApp();
    
    // 서버 시작
    app.listen(PORT, () => {
      logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`);
      logger.info(`환경: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('서버 시작 중 오류 발생:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer();

// 종료 시그널 처리
process.on('SIGINT', () => {
  logger.info('SIGINT 수신, 서버 종료 중...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM 수신, 서버 종료 중...');
  process.exit(0);
});

// 예상치 못한 예외 처리
process.on('uncaughtException', (error) => {
  logger.error('처리되지 않은 예외:', error);
  process.exit(1);
}); 