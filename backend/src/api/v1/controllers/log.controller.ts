import { Request, Response } from 'express';
import { prisma } from '../../../index';
import { logger } from '../../../utils/logger';

export class LogController {
  /**
   * @swagger
   * /api/v1/logs:
   *   get:
   *     summary: API 사용 로그 조회
   *     description: API 사용 로그를 조회합니다 (사용자는 자신의 로그만, 관리자는 모든 로그 조회 가능)
   *     tags: [Logs]
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
   *       - in: query
   *         name: provider
   *         schema:
   *           type: string
   *         description: AI 제공자 필터
   *       - in: query
   *         name: model
   *         schema:
   *           type: string
   *         description: 모델 필터
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: 시작일 필터 (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: 종료일 필터 (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: 로그 조회 성공
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증되지 않음
   *       500:
   *         description: 서버 오류
   */
  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const provider = req.query.provider as string;
      const model = req.query.model as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // 검색 조건 구성
      const where: any = {};

      // 일반 사용자는 자신의 로그만 볼 수 있음, 관리자는 모든 로그 조회 가능
      if (!req.user.isAdmin) {
        where.userId = req.user.id;
      }

      // 필터 적용
      if (provider) {
        where.provider = provider;
      }
      
      if (model) {
        where.model = model;
      }
      
      // 날짜 필터
      if (startDate || endDate) {
        where.createdAt = {};
        
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDateObj;
        }
      }

      // 로그 조회 쿼리 실행
      const [logs, totalCount] = await Promise.all([
        prisma.completionLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            apiKey: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }),
        prisma.completionLog.count({ where })
      ]);

      // 페이지네이션 정보
      const totalPages = Math.ceil(totalCount / limit);

      res.status(200).json({
        logs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      });
    } catch (error) {
      logger.error('Get logs error:', error);
      res.status(500).json({ error: '로그 조회 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/logs/{id}:
   *   get:
   *     summary: 특정 로그 상세 조회
   *     description: 특정 로그의 상세 정보를 조회합니다
   *     tags: [Logs]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 로그 ID
   *     responses:
   *       200:
   *         description: 로그 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       403:
   *         description: 권한 없음
   *       404:
   *         description: 로그를 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  async getLogById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const { id } = req.params;

      const log = await prisma.completionLog.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          apiKey: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!log) {
        res.status(404).json({ error: '로그를 찾을 수 없습니다' });
        return;
      }

      // 권한 체크: 일반 사용자는 자신의 로그만 볼 수 있음
      if (!req.user.isAdmin && log.userId !== req.user.id) {
        res.status(403).json({ error: '이 로그를 볼 수 있는 권한이 없습니다' });
        return;
      }

      res.status(200).json(log);
    } catch (error) {
      logger.error('Get log by ID error:', error);
      res.status(500).json({ error: '로그 조회 중 오류가 발생했습니다' });
    }
  }

  /**
   * @swagger
   * /api/v1/logs/stats:
   *   get:
   *     summary: 로그 통계 조회
   *     description: 사용량 통계를 조회합니다 (사용자는 자신의 통계만, 관리자는 모든 통계 조회 가능)
   *     tags: [Logs]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: 시작일 필터 (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: 종료일 필터 (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: 통계 조회 성공
   *       401:
   *         description: 인증되지 않음
   *       500:
   *         description: 서버 오류
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: '인증되지 않았습니다' });
        return;
      }

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // 검색 조건 구성
      const where: any = {};

      // 일반 사용자는 자신의 통계만 볼 수 있음, 관리자는 모든 통계 조회 가능
      if (!req.user.isAdmin) {
        where.userId = req.user.id;
      }

      // 날짜 필터
      if (startDate || endDate) {
        where.createdAt = {};
        
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDateObj;
        }
      }

      // 통계 쿼리 - 총 호출 수 및 토큰 사용량
      const totalStats = await prisma.completionLog.aggregate({
        where,
        _count: {
          id: true
        },
        _sum: {
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          processingTimeMs: true
        }
      });

      // 프로바이더별 통계
      const providerStats = await prisma.completionLog.groupBy({
        by: ['provider'],
        where,
        _count: {
          id: true
        },
        _sum: {
          totalTokens: true
        }
      });

      // 모델별 통계
      const modelStats = await prisma.completionLog.groupBy({
        by: ['model'],
        where,
        _count: {
          id: true
        },
        _sum: {
          totalTokens: true
        }
      });

      // 일별 사용량 통계
      const dailyStats = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date, 
          COUNT(*) as count, 
          SUM(total_tokens) as tokens
        FROM completion_log
        WHERE ${where}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `;

      res.status(200).json({
        total: {
          requests: totalStats._count.id || 0,
          promptTokens: totalStats._sum.promptTokens || 0,
          completionTokens: totalStats._sum.completionTokens || 0,
          totalTokens: totalStats._sum.totalTokens || 0,
          averageProcessingTime: totalStats._count.id 
            ? totalStats._sum.processingTimeMs / totalStats._count.id 
            : 0
        },
        byProvider: providerStats.map(ps => ({
          provider: ps.provider,
          requests: ps._count.id,
          tokens: ps._sum.totalTokens || 0
        })),
        byModel: modelStats.map(ms => ({
          model: ms.model,
          requests: ms._count.id,
          tokens: ms._sum.totalTokens || 0
        })),
        daily: dailyStats
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다' });
    }
  }
}
