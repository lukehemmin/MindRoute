import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateJWT, isAdmin } from '../../../middlewares/auth';

const router = Router();
const adminController = new AdminController();

// 모든 라우트에 관리자 검사 미들웨어 적용
router.use(authenticateJWT, isAdmin);

// 사용자 관리
router.get('/users', adminController.getAllUsers.bind(adminController));
router.get('/users/:userId', adminController.getUserById.bind(adminController));
router.put('/users/:userId', adminController.updateUser.bind(adminController));
router.delete('/users/:userId', adminController.deactivateUser.bind(adminController));

// 시스템 상태
router.get('/system/stats', adminController.getSystemStats.bind(adminController));
router.get('/system/health', adminController.getSystemHealth.bind(adminController));

export default router;
