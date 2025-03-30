import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';

// 환경변수 로드
dotenv.config();

// 미들웨어 임포트
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { rateLimiter, authRateLimiter, completionRateLimiter } from './middlewares/rateLimiter';

// 로거
import { logger } from './utils/logger';

// Prisma 클라이언트 인스턴스
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

// 라우터 임포트
import authRoutes from './api/v1/routes/auth.routes';
import userRoutes from './api/v1/routes/user.routes';
import providerRoutes from './api/v1/routes/provider.routes';
import completionRoutes from './api/v1/routes/completion.routes';
import logRoutes from './api/v1/routes/log.routes';
import adminRoutes from './api/v1/routes/admin.routes';

// 프로바이더 매니저 임포트 및 초기화
import { ProviderManager } from './services/providers/ProviderManager';

// Express 앱 생성
const app: Express = express();
const port = process.env.PORT || 4000;

// 로그 디렉토리 확인 및 생성
const logDir = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 미들웨어 설정
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// CORS 설정
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// API 기본 속도 제한
app.use(rateLimiter);

// Swagger 문서 설정
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MindRoute AI Gateway API',
      version: '1.0.0',
      description: '여러 AI 제공자를 통합하는 API 게이트웨이',
    },
    servers: [
      {
        url: '/api/v1',
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      }
    }
  },
  apis: ['./src/api/v1/controllers/*.ts']
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// 기본 경로
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'MindRoute AI Gateway API',
    version: '1.0.0',
    documentation: '/docs'
  });
});

// API 경로 설정
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/completions', completionRateLimiter, completionRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/admin', adminRoutes);

// Swagger 문서 경로
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404 및 에러 핸들러
app.use(notFoundHandler);
app.use(errorHandler);

// 서버 시작
const startServer = async () => {
  try {
    // 프로바이더 매니저 초기화
    await ProviderManager.getInstance().initialize();
    
    app.listen(port, () => {
      logger.info(`서버가 http://localhost:${port} 에서 실행 중입니다`);
      logger.info(`API 문서: http://localhost:${port}/docs`);
    });
  } catch (error) {
    logger.error('서버 시작 중 오류 발생:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer().catch((error) => {
  logger.error('예기치 않은 오류 발생:', error);
  process.exit(1);
});

// 우아한 종료
const exitHandler = () => {
  prisma.$disconnect()
    .then(() => {
      logger.info('데이터베이스 연결이 안전하게 종료되었습니다');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('데이터베이스 연결 종료 중 오류 발생:', err);
      process.exit(1);
    });
};

// 프로세스 종료 이벤트 처리
process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);
process.on('uncaughtException', (error) => {
  logger.error('미처리 예외 발생:', error);
  exitHandler();
});
