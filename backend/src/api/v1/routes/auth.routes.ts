import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../../../middlewares/auth';

const router = Router();
const authController = new AuthController();

// 회원가입
router.post('/register', authController.register.bind(authController));

// 로그인
router.post('/login', authController.login.bind(authController));

// 내 프로필 조회 (인증 필요)
router.get('/profile', authenticateJWT, authController.getProfile.bind(authController));

// 비밀번호 변경 (인증 필요)
router.post(
  '/change-password', 
  authenticateJWT, 
  authController.changePassword.bind(authController)
);

export default router;
