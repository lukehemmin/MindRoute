import { Router } from 'express';
import { register, login, logout, refresh, me, changePassword, createDirectUser } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

// 속도 제한 미들웨어 적용
router.use(authRateLimit);

// 공개 엔드포인트
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// 인증 필요 엔드포인트
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

// 개발 환경 전용 엔드포인트
if (process.env.NODE_ENV === 'development') {
  router.post('/debug/create-user', createDirectUser);
}

export default router; 