/**
 * AI 제공자 공통 인터페이스 정의
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  organization?: string;
  modelOptions?: Record<string, any>;
  isActive?: boolean;
}

export interface CompletionOptions {
  model: string;
  messages?: Message[];
  prompt?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  provider: string;
  rawResponse?: any;
}

export interface ProviderInterface {
  name: string;
  displayName: string;
  
  /**
   * 프로바이더 설정이 완료되었는지 확인
   */
  isConfigured(): boolean;
  
  /**
   * 프로바이더 설정 가져오기 (API 키는 마스킹 처리)
   */
  getConfig(): ProviderConfig;
  
  /**
   * 프로바이더 설정 업데이트
   */
  updateConfig(config: Partial<ProviderConfig>): void;
  
  /**
   * 사용 가능한 모델 목록 가져오기
   */
  listModels(): Promise<string[]>;
  
  /**
   * 텍스트 완성 요청
   */
  getCompletion(options: CompletionOptions): Promise<CompletionResponse>;
  
  /**
   * 스트리밍 텍스트 완성 요청
   */
  streamCompletion(options: CompletionOptions): AsyncIterable<any>;
}
