import { ProviderType, IProvider, IModel, IChatRequest, IChatResponse, ICompletionRequest, ICompletionResponse } from '../../utils/providerManager';
import { Provider } from '../../models/provider.model';
import { decrypt } from '../../utils/encryption';
import logger from '../../utils/logger';
import OpenAI from 'openai';

export class OpenAIProvider implements IProvider {
  private client: OpenAI | null = null;
  private available: boolean = false;
  private apiKey: string;
  private endpointUrl?: string;
  private settings: Record<string, any>;

  constructor(apiKey: string, endpointUrl?: string, settings: Record<string, any> = {}) {
    this.apiKey = apiKey;
    this.endpointUrl = endpointUrl;
    this.settings = settings;
    this.initialize();
  }

  private initialize(): void {
    try {
      // OpenAI 클라이언트 초기화
      this.client = new OpenAI({
        apiKey: this.apiKey,
        ...(this.endpointUrl ? { baseURL: this.endpointUrl } : {})
      });

      this.available = true;
      logger.info(`OpenAI provider initialized`);
    } catch (error) {
      logger.error(`Failed to initialize OpenAI provider: ${error}`);
      this.available = false;
    }
  }

  public getType(): ProviderType {
    return ProviderType.OPENAI;
  }

  public isAvailable(): boolean {
    return this.available && this.client !== null;
  }

  public async getModels(): Promise<IModel[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const response = await this.client!.models.list();
      return response.data.map(model => ({
        id: model.id,
        name: model.id,
        // 일부 모델에 대한 추가 정보 제공
        contextWindow: this.getContextWindowForModel(model.id),
        features: this.getFeaturesForModel(model.id)
      }));
    } catch (error) {
      logger.error(`Error fetching OpenAI models: ${error}`);
      return [];
    }
  }

  // 모델별 컨텍스트 윈도우 크기 반환
  private getContextWindowForModel(modelId: string): number | undefined {
    const contextWindows: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-4-turbo': 128000,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384,
    };
    
    // 정확한 일치가 없는 경우 부분 일치 시도
    for (const [key, value] of Object.entries(contextWindows)) {
      if (modelId.includes(key)) {
        return value;
      }
    }
    
    return undefined;
  }

  // 모델별 지원 기능 반환
  private getFeaturesForModel(modelId: string): string[] {
    const features: string[] = ['text'];
    
    if (modelId.includes('gpt-4-vision') || modelId.includes('gpt-4-turbo')) {
      features.push('images');
    }
    
    return features;
  }

  public async completion(request: ICompletionRequest): Promise<ICompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI provider is not available');
    }

    try {
      const defaultModel = this.settings?.defaultModel || 'gpt-3.5-turbo';
      
      const response = await this.client!.completions.create({
        model: request.model || defaultModel,
        prompt: request.prompt,
        max_tokens: this.validateMaxTokens(request.maxTokens),
        temperature: request.temperature || 0.7,
      });

      // OpenAI 응답을 표준 형식으로 변환
      return {
        text: response.choices[0]?.text || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        }
      };
    } catch (error) {
      logger.error(`OpenAI completion error: ${error}`);
      throw error;
    }
  }

  public async chat(request: IChatRequest): Promise<IChatResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI provider is not available');
    }

    try {
      const defaultModel = this.settings?.defaultModel || 'gpt-3.5-turbo';
      
      // 이미지 처리
      let messages = [...request.messages];
      if (request.files && request.files.length > 0) {
        messages = this.processImagesForChat(messages, request.files);
      }

      const response = await this.client!.chat.completions.create({
        model: request.model || defaultModel,
        messages: messages as any[],
        max_tokens: this.validateMaxTokens(request.maxTokens),
        temperature: request.temperature || 0.7,
      });

      // OpenAI 응답을 표준 형식으로 변환
      return {
        message: {
          role: 'assistant',
          content: response.choices[0]?.message?.content || '',
        },
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        }
      };
    } catch (error) {
      logger.error(`OpenAI chat error: ${error}`);
      throw error;
    }
  }

  // 이미지를 OpenAI의 채팅 포맷에 맞게 처리
  private processImagesForChat(messages: any[], files: any[]): any[] {
    // messages 배열의 마지막 사용자 메시지를 찾아 이미지 추가
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const content = Array.isArray(messages[i].content) ? messages[i].content : [{ type: 'text', text: messages[i].content }];
        
        // 이미지 파일 필터링
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        // 각 이미지에 대해 내용 추가
        const imageContents = imageFiles.map(image => ({
          type: 'image_url',
          image_url: {
            url: `data:${image.type};base64,${image.content.toString('base64')}`,
          }
        }));
        
        messages[i].content = [...content, ...imageContents];
        break;
      }
    }
    
    return messages;
  }

  // 최대 토큰 수 검증
  private validateMaxTokens(requestedTokens?: number): number | undefined {
    const maxTokens = this.settings?.maxTokens || null;
    
    // 제한이 없거나 요청된 토큰이 없는 경우 undefined 반환
    if (maxTokens === null || requestedTokens === undefined) {
      return undefined;
    }
    
    // 요청된 토큰이 제한보다 큰 경우 제한 반환
    return Math.min(requestedTokens, maxTokens);
  }
} 