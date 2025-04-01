import express from 'express';
import { getProviders, getModels, chatCompletion, textCompletion } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { handleFileUpload } from '../middlewares/fileUpload.middleware';

const router = express.Router();

// 공개 엔드포인트
router.get('/providers', getProviders);

// 인증 필요 엔드포인트
router.get('/providers/:providerId/models', authenticate, getModels);
router.post('/providers/:providerId/chat', authenticate, handleFileUpload, chatCompletion);
router.post('/providers/:providerId/completion', authenticate, textCompletion);

export default router; 