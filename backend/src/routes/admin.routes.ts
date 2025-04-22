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
  refreshAllProviderModels,
  debugProviderApiKey,
} from '../controllers/admin.controller';
import {
  getApiLogs,
  getApiLogById
} from '../controllers/admin/apiLog.controller';

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
router.post('/providers/:providerId/refresh-models', refreshProviderModels);

// 개발 환경에서만 사용되는 디버그 라우트
if (process.env.NODE_ENV !== 'production') {
  router.get('/providers/:providerId/debug-key', debugProviderApiKey);
}

// AI 모델 관리 라우트
router.get('/models', getAllModels);
router.get('/models/:modelId', getModelById);
router.post('/models', createModel);
router.put('/models/:modelId', updateModel);
router.delete('/models/:modelId', deleteModel);
router.get('/providers/:providerId/models', getModelsByProviderId);

router.post('/models/refresh-all', refreshAllProviderModels);

// 로그 관리 라우트
router.get('/logs', getLogs);
router.get('/logs/:logId', getLogById);

// API 로그 관리 라우트
router.get('/api-logs', getApiLogs);
router.get('/api-logs/:logId', getApiLogById);

export default router; 