import { PrismaClient, ProviderType, ApiProvider } from '@prisma/client';
import { OpenAIProvider } from './providers/openaiProvider';
import { AnthropicProvider } from './providers/anthropicProvider';
import { GoogleProvider } from './providers/googleProvider';
import { AIProvider } from './providers/baseProvider';
import { decryptApiKey } from '../utils/encryption';

const prisma = new PrismaClient();

export class ProviderManager {
  private static instance: ProviderManager;
  private providerInstances: Map<string, AIProvider> = new Map();

  private constructor() {}

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  async getProviderForUser(userId: string, providerType: ProviderType): Promise<AIProvider> {
    const cacheKey = `${userId}-${providerType}`;
    
    // 캐시된 인스턴스가 있으면 반환
    if (this.providerInstances.has(cacheKey)) {
      return this.providerInstances.get(cacheKey)!;
    }

    // DB에서 제공자 정보 조회
    const providerInfo = await prisma.apiProvider.findFirst({
      where: { 
        userId, 
        providerType,
        isActive: true 
      }
    });

    if (!providerInfo) {
      throw new Error(`사용자 ${userId}의 ${providerType} 제공자 정보를 찾을 수 없습니다.`);
    }

    // API 키 복호화
    const decryptedApiKey = decryptApiKey(providerInfo.apiKey);
    let provider: AIProvider;

    // 제공자 유형에 따라 적절한 인스턴스 생성
    switch (providerType) {
      case ProviderType.OPENAI:
        provider = new OpenAIProvider(decryptedApiKey, providerInfo.defaultModelId || undefined);
        break;
      case ProviderType.ANTHROPIC:
        provider = new AnthropicProvider(decryptedApiKey, providerInfo.defaultModelId || undefined);
        break;
      case ProviderType.GOOGLE:
        provider = new GoogleProvider(decryptedApiKey, providerInfo.defaultModelId || undefined);
        break;
      default:
        throw new Error(`지원하지 않는 제공자 유형: ${providerType}`);
    }

    // 인스턴스 캐시에 저장
    this.providerInstances.set(cacheKey, provider);
    return provider;
  }

  // 캐시된 제공자 인스턴스 무효화 (키 변경 등의 경우)
  invalidateProvider(userId: string, providerType: ProviderType): void {
    const cacheKey = `${userId}-${providerType}`;
    this.providerInstances.delete(cacheKey);
  }

  // 모든 제공자 인스턴스 무효화
  invalidateAllProviders(): void {
    this.providerInstances.clear();
  }
}
