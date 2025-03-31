import { PrismaClient, ProviderType, ApiProvider } from '@prisma/client';
import { encryptApiKey } from '../utils/encryption';
import { ProviderManager } from './providerManager';
import { ApiError } from './providers/baseProvider';

const prisma = new PrismaClient();
const providerManager = ProviderManager.getInstance();

interface CreateProviderParams {
  userId: string;
  name: string;
  providerType: ProviderType;
  apiKey: string;
  defaultModelId?: string;
  baseUrl?: string;
}

interface UpdateProviderParams {
  name?: string;
  apiKey?: string;
  isActive?: boolean;
  defaultModelId?: string;
  baseUrl?: string;
}

export class ProviderService {
  /**
   * 새 API 공급자 생성
   */
  async createProvider(params: CreateProviderParams): Promise<ApiProvider> {
    const { userId, name, providerType, apiKey, defaultModelId, baseUrl } = params;
    
    // 해당 유형의 공급자가 이미 존재하는지 확인
    const existingProvider = await prisma.apiProvider.findFirst({
      where: {
        userId,
        providerType,
      },
    });

    if (existingProvider) {
      throw new ApiError(`${providerType} 유형의 공급자가 이미 존재합니다.`, 409);
    }

    // API 키 암호화
    const encryptedApiKey = encryptApiKey(apiKey);

    // 공급자 생성
    const provider = await prisma.apiProvider.create({
      data: {
        name,
        providerType,
        apiKey: encryptedApiKey,
        userId,
        isActive: true,
        defaultModelId,
        baseUrl,
      },
    });

    return provider;
  }

  /**
   * 사용자의 공급자 목록 조회
   */
  async getUserProviders(userId: string): Promise<ApiProvider[]> {
    return prisma.apiProvider.findMany({
      where: { userId },
    });
  }

  /**
   * 공급자 상세 정보 조회
   */
  async getProvider(id: string, userId: string): Promise<ApiProvider | null> {
    return prisma.apiProvider.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * 공급자 정보 업데이트
   */
  async updateProvider(
    id: string,
    userId: string,
    data: UpdateProviderParams
  ): Promise<ApiProvider> {
    // 해당 ID의 공급자가 있는지 확인
    const provider = await prisma.apiProvider.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!provider) {
      throw new ApiError('해당 공급자를 찾을 수 없습니다.', 404);
    }

    // 수정할 데이터 준비
    const updateData: any = { ...data };
    
    // API 키가 제공된 경우 암호화
    if (data.apiKey) {
      updateData.apiKey = encryptApiKey(data.apiKey);
    }

    // 공급자 업데이트
    const updatedProvider = await prisma.apiProvider.update({
      where: { id },
      data: updateData,
    });

    // 공급자 캐시 무효화 (갱신된 API 키가 다음 요청에서 사용되게 함)
    providerManager.invalidateProvider(userId, provider.providerType);

    return updatedProvider;
  }

  /**
   * 공급자 삭제
   */
  async deleteProvider(id: string, userId: string): Promise<void> {
    // 해당 ID의 공급자가 있는지 확인
    const provider = await prisma.apiProvider.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!provider) {
      throw new ApiError('해당 공급자를 찾을 수 없습니다.', 404);
    }

    // 공급자 삭제
    await prisma.apiProvider.delete({
      where: { id },
    });

    // 공급자 캐시 무효화
    providerManager.invalidateProvider(userId, provider.providerType);
  }

  /**
   * 관리자용: 모든 공급자 조회
   */
  async getAllProviders(): Promise<ApiProvider[]> {
    return prisma.apiProvider.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export default new ProviderService();
