import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import helmet from 'helmet';
import path from 'path';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import { errorHandler } from './middlewares/error.middleware';
import logger from './utils/logger';
import authService from './services/auth.service';

const app: Application = express();

// 미들웨어 설정
app.use(helmet()); // 보안 헤더 설정
app.use(cors()); // CORS 설정
app.use(compression()); // 응답 압축
app.use(morgan('dev')); // 로깅
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩 파싱
app.use(cookieParser()); // 쿠키 파싱
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../tmp'),
  createParentPath: true,
})); // 파일 업로드 처리

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// 에러 핸들러
app.use(errorHandler);

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 앱 초기화 함수
export const initializeApp = async (): Promise<void> => {
  try {
    // 초기 관리자 계정 생성
    await authService.createInitialAdmin();
    logger.info('앱이 성공적으로 초기화되었습니다.');
  } catch (error) {
    logger.error('앱 초기화 중 오류가 발생했습니다:', error);
  }
};

export default app; 