import { Router } from 'express';
import { getProviders, getModels, chatCompletion, textCompletion, streamMessages } from '../controllers/ai.controller';
import { authenticate, authenticateStream } from '../middlewares/auth.middleware';
import { handleFileUpload } from '../middlewares/fileUpload.middleware';
import { aiApiRateLimit } from '../middlewares/rateLimit.middleware';
import { logApiRequest } from '../middlewares/apiLog.middleware';

const router = Router();

// AI 라우트는 기본적으로 인증이 필요합니다
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

// 인증 방식에 따른 채팅 엔드포인트 라우팅
// GET 요청은 쿼리 파라미터 인증, POST 요청은 헤더 인증으로 처리
router.get('/providers/:providerId/chat', authenticate, chatCompletion);
router.post('/providers/:providerId/chat', handleFileUpload, chatCompletion);

router.post('/providers/:providerId/completion', textCompletion);

// 스트리밍 메시지 처리를 위한 별도 엔드포인트
router.post('/providers/:providerId/chat/messages', authenticate, streamMessages);

export default router; 