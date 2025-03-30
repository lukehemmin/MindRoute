import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import providerRoutes from './provider.routes';
import completionRoutes from './completion.routes';
import adminRoutes from './admin.routes';
import { authenticateJWT } from '../../../middlewares/auth';

const router = Router();

// 상태 확인 엔드포인트
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'MindRoute API 서비스가 정상 작동 중입니다.' });
});

// 인증 라우트 (로그인/회원가입)
router.use('/auth', authRoutes);

// 인증이 필요한 라우트
router.use('/users', authenticateJWT, userRoutes);
router.use('/providers', authenticateJWT, providerRoutes);
router.use('/completions', authenticateJWT, completionRoutes);
router.use('/admin', authenticateJWT, adminRoutes);

export default router;
