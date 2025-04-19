import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/role.middleware';
import { adminRateLimit } from '../middlewares/rateLimit.middleware';
import {
  getAllUsers,
  getUserById,
  updateUser,
  getAllProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  getLogs,
  getLogById,
  getAllModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  getModelsByProviderId,
  refreshProviderModels,
} from '../controllers/admin.controller';

const router = Router();

// 속도 제한 미들웨어 적용
router.use(adminRateLimit);

// 모든 관리자 라우트는 인증과 관리자 권한 검사가 필요합니다.
router.use(authenticate, isAdmin);

// 사용자 관리 라우트
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);

// 제공업체 관리 라우트
router.get('/providers', getAllProviders);
router.post('/providers', createProvider);
router.put('/providers/:providerId', updateProvider);
router.delete('/providers/:providerId', deleteProvider);

// AI 모델 관리 라우트
router.get('/models', getAllModels);
router.get('/models/:modelId', getModelById);
router.post('/models', createModel);
router.put('/models/:modelId', updateModel);
router.delete('/models/:modelId', deleteModel);
router.get('/providers/:providerId/models', getModelsByProviderId);
router.post('/providers/:providerId/models/refresh', refreshProviderModels);

// 로그 조회 라우트
router.get('/logs', getLogs);
router.get('/logs/:logId', getLogById);

export default router; 