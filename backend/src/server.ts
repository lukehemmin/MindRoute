import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { sequelize } from './models';
import { testConnection } from './config/database';
import authRoutes from './routes/auth.routes';
import logger from './utils/logger';

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(helmet());
app.use(express.json());

// 로깅 미들웨어
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// 라우트
app.use('/api/auth', authRoutes);

// 헬스 체크 엔드포인트
app.get('/health', async (req: Request, res: Response) => {
  const dbStatus = await testConnection();
  
  res.status(200).json({
    status: 'success',
    message: 'MindRoute API Gateway is running',
    database: dbStatus ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// 오류 처리 미들웨어
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`오류: ${err.message}`);
  res.status(500).json({
    status: 'error',
    message: '서버 오류가 발생했습니다.',
  });
});

// 데이터베이스 연결 및 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    const dbStatus = await testConnection();
    if (!dbStatus) {
      logger.error('데이터베이스 연결 실패, 서버를 종료합니다.');
      process.exit(1);
    }

    // 모델 동기화 (개발 환경에서만 사용, 프로덕션에서는 마이그레이션 사용 권장)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('데이터베이스 모델이 동기화되었습니다.');
    }

    // 서버 시작
    app.listen(PORT, () => {
      logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    });
  } catch (error) {
    logger.error(`서버 시작 실패: ${error}`);
    process.exit(1);
  }
};

startServer();

export default app; 