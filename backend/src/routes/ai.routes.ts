import { Router } from 'express';
import { getProviders, getModels, chatCompletion, textCompletion } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { handleFileUpload } from '../middlewares/fileUpload.middleware';
import { aiApiRateLimit } from '../middlewares/rateLimit.middleware';
import { logApiRequest } from '../middlewares/apiLog.middleware';

const router = Router();

// AI 라우트는 모두 인증이 필요합니다.
router.use(authenticate);

// 속도 제한 미들웨어 적용
router.use(aiApiRateLimit);

// API 로그 미들웨어 적용
router.use(logApiRequest);

// AI 서비스 상태 확인
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ready',
    message: 'AI 서비스가 정상 작동 중입니다.'
  });
});

// 공개 엔드포인트
router.get('/providers', getProviders);

// 인증 필요 엔드포인트
router.get('/providers/:providerId/models', getModels);
router.post('/providers/:providerId/chat', handleFileUpload, chatCompletion);
router.post('/providers/:providerId/completion', textCompletion);

export default router; 