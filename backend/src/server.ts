import dotenv from 'dotenv';
// .env 파일 로드 (서버 시작 전 가장 먼저 실행되어야 함)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { testConnection, syncTables } from './config/database';
import initDatabase from './config/dbInit';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import aiRoutes from './routes/ai.routes';
import usersRoutes from './routes/users.routes';
import logger from './utils/logger';
import fileUpload from 'express-fileupload';
import providerManager from './utils/providerManager';

const app: Express = express();
const port = process.env.PORT || 5000;

// 미들웨어
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  abortOnLimit: true,
  useTempFiles: false,
  tempFileDir: '/tmp/',
}));

// 에러 핸들러
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
  });
});

// 기본 라우트
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'MindRoute API v1.0',
    status: 'Running',
  });
});

// 헬스 체크
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', usersRoutes);

// 서버 시작
app.listen(port, async () => {
  logger.info(`Server running on port ${port}`);
  
  // 데이터베이스 초기화 (두 가지 방법 중 하나 선택)
  const useSimpleSync = false; // 환경 변수로 제어 가능
  
  try {
    // 1. 간단한 동기화 방법 (테이블 자동 생성 및 업데이트, 데이터 손실 위험 있음)
    if (useSimpleSync) {
      await testConnection();
      // force: false - 테이블 삭제하지 않음
      // alter: true - 모델 변경사항 적용
      await syncTables(false, true);
    } 
    // 2. 안전한 마이그레이션 방법 (기존 데이터 보존, 세밀한 제어 가능)
    else {
      await initDatabase();
    }
    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    // 심각한 오류이므로 프로세스 종료도 고려할 수 있음
    // process.exit(1);
  }
  
  // 제공업체 초기화
  try {
    await providerManager.initialize();
    logger.info('Provider Manager initialized successfully');
  } catch (error) {
    logger.error('Error initializing Provider Manager:', error);
  }
});

export default app; 