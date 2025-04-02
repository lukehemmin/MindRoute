import { Router } from 'express';
import { register, login, logout, refresh, me, changePassword, createDirectUser } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

// 속도 제한 미들웨어는 전체 라우터가 아닌 특정 엔드포인트에만 적용
// router.use(authRateLimit);

// 남용 가능성이 있는 공개 엔드포인트에만 속도 제한 적용
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);

// 토큰 갱신 및 로그아웃은 자주 호출될 수 있으므로 속도 제한 제외
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