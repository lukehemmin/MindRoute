import { ProviderInterface, ProviderConfig } from './ProviderInterface';
import { prisma } from '../../index';
import { logger } from '../../utils/logger';
import { CryptoService } from '../CryptoService';

// Provider 클래스들 임포트
import { AnthropicProvider } from './AnthropicProvider';
import { GoogleProvider } from './GoogleProvider';
import { OpenAIProvider } from './OpenAIProvider';

export class ProviderManager {
  private static instance: ProviderManager;
  private providers: Map<string, ProviderInterface>;
  private cryptoService: CryptoService;

  private constructor() {
    this.providers = new Map();
    this.cryptoService = new CryptoService();
  }

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  /**
   * 모든 프로바이더 초기화 및 로드
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('프로바이더 매니저 초기화 중...');
      
      // DB에서 프로바이더 설정 로드
      const providersFromDB = await prisma.provider.findMany({
        where: { isActive: true }
      });

      for (const providerData of providersFromDB) {
        try {
          // API 키 복호화
          let apiKey = '';
          if (providerData.apiKey) {
            try {
              apiKey = await this.cryptoService.decrypt(providerData.apiKey);
            } catch (decryptError) {
              logger.error(`프로바이더 ${providerData.name}의 API 키 복호화 실패:`, decryptError);
            }
          }

          // 프로바이더 설정
          const config: ProviderConfig = {
            apiKey,
            baseUrl: providerData.baseUrl,
            organization: providerData.organization,
            modelOptions: providerData.modelOptions as Record<string, any> || {},
            isActive: providerData.isActive
          };

          // 프로바이더 인스턴스 생성
          await this.addProvider(providerData.name, config);
          logger.info(`프로바이더 ${providerData.name} 로드 완료`);
        } catch (providerError) {
          logger.error(`프로바이더 ${providerData.name} 로드 실패:`, providerError);
        }
      }

      logger.info('모든 프로바이더 초기화 완료');
    } catch (error) {
      logger.error('프로바이더 초기화 중 오류 발생:', error);
      throw new Error('프로바이더 초기화 중 오류가 발생했습니다');
    }
  }

  /**
   * 프로바이더 추가
   */
  public async addProvider(name: string, config: ProviderConfig): Promise<ProviderInterface | null> {
    try {
      let provider: ProviderInterface;

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
          logger.error(`지원하지 않는 프로바이더: ${name}`);
          return null;
      }

      this.providers.set(name.toLowerCase(), provider);
      return provider;
    } catch (error) {
      logger.error(`프로바이더 ${name} 추가 중 오류:`, error);
      return null;
    }
  }

  /**
   * 프로바이더 가져오기
   */
  public getProvider(name: string): ProviderInterface | undefined {
    return this.providers.get(name.toLowerCase());
  }

  /**
   * 모든 프로바이더 목록
   */
  public getAllProviders(): ProviderInterface[] {
    return Array.from(this.providers.values());
  }

  /**
   * 프로바이더 설정 업데이트
   */
  public async updateProvider(name: string, newConfig: Partial<ProviderConfig>): Promise<ProviderInterface | null> {
    try {
      const provider = this.getProvider(name);
      if (!provider) {
        // 기존 등록된 프로바이더가 없는 경우 새로 추가
        return this.addProvider(name, newConfig as ProviderConfig);
      }

      // 기존 프로바이더 업데이트
      provider.updateConfig(newConfig);
      return provider;
    } catch (error) {
      logger.error(`프로바이더 ${name} 업데이트 중 오류:`, error);
      return null;
    }
  }

  /**
   * 프로바이더 제거
   */
  public removeProvider(name: string): boolean {
    return this.providers.delete(name.toLowerCase());
  }

  /**
   * 프로바이더 상태 확인
   */
  public async checkProviderStatus(name: string): Promise<boolean> {
    const provider = this.getProvider(name);
    return provider?.isConfigured() || false;
  }
}
