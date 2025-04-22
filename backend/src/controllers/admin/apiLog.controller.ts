import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../middlewares/error.middleware';
import apiLogService from '../../services/apiLogService';
import { Op } from 'sequelize';
import logger from '../../utils/logger';

/**
 * API 로그 목록 조회
 */
export const getApiLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const email = req.query.email as string;
    const apiKeyId = req.query.apiKeyId as string;
    const model = req.query.model as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // 조회 조건 설정
    const whereCondition: any = {};
    
    if (email) {
      whereCondition.email = { [Op.iLike]: `%${email}%` };
    }
    
    if (apiKeyId) {
      whereCondition.apiKeyId = apiKeyId;
    }
    
    if (model) {
      whereCondition.model = model;
    }
    
    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereCondition.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereCondition.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }

    const result = await apiLogService.getApiLogs(page, limit, whereCondition);

    res.status(200).json({
      success: true,
      data: {
        logs: result.logs,
        pagination: {
          totalItems: result.total,
          totalPages: result.pages,
          currentPage: page,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    logger.error('API 로그 목록 조회 에러:', error);
    next(error);
  }
};

/**
 * API 로그 상세 조회
 */
export const getApiLogById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { logId } = req.params;
    
    if (!logId) {
      throw new ApiError(400, '로그 ID는 필수입니다.');
    }

    const apiLog = await apiLogService.getApiLogById(logId);

    if (!apiLog) {
      throw new ApiError(404, 'API 로그를 찾을 수 없습니다.');
    }

    res.status(200).json({
      success: true,
      data: apiLog,
    });
  } catch (error) {
    logger.error('API 로그 상세 조회 에러:', error);
    next(error);
  }
}; 