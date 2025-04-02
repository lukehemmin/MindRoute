import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../../middlewares/error.middleware';
import { ApiKey } from '../../models/apiKey.model';
import logger from '../../utils/logger';

/**
 * 현재 인증된 사용자의 API 키 목록 조회
 */
export const getApiKeys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized('인증되지 않은 요청입니다.');
    }

    // 사용자의 API 키 목록 조회
    const apiKeys = await ApiKey.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'name', 'key', 'createdAt', 'lastUsedAt', 'expiresAt'
      ]
    });

    res.status(200).json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    logger.error('API 키 목록 조회 에러:', error);
    next(error);
  }
};

/**
 * 새 API 키 생성
 */
export const createApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!userId) {
      throw ApiError.unauthorized('인증되지 않은 요청입니다.');
    }

    if (!name) {
      throw ApiError.badRequest('API 키 이름은 필수입니다.');
    }

    // API 키 생성
    const key = `mk_${uuidv4().replace(/-/g, '')}`;
    
    // 만료일 계산 (현재부터 1년 후)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // DB에 API 키 저장
    const apiKey = await ApiKey.create({
      id: uuidv4(),
      userId: userId as number,
      name,
      key,
      expiresAt
    });

    res.status(201).json({
      success: true,
      data: apiKey
    });
  } catch (error) {
    logger.error('API 키 생성 에러:', error);
    next(error);
  }
};

/**
 * API 키 삭제
 */
export const deleteApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { keyId } = req.params;

    if (!userId) {
      throw ApiError.unauthorized('인증되지 않은 요청입니다.');
    }

    if (!keyId) {
      throw ApiError.badRequest('API 키 ID는 필수입니다.');
    }

    // 키 존재 및 소유 확인
    const apiKey = await ApiKey.findOne({
      where: { id: keyId, userId }
    });

    if (!apiKey) {
      throw ApiError.notFound('API 키를 찾을 수 없거나 삭제 권한이 없습니다.');
    }

    // API 키 삭제
    await apiKey.destroy();

    res.status(200).json({
      success: true,
      message: 'API 키가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('API 키 삭제 에러:', error);
    next(error);
  }
}; 