import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { defaultRateLimit } from '../middlewares/rateLimit.middleware';
import { getUserStats } from '../controllers/users/stats.controller';
import { 
  getApiKeys, 
  createApiKey, 
  deleteApiKey 
} from '../controllers/users/apiKeys.controller';

const router = Router();

// API 요청 속도 제한 적용
router.use(defaultRateLimit);

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 사용자 통계 라우트
router.get('/stats', getUserStats);

// API 키 관리 라우트
router.get('/api-keys', getApiKeys);
router.post('/api-keys', createApiKey);
router.delete('/api-keys/:keyId', deleteApiKey);

export default router; 