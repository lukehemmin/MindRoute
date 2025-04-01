import express from 'express';
import { register, login, logout, refresh, me, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// 공개 엔드포인트
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// 인증 필요 엔드포인트
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

export default router; 