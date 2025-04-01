import app, { initializeApp } from './app';
import db from './config/database';
import logger from './utils/logger';
import config from './config/app.config';

// 포트 설정
const PORT = config.port || 3000;

// 데이터베이스 연결 및 동기화
db.authenticate()
  .then(() => {
    logger.info('데이터베이스 연결 성공');
    
    // 데이터베이스 동기화
    return db.sync({ alter: true });
  })
  .then(() => {
    logger.info('데이터베이스 동기화 완료');
    
    // 앱 초기화 (초기 관리자 계정 생성 등)
    return initializeApp();
  })
  .then(() => {
    // 서버 시작
    app.listen(PORT, () => {
      logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`);
      logger.info(`환경: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    logger.error('서버 시작 중 오류 발생:', error);
    process.exit(1);
  });

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