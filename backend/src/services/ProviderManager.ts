import { PrismaClient } from '@prisma/client';
import { ProviderInterface, ProviderConfig } from './providers/ProviderInterface';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GoogleProvider } from './providers/GoogleProvider';
import { logger } from '../utils/logger';

export class ProviderManager {
  private providers: Map<string, ProviderInterface> = new Map();
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async initializeProviders(): Promise<void> {
    try {
      // DB에서 모든 활성 프로바이더 가져오기
      const dbProviders = await this.prisma.provider.findMany({
        where: { isActive: true }
      });

      for (const provider of dbProviders) {
        const credentials = provider.credentials as ProviderConfig;
        await this.registerProvider(provider.name, credentials);
      }

      logger.info(`초기화된 프로바이더: ${this.getProviderNames().join(', ')}`);
    } catch (error) {
      logger.error('프로바이더 초기화 실패:', error);
      throw new Error('프로바이더 초기화 실패');
    }
  }

  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  async registerProvider(name: string, config: ProviderConfig): Promise<void> {
    try {
      let provider: ProviderInterface | null = null;

      switch (name.toLowerCase()) {
        case 'openai':
          provider = new OpenAIProvider(config);
          break;
        case 'anthropic':
          provider = new AnthropicProvider(config);
          break;
        case 'google':
          provider = new GoogleProvider(config);
          break;
        default:
          throw new Error(`지원되지 않는 프로바이더: ${name}`);
      }

      if (provider) {
        this.providers.set(name.toLowerCase(), provider);
        
        // DB에 프로바이더가 존재하는지 확인
        const existingProvider = await this.prisma.provider.findFirst({
          where: { name: name.toLowerCase() }
        });

        // 프로바이더 DB 업데이트 또는 생성
        if (existingProvider) {
          await this.prisma.provider.update({
            where: { id: existingProvider.id },
            data: {
              isActive: true,
              credentials: config as any,
              updatedAt: new Date()
            }
          });
        } else {
          await this.prisma.provider.create({
            data: {
              name: name.toLowerCase(),
              displayName: provider.displayName,
              isActive: true,
              credentials: config as any
            }
          });
        }

        // 사용 가능한 모델 동기화
        await this.syncProviderModels(name.toLowerCase());
      }
    } catch (error) {
      logger.error(`프로바이더 등록 실패 (${name}):`, error);
      throw new Error(`프로바이더 등록 실패: ${(error as Error).message}`);
    }
  }

  async removeProvider(name: string): Promise<void> {
    const normalizedName = name.toLowerCase();
    if (!this.providers.has(normalizedName)) {
      throw new Error(`프로바이더를 찾을 수 없음: ${name}`);
    }

    try {
      this.providers.delete(normalizedName);
      
      // DB에서 프로바이더 비활성화
      await this.prisma.provider.updateMany({
        where: { name: normalizedName },
        data: { isActive: false }
      });
    } catch (error) {
      logger.error(`프로바이더 제거 실패 (${name}):`, error);
      throw new Error(`프로바이더 제거 실패: ${(error as Error).message}`);
    }
  }

  getProvider(name: string): ProviderInterface {
    const normalizedName = name.toLowerCase();
    const provider = this.providers.get(normalizedName);
    if (!provider) {
      throw new Error(`프로바이더를 찾을 수 없음: ${name}`);
    }
    return provider;
  }

  async updateProviderConfig(name: string, config: Partial<ProviderConfig>): Promise<void> {
    const normalizedName = name.toLowerCase();
    const provider = this.providers.get(normalizedName);
    
    if (!provider) {
      throw new Error(`프로바이더를 찾을 수 없음: ${name}`);
    }

    try {
      const currentConfig = provider.getConfig();
      const newConfig = {
        ...currentConfig,
        ...config,
        apiKey: config.apiKey || currentConfig.apiKey // apiKey가 제공되지 않으면 기존 키 유지
      };

      provider.updateConfig(newConfig);
      
      // DB 업데이트
      const dbProvider = await this.prisma.provider.findFirst({
        where: { name: normalizedName }
      });

      if (dbProvider) {
        await this.prisma.provider.update({
          where: { id: dbProvider.id },
          data: {
            credentials: newConfig as any,
            updatedAt: new Date()
          }
        });
      }

      // 모델 목록 동기화
      await this.syncProviderModels(normalizedName);
    } catch (error) {
      logger.error(`프로바이더 설정 업데이트 실패 (${name}):`, error);
      throw new Error(`프로바이더 설정 업데이트 실패: ${(error as Error).message}`);
    }
  }

  private async syncProviderModels(providerName: string): Promise<void> {
    try {
      const provider = this.getProvider(providerName);
      const models = await provider.listModels();

      // DB에서 프로바이더 조회
      const dbProvider = await this.prisma.provider.findFirst({
        where: { name: providerName }
      });

      if (!dbProvider) {
        throw new Error(`프로바이더를 찾을 수 없음: ${providerName}`);
      }

      // DB에 있는 모든 모델 가져오기
      const existingModels = await this.prisma.model.findMany({
        where: { providerId: dbProvider.id }
      });

      const existingModelNames = existingModels.map(m => m.name);
      
      // 새로운 모델 추가
      for (const modelName of models) {
        if (!existingModelNames.includes(modelName)) {
          // 모델 이름에서 표시 이름 추출
          const displayName = modelName
            .replace(/-\d+$/, '') // 버전 번호 제거
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
            
          await this.prisma.model.create({
            data: {
              providerId: dbProvider.id,
              name: modelName,
              displayName: displayName,
              capabilities: ['chat', 'completion'],
              isActive: true
            }
          });
        }
      }

      // 더 이상 사용할 수 없는 모델 비활성화
      for (const existingModel of existingModels) {
        if (!models.includes(existingModel.name)) {
          await this.prisma.model.update({
            where: { id: existingModel.id },
            data: { isActive: false }
          });
        }
      }
    } catch (error) {
      logger.error(`모델 동기화 실패 (${providerName}):`, error);
      throw new Error(`모델 동기화 실패: ${(error as Error).message}`);
    }
  }
}
