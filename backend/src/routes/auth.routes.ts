import express from 'express';
import { register, login, refreshTokenController } from '../controllers/auth.controller';
import { validateRegister, validateLogin, validateRefreshToken } from '../middlewares/validators/auth.validator';

const router = express.Router();

// 사용자 등록 엔드포인트
router.post('/register', validateRegister, register);

// 로그인 엔드포인트
router.post('/login', validateLogin, login);

// 토큰 갱신 엔드포인트
router.post('/refresh-token', validateRefreshToken, refreshTokenController);

export default router; 