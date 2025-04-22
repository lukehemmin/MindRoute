import { v4 as uuidv4 } from 'uuid';
import { ApiLog } from '../models/apiLog.model';
import { User } from '../models/user.model';
import { ApiKey } from '../models/apiKey.model';
import logger from '../utils/logger';

interface LogApiRequestParams {
  userId?: number;
  apiKeyId?: string;
  model?: string;
  input: any;
  output?: any;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  configuration?: any;
}

class ApiLogService {
  /**
   * API 요청 로그 기록
   */
  async logApiRequest(params: LogApiRequestParams): Promise<ApiLog> {
    try {
      const {
        userId,
        apiKeyId,
        model,
        input,
        output,
        promptTokens,
        completionTokens,
        totalTokens,
        configuration
      } = params;

      // 사용자 이메일 조회
      let email: string | null = null;
      let apiKeyName: string | null = null;
      let apiKey: string | null = null;

      if (userId) {
        const user = await User.findByPk(userId);
        if (user) {
          email = user.email;
        }
      }

      // API 키 정보 조회
      if (apiKeyId) {
        const apiKeyRecord = await ApiKey.findByPk(apiKeyId);
        if (apiKeyRecord) {
          apiKeyName = apiKeyRecord.name;
          apiKey = apiKeyRecord.key;
        }
      }

      // API 로그 생성
      const apiLog = await ApiLog.create({
        id: uuidv4(),
        userId,
        email,
        apiKeyId,
        apiKeyName,
        apiKey,
        model,
        input,
        output,
        promptTokens,
        completionTokens,
        totalTokens,
        configuration
      });

      return apiLog;
    } catch (error) {
      logger.error('API 로그 기록 실패:', error);
      throw new Error('API 로그 기록에 실패했습니다.');
    }
  }

  /**
   * API 로그 목록 조회
   */
  async getApiLogs(page = 1, limit = 10, filters = {}): Promise<{ logs: ApiLog[]; total: number; pages: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await ApiLog.findAndCountAll({
        where: filters,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'name'],
          }
        ],
      });

      return {
        logs: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('API 로그 목록 조회 실패:', error);
      throw new Error('API 로그 목록 조회에 실패했습니다.');
    }
  }

  /**
   * API 로그 상세 조회
   */
  async getApiLogById(id: string): Promise<ApiLog | null> {
    try {
      const apiLog = await ApiLog.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'name'],
          }
        ],
      });

      return apiLog;
    } catch (error) {
      logger.error(`ID ${id}의 API 로그 조회 실패:`, error);
      throw new Error('API 로그 조회에 실패했습니다.');
    }
  }
}

export default new ApiLogService(); 