/**
 * 프로바이더 관리자 - AI 프로바이더와의 통신 관리
 * 
 * 이 모듈은 OpenAI, Anthropic, Google AI 등의 다양한 AI 프로바이더와
 * 통신하기 위한 인터페이스를 제공합니다.
 */

// 프로바이더 유형 정의
export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
}

// 프로바이더 설정 인터페이스
export interface ProviderConfig {
  id: string;
  type: ProviderType;
  apiKey: string;
  active: boolean;
  defaultModel?: string;
  options?: Record<string, any>;
}

// 단일 프로바이더 인터페이스
export interface Provider {
  getType(): ProviderType;
  isAvailable(): boolean;
  completion(prompt: string, options?: any): Promise<any>;
}

// 프로바이더 관리자 클래스 (초기 구현)
class ProviderManager {
  private providers: Map<ProviderType, Provider> = new Map();
  
  constructor() {
    // 이후 단계에서 DB에서 프로바이더 구성을 로드할 예정
    console.log('Provider Manager initialized');
  }

  // 등록된 프로바이더 목록 반환
  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  // 특정 유형의 프로바이더 반환
  getProvider(type: ProviderType): Provider | null {
    return this.providers.get(type) || null;
  }
}

export default new ProviderManager(); 