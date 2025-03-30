import { Request, Response } from 'express';
import { prisma } from '../../../index';
import { logger } from '../../../utils/logger';
import os from 'os';

export class AdminController {
  /**
   * @swagger
   * /api/v1/admin/users:
   *   get:
   *     summary: 모든 사용자 목록 조회
   *     description: 모든 사용자 목록을 조회합니다 (관리자 전용)
   *     tags: [Admin]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: 페이지 번호
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: 페이지당 항목 수
   *     responses:
   *       200:
   *         description: 사용자 목록 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       403:
   *         description: 권한 없음
   *       500:
   *         description: 서버 오류
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            role: true
          },
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            roleId: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true,
            _count: {
              select: {
                apiKeys: true,
                completionLogs: true
              }
            }
          }
        }),
        prisma.user.count()
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.status(200).json({
        users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({ error: '사용자 목록 조회 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/admin/users/{userId}:
   *   get:
   *     summary: 특정 사용자 상세 조회
   *     description: 특정 사용자의 상세 정보를 조회합니다 (관리자 전용)
   *     tags: [Admin]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: 사용자 ID
   *     responses:
   *       200:
   *         description: 사용자 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       403:
   *         description: 권한 없음
   *       404:
   *         description: 사용자를 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
          apiKeys: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              completionLogs: true
            }
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          roleId: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          apiKeys: true,
          _count: true
        }
      });

      if (!user) {
        res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
        return;
      }

      // API 키 정보에서 민감한 정보 제거
      const sanitizedUser = {
        ...user,
        apiKeys: user.apiKeys.map(key => ({
          ...key,
          key: `${key.key.substring(0, 5)}...${key.key.substring(key.key.length - 5)}` // 마스킹된 키
        }))
      };

      res.status(200).json(sanitizedUser);
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({ error: '사용자 조회 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/admin/users/{userId}:
   *   put:
   *     summary: 사용자 정보 수정
   *     description: 사용자 정보를 수정합니다 (관리자 전용)
   *     tags: [Admin]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: 사용자 ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *               roleId:
   *                 type: string
   *     responses:
   *       200:
   *         description: 사용자 정보 수정 성공
   *       401:
   *         description: 인증되지 않음
   *       403:
   *         description: 권한 없음
   *       404:
   *         description: 사용자를 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const { name, isActive, roleId } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
        return;
      }

      // 업데이트할 데이터
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (roleId !== undefined) updateData.roleId = roleId;
      
      updateData.updatedAt = new Date();

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          role: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          role: true,
          updatedAt: true
        }
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({ error: '사용자 정보 수정 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/admin/users/{userId}:
   *   delete:
   *     summary: 사용자 비활성화
   *     description: 사용자를 비활성화합니다 (관리자 전용)
   *     tags: [Admin]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: 사용자 ID
   *     responses:
   *       200:
   *         description: 사용자 비활성화 성공
   *       401:
   *         description: 인증되지 않음
   *       403:
   *         description: 권한 없음
   *       404:
   *         description: 사용자를 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const currentUserId = req.user?.id;

      // 자기 자신을 비활성화하는 것을 방지
      if (userId === currentUserId) {
        res.status(400).json({ error: '자신의 계정을 비활성화할 수 없습니다' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
        return;
      }

      // 사용자 비활성화 및 API 키 모두 비활성화
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            updatedAt: new Date()
          }
        }),
        prisma.apiKey.updateMany({
          where: {
            userId,
            deletedAt: null
          },
          data: {
            isActive: false,
            updatedAt: new Date()
          }
        })
      ]);

      res.status(200).json({ message: '사용자가 비활성화되었습니다' });
    } catch (error) {
      logger.error('Deactivate user error:', error);
      res.status(500).json({ error: '사용자 비활성화 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/admin/system/stats:
   *   get:
   *     summary: 시스템 통계 조회
   *     description: 시스템 사용 통계를 조회합니다 (관리자 전용)
   *     tags: [Admin]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 통계 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       403:
   *         description: 권한 없음
   *       500:
   *         description: 서버 오류
   */
  async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      // 사용자/요청/토큰 통계
      const [
        userCount,
        activeUserCount,
        apiKeyCount,
        completionCount,
        totalTokens,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { isActive: true }
        }),
        prisma.apiKey.count({
          where: { deletedAt: null }
        }),
        prisma.completionLog.count(),
        prisma.completionLog.aggregate({
          _sum: {
            totalTokens: true,
            promptTokens: true,
            completionTokens: true
          }
        })
      ]);

      // 오늘 사용량
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStats = await prisma.completionLog.aggregate({
        where: {
          createdAt: {
            gte: today
          }
        },
        _count: {
          id: true
        },
        _sum: {
          totalTokens: true
        }
      });

      // 시스템 상태
      const systemStats = {
        uptime: Math.floor(process.uptime()),
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        cpu: {
          cores: os.cpus().length,
          loadAvg: os.loadavg()
        }
      };

      res.status(200).json({
        users: {
          total: userCount,
          active: activeUserCount
        },
        apiKeys: apiKeyCount,
        requests: {
          total: completionCount,
          today: todayStats._count.id || 0
        },
        tokens: {
          total: totalTokens._sum.totalTokens || 0,
          prompt: totalTokens._sum.promptTokens || 0,
          completion: totalTokens._sum.completionTokens || 0,
          today: todayStats._sum.totalTokens || 0
        },
        system: systemStats
      });
    } catch (error) {
      logger.error('Get system stats error:', error);
      res.status(500).json({ error: '시스템 통계 조회 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/admin/system/health:
   *   get:
   *     summary: 시스템 상태 확인
   *     description: 시스템 및 의존성 상태를 확인합니다 (관리자 전용)
   *     tags: [Admin]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 시스템 상태 확인 성공
   *       401:
   *         description: 인증되지 않음
   *       403:
   *         description: 권한 없음
   *       500:
   *         description: 서버 오류
   */
  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      // 데이터베이스 상태 확인
      const dbStatus = { operational: true, responseTime: 0 };
      try {
        const startTime = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        dbStatus.responseTime = Date.now() - startTime;
      } catch (error) {
        dbStatus.operational = false;
      }

      // 프로바이더 상태 확인
      const providerManager = await import('../../../services/providers/ProviderManager');
      const providers = providerManager.ProviderManager.getInstance().getAllProviders();
      
      const providerStatus = providers.map(provider => ({
        name: provider.name,
        displayName: provider.displayName,
        isConfigured: provider.isConfigured()
      }));

      // 시스템 환경 정보
      const environment = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
          free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
          usage: `${Math.round((1 - os.freemem() / os.totalmem()) * 100)}%`
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0].model,
          speed: `${os.cpus()[0].speed} MHz`
        },
        uptime: {
          system: `${Math.floor(os.uptime() / 3600)} 시간 ${Math.floor((os.uptime() % 3600) / 60)} 분`,
          process: `${Math.floor(process.uptime() / 3600)} 시간 ${Math.floor((process.uptime() % 3600) / 60)} 분`
        }
      };

      res.status(200).json({
        status: 'ok',
        timestamp: new Date(),
        services: {
          database: dbStatus,
          providers: providerStatus
        },
        environment
      });
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(500).json({ error: '시스템 상태 확인 중 오류가 발생했습니다' });
    }
  }
}
