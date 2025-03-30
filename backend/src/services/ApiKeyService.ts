import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { logger } from '../utils/logger';

export interface ApiKeyInfo {
  id: string;
  key: string;
  name: string;
  userId: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export class ApiKeyService {
  /**
   * 사용자별 API 키 목록 조회
   */
  async getUserApiKeys(userId: string): Promise<ApiKeyInfo[]> {
    try {
      const keys = await prisma.apiKey.findMany({
        where: {
          userId: userId,
          deletedAt: null
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return keys;
    } catch (error) {
      logger.error('API 키 목록 조회 중 오류:', error);
      throw new Error('API 키 목록을 조회하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 새로운 API 키 생성
   */
  async createApiKey(userId: string, name: string, expiresAt?: Date): Promise<ApiKeyInfo> {
    try {
      // API 키 생성 (형식: mr_live_{uuid})
      const apiKeyString = `mr_${process.env.NODE_ENV === 'production' ? 'live' : 'test'}_${uuidv4()}`;
      
      const apiKey = await prisma.apiKey.create({
        data: {
          name,
          key: apiKeyString,
          userId,
          expiresAt,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return apiKey;
    } catch (error) {
      logger.error('API 키 생성 중 오류:', error);
      throw new Error('API 키를 생성하는 중 오류가 발생했습니다');
    }
  }

  /**
   * API 키 활성화
   */
  async activateApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.apiKey.updateMany({
        where: {
          id: keyId,
          userId: userId,
          deletedAt: null
        },
        data: {
          isActive: true,
          updatedAt: new Date()
        }
      });

      return result.count > 0;
    } catch (error) {
      logger.error('API 키 활성화 중 오류:', error);
      throw new Error('API 키를 활성화하는 중 오류가 발생했습니다');
    }
  }

  /**
   * API 키 비활성화
   */
  async deactivateApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.apiKey.updateMany({
        where: {
          id: keyId,
          userId: userId,
          deletedAt: null
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return result.count > 0;
    } catch (error) {
      logger.error('API 키 비활성화 중 오류:', error);
      throw new Error('API 키를 비활성화하는 중 오류가 발생했습니다');
    }
  }

  /**
   * API 키 삭제 (소프트 딜리트)
   */
  async deleteApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      const result = await prisma.apiKey.updateMany({
        where: {
          id: keyId,
          userId: userId,
          deletedAt: null
        },
        data: {
          isActive: false,
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      });

      return result.count > 0;
    } catch (error) {
      logger.error('API 키 삭제 중 오류:', error);
      throw new Error('API 키를 삭제하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 토큰으로 API 키 조회
   */
  async getApiKeyByToken(token: string): Promise<ApiKeyInfo | null> {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          key: token,
          isActive: true,
          deletedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      return apiKey;
    } catch (error) {
      logger.error('API 키 조회 중 오류:', error);
      throw new Error('API 키를 조회하는 중 오류가 발생했습니다');
    }
  }

  /**
   * API 키 정보 조회
   */
  async getApiKeyById(keyId: string, userId: string): Promise<ApiKeyInfo | null> {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: keyId,
          userId,
          deletedAt: null
        }
      });

      return apiKey;
    } catch (error) {
      logger.error('API 키 조회 중 오류:', error);
      throw new Error('API 키를 조회하는 중 오류가 발생했습니다');
    }
  }

  /**
   * 모든 API 키 조회 (관리자용)
   */
  async getAllApiKeys(): Promise<ApiKeyInfo[]> {
    try {
      const keys = await prisma.apiKey.findMany({
        where: {
          deletedAt: null
        },
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
          }
        }
      });
      
      return keys;
    } catch (error) {
      logger.error('모든 API 키 조회 중 오류:', error);
      throw new Error('API 키 목록을 조회하는 중 오류가 발생했습니다');
    }
  }
}
