import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT } from '../../../middlewares/auth';

const router = Router();
const userController = new UserController();

// 내 정보 조회
router.get('/me', authenticateJWT, userController.getCurrentUser.bind(userController));

// 내 정보 수정
router.put('/me', authenticateJWT, userController.updateCurrentUser.bind(userController));

// API 키 관련 라우트
router.get('/api-keys', authenticateJWT, userController.getApiKeys.bind(userController));
router.post('/api-keys', authenticateJWT, userController.createApiKey.bind(userController));
router.put('/api-keys/:keyId', authenticateJWT, userController.updateApiKey.bind(userController));
router.delete('/api-keys/:keyId', authenticateJWT, userController.deleteApiKey.bind(userController));

export default router;
