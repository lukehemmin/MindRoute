/**
 * 프로바이더 관리자 - AI 프로바이더와의 통신 관리
 * 
 * 이 모듈은 OpenAI, Anthropic, Google AI 등의 다양한 AI 프로바이더와
 * 통신하기 위한 인터페이스를 제공합니다.
 */

import { Provider } from '../models/provider.model';
import { decrypt } from './encryption';
import { OpenAIProvider } from '../services/providers/openai.provider';
import { AnthropicProvider } from '../services/providers/anthropic.provider';
import { GoogleAIProvider } from '../services/providers/googleai.provider';
import logger from './logger';

// 제공업체 유형 열거형
export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
}

// 제공업체 모델 인터페이스
export interface IModel {
  id: string;
  name: string;
  contextWindow?: number;
  inputPrice?: number;
  outputPrice?: number;
  features?: string[];
}

// 메시지 유형 인터페이스
export interface IMessage {
  role: string;
  content: string | Array<{
    type: string;
    text?: string;
    image_url?: string;
    file_url?: string;
  }>;
}

// 첨부 파일 인터페이스
export interface IFile {
  name: string;
  type: string;
  content: Buffer | string;
  encoding?: string;
  url?: string;
}

// 채팅 요청 인터페이스
export interface IChatRequest {
  messages: IMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  files?: IFile[];
  streaming?: boolean;
}

// 채팅 응답 인터페이스
export interface IChatResponse {
  message: IMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  stream?: any;
}

// 텍스트 완성 요청 인터페이스
export interface ICompletionRequest {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// 텍스트 완성 응답 인터페이스
export interface ICompletionResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 제공업체 인터페이스
export interface IProvider {
  getType(): ProviderType;
  isAvailable(): boolean;
  getModels(): Promise<IModel[]>;
  chat(request: IChatRequest): Promise<IChatResponse>;
  completion(request: ICompletionRequest): Promise<ICompletionResponse>;
}

// 제공업체 관리자 클래스
class ProviderManager {
  private providers: Map<string, IProvider> = new Map();
  private providerDbCache: Map<string, Provider> = new Map();
  private initialized = false;

  // 제공업체 인스턴스 생성
  private createProviderInstance(provider: Provider): IProvider | null {
    try {
      logger.info(`제공업체 ${provider.name} 인스턴스 생성 시도`);
      
      // 암호화된 API 키 로깅 (일부분만)
      const encryptedKeyParts = provider.apiKey.split(':');
      if (encryptedKeyParts.length === 2) {
        logger.info(`암호화된 API 키 형식: [IV(${encryptedKeyParts[0].length}자):암호화된 데이터(${encryptedKeyParts[1].length}자)]`);
      } else {
        logger.warn(`암호화된 API 키 형식이 예상과 다릅니다: ${provider.apiKey.substring(0, 10)}...`);
      }
      
      // API 키 복호화
      try {
        const apiKey = decrypt(provider.apiKey);
        
        // 복호화된 API 키 확인 (일부만 로깅)
        if (apiKey && apiKey.length > 16) {
          const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}`;
          logger.info(`복호화된 API 키: ${maskedKey} (길이: ${apiKey.length}자)`);
        } else {
          logger.warn(`복호화된 API 키가 너무 짧거나 없습니다: ${apiKey || '없음'}`);
          return null;
        }
        
        const settings = provider.settings || {};
        
        // 제공업체 유형에 따라 적절한 인스턴스 생성
        switch (provider.type) {
          case ProviderType.OPENAI:
            logger.info(`OpenAI 제공업체 인스턴스 생성 중...`);
            return new OpenAIProvider(apiKey, provider.endpointUrl || undefined, settings);
          case ProviderType.ANTHROPIC:
            logger.info(`Anthropic 제공업체 인스턴스 생성 중...`);
            return new AnthropicProvider(apiKey, settings);
          case ProviderType.GOOGLE:
            logger.info(`Google AI 제공업체 인스턴스 생성 중...`);
            return new GoogleAIProvider(apiKey, settings);
          default:
            logger.error(`지원되지 않는 제공업체 유형: ${provider.type}`);
            return null;
        }
      } catch (decryptError) {
        logger.error(`API 키 복호화 오류 (${provider.name}):`, decryptError);
        return null;
      }
    } catch (error) {
      logger.error(`제공업체 초기화 오류 (${provider.name}):`, error);
      return null;
    }
  }

  // 모든 제공업체 초기화 및 로드
  public async initialize(): Promise<void> {
    try {
      // 이미 초기화되었다면 스킵
      if (this.initialized) {
        return;
      }
      
      // 데이터베이스에서 활성화된 모든 제공업체 로드
      const providers = await Provider.findAll({
        where: { active: true }
      });
      
      logger.info(`총 ${providers.length}개의 제공업체를 로드했습니다.`);
      
      // 각 제공업체에 대한 인스턴스 생성 및 캐싱
      for (const provider of providers) {
        const providerInstance = this.createProviderInstance(provider);
        
        if (providerInstance) {
          this.providers.set(provider.id, providerInstance);
          this.providerDbCache.set(provider.id, provider);
          logger.info(`${provider.name} 제공업체가 초기화되었습니다.`);
        }
      }
      
      this.initialized = true;
    } catch (error) {
      logger.error('제공업체 관리자 초기화 오류:', error);
      throw new Error('제공업체 초기화 실패');
    }
  }

  // 개별 제공업체 새로고침
  public async refreshProvider(providerId: string): Promise<void> {
    try {
      const provider = await Provider.findByPk(providerId);
      
      if (!provider) {
        logger.warn(`제공업체 ID를 찾을 수 없음: ${providerId}`);
        // 캐시에서도 제거
        this.providers.delete(providerId);
        this.providerDbCache.delete(providerId);
        return;
      }
      
      logger.info(`제공업체 새로고침 시작: ${provider.name}, ID: ${providerId}, 활성상태: ${provider.active}`);
      
      // 비활성화된 경우 캐시에서 제거
      if (!provider.active) {
        this.providers.delete(providerId);
        this.providerDbCache.delete(providerId);
        logger.info(`${provider.name} 제공업체가 비활성화되어 제거되었습니다.`);
        return;
      }
      
      // 새 인스턴스 생성 및 캐싱
      const providerInstance = this.createProviderInstance(provider);
      
      if (providerInstance) {
        this.providers.set(providerId, providerInstance);
        this.providerDbCache.set(providerId, provider);
        logger.info(`${provider.name} 제공업체가 새로고침되었습니다.`);
      } else {
        // 인스턴스 생성 실패 시 캐시에서 제거
        this.providers.delete(providerId);
        this.providerDbCache.delete(providerId);
        logger.warn(`${provider.name} 제공업체 인스턴스 생성 실패`);
      }
    } catch (error) {
      logger.error(`제공업체 새로고침 오류 (ID: ${providerId}):`, error);
      throw new Error(`제공업체 새로고침 실패 (ID: ${providerId})`);
    }
  }

  // 전체 제공업체 새로고침
  public async refreshAllProviders(): Promise<void> {
    try {
      this.providers.clear();
      this.providerDbCache.clear();
      this.initialized = false;
      await this.initialize();
      logger.info('모든 제공업체가 새로고침되었습니다.');
    } catch (error) {
      logger.error('모든 제공업체 새로고침 오류:', error);
      throw new Error('제공업체 새로고침 실패');
    }
  }

  // 모든 제공업체 정보 반환
  public async getProviders(): Promise<any[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return Array.from(this.providerDbCache.values()).map(provider => {
      const providerInstance = this.providers.get(provider.id);
      return {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        available: providerInstance?.isAvailable() || false,
      };
    });
  }

  // 제공업체 ID로 제공업체 인스턴스 조회
  public async getProvider(providerId: string): Promise<IProvider | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    // 캐시된 제공업체 확인
    const cachedProvider = this.providers.get(providerId);
    
    if (cachedProvider) {
      return cachedProvider;
    }
    
    // 캐시에 없는 경우 제공업체 새로고침 시도
    await this.refreshProvider(providerId);
    return this.providers.get(providerId) || null;
  }

  // 제공업체 ID로 DB 제공업체 정보 조회
  public async getProviderDb(providerId: string): Promise<Provider | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 캐시된 DB 제공업체 확인
    const cachedProviderDb = this.providerDbCache.get(providerId);
    
    if (cachedProviderDb) {
      return cachedProviderDb;
    }
    
    // 캐시에 없는 경우 제공업체 새로고침 시도
    await this.refreshProvider(providerId);
    return this.providerDbCache.get(providerId) || null;
  }
}

// 제공업체 관리자 싱글톤 인스턴스
const providerManager = new ProviderManager();

export default providerManager; 