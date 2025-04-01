import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { testConnection } from './config/database';
import authRoutes from './routes/auth.routes';
// import userRoutes from './routes/user.routes';
// import taskRoutes from './routes/task.routes';
import aiRoutes from './routes/ai.routes';
import logger from './utils/logger';
import fileUpload from 'express-fileupload';
import providerManager from './utils/providerManager';

const app: Express = express();
const port = process.env.PORT || 5000;

// 데이터베이스 연결 테스트
testConnection();

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
// app.use('/api/users', userRoutes);
// app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// 서버 시작
app.listen(port, async () => {
  logger.info(`Server running on port ${port}`);
  
  // 제공업체 초기화
  try {
    await providerManager.initialize();
    logger.info('Provider Manager initialized successfully');
  } catch (error) {
    logger.error('Error initializing Provider Manager:', error);
  }
});

export default app; 