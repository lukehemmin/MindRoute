import { Router } from 'express';
import { LogController } from '../controllers/log.controller';
import { authenticateJWT, isAdmin } from '../../../middlewares/auth';

const router = Router();
const logController = new LogController();

// 로그 목록 조회 (사용자는 자신의 로그만, 관리자는 모든 로그 조회 가능)
router.get('/', authenticateJWT, logController.getLogs.bind(logController));

// 특정 로그 상세 조회 (사용자는 자신의 로그만, 관리자는 모든 로그 조회 가능)
router.get('/:id', authenticateJWT, logController.getLogById.bind(logController));

// 통계 조회 (관리자 전용)
router.get('/stats', authenticateJWT, isAdmin, logController.getStats.bind(logController));

export default router;
