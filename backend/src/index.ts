import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { configureRoutes } from './routes';
import { errorHandler } from './middlewares/errorMiddleware';
import { setupMetrics } from './utils/monitoring';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// 앱 초기화
const app = express();
const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

// Swagger 설정
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MindRoute API',
      version: '1.0.0',
      description: '다중 AI 제공업체 통합 API 게이트웨이',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// 미들웨어 설정
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

// 모니터링 설정
setupMetrics(app);

// API 문서 설정
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 상태 확인 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API 라우트 설정
configureRoutes(app);

// 오류 처리 미들웨어
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(`API 문서: http://localhost:${PORT}/api-docs`);
});

// 프로세스 종료 시 정리
process.on('SIGTERM', async () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다.');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
