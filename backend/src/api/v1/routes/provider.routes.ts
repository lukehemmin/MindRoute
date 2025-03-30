import { Router } from 'express';
import { ProviderController } from '../controllers/provider.controller';
import { authenticateJWT, isAdmin } from '../../../middlewares/auth';

const router = Router();
const providerController = new ProviderController();

// 모든 프로바이더 목록 조회 (인증 필요)
router.get('/', authenticateJWT, providerController.getAllProviders.bind(providerController));

// 프로바이더별 모델 목록 조회 (인증 필요)
router.get('/:name/models', authenticateJWT, providerController.getProviderModels.bind(providerController));

// 아래는 관리자 전용 라우트
// 특정 프로바이더 상세 조회
router.get('/:name', authenticateJWT, isAdmin, providerController.getProvider.bind(providerController));

// 프로바이더 설정 업데이트
router.put('/:name', authenticateJWT, isAdmin, providerController.updateProvider.bind(providerController));

// 프로바이더 비활성화
router.delete('/:name', authenticateJWT, isAdmin, providerController.deactivateProvider.bind(providerController));

export default router;
