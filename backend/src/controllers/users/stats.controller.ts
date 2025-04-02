import { Request, Response, NextFunction } from 'express';
import { Log } from '../../models/log.model';
import { Provider } from '../../models/provider.model';
import { ApiError } from '../../middlewares/error.middleware';
import { Op } from 'sequelize';
import logger from '../../utils/logger';

/**
 * 현재 인증된 사용자의 API 사용 통계 조회
 */
export const getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized('인증되지 않은 요청입니다.');
    }

    // 사용자의 API 호출 총 횟수 조회
    const totalApiCalls = await Log.count({
      where: { userId }
    });

    // 사용자의 API 호출별 토큰 사용량 합계 조회
    const tokenUsage = await Log.sum('totalTokens', {
      where: { 
        userId,
        totalTokens: {
          [Op.not]: null
        }
      }
    });

    // 총 토큰 사용량 (null인 경우 0으로 처리)
    const totalTokensUsed = tokenUsage || 0;

    // 사용자가 사용 가능한 활성 제공업체 수 조회
    const activeProviders = await Provider.count({
      where: { active: true }
    });

    // 마지막 API 사용 시간 조회
    const lastLog = await Log.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
      attributes: ['createdAt']
    });

    // 마지막 사용 시간 포맷팅
    const lastUsedTime = lastLog ? formatLastUsedTime(lastLog.createdAt) : '없음';

    // 응답 데이터
    res.status(200).json({
      success: true,
      data: {
        totalApiCalls,
        totalTokensUsed,
        activeProviders,
        lastUsedTime
      }
    });
  } catch (error) {
    logger.error('사용자 통계 조회 에러:', error);
    next(error);
  }
};

/**
 * 마지막 사용 시간 포맷팅 함수
 */
const formatLastUsedTime = (dateStr: Date): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return '방금 전';
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR');
  }
}; 