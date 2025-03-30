import { Router } from 'express';
import { CompletionController } from '../controllers/completion.controller';
import { authenticateJWT, apiKeyAuth } from '../../../middlewares/auth';

const router = Router();
const completionController = new CompletionController();

// API 키 또는 JWT 인증을 허용하는 미들웨어 체인
const authMiddleware = [apiKeyAuth, authenticateJWT];

// 텍스트 완성 생성 (API 키 또는 JWT 인증 필요)
router.post('/', authMiddleware, completionController.createCompletion.bind(completionController));

// 스트리밍 완성 생성 (API 키 또는 JWT 인증 필요)
router.post('/stream', authMiddleware, completionController.streamCompletion.bind(completionController));

export default router;
