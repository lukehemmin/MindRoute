import { ProviderType, IProvider, IModel, IChatRequest, IChatResponse, ICompletionRequest, ICompletionResponse } from '../../utils/providerManager';
import { decrypt } from '../../utils/encryption';
import logger from '../../utils/logger';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements IProvider {
  private client: Anthropic | null = null;
  private available: boolean = false;
  private apiKey: string;
  private settings: Record<string, any>;

  constructor(apiKey: string, settings: Record<string, any> = {}) {
    this.apiKey = apiKey;
    this.settings = settings;
    this.initialize();
  }

  private initialize(): void {
    try {
      // Anthropic 클라이언트 초기화
      this.client = new Anthropic({
        apiKey: this.apiKey
      });

      this.available = true;
      logger.info(`Anthropic provider initialized`);
    } catch (error) {
      logger.error(`Failed to initialize Anthropic provider: ${error}`);
      this.available = false;
    }
  }

  public getType(): ProviderType {
    return ProviderType.ANTHROPIC;
  }

  public isAvailable(): boolean {
    return this.available && this.client !== null;
  }

  public async getModels(): Promise<IModel[]> {
    // Anthropic doesn't provide a model list API endpoint
    // 따라서 하드코딩된 모델 목록 제공
    const models = [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
    
    return models.map(modelId => ({
      id: modelId,
      name: modelId,
      // 일부 모델에 대한 추가 정보 제공
      contextWindow: this.getContextWindowForModel(modelId),
      features: this.getFeaturesForModel(modelId)
    }));
  }

  // 모델별 컨텍스트 윈도우 크기 반환
  private getContextWindowForModel(modelId: string): number | undefined {
    const contextWindows: Record<string, number> = {
      'claude-3-opus-20240229': 200000,
      'claude-3-sonnet-20240229': 180000,
      'claude-3-haiku-20240307': 150000,
      'claude-2.1': 100000,
      'claude-2.0': 100000,
      'claude-instant-1.2': 100000,
    };
    
    return contextWindows[modelId];
  }

  // 모델별 지원 기능 반환
  private getFeaturesForModel(modelId: string): string[] {
    const features: string[] = ['text'];
    
    if (modelId.startsWith('claude-3')) {
      features.push('images');
    }
    
    return features;
  }

  public async completion(request: ICompletionRequest): Promise<ICompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic provider is not available');
    }

    try {
      const defaultModel = this.settings?.defaultModel || 'claude-3-haiku-20240307';
      
      const response = await this.client!.completions.create({
        model: request.model || defaultModel,
        prompt: request.prompt,
        max_tokens_to_sample: this.validateMaxTokens(request.maxTokens || 1024),
        temperature: request.temperature || 0.7,
      });

      // 응답을 표준 형식으로 변환
      return {
        text: response.completion || '',
        usage: {
          // Anthropic API는 토큰 수를 제공하지 않으므로 추정
          promptTokens: this.estimateTokenCount(request.prompt),
          completionTokens: this.estimateTokenCount(response.completion || ''),
          totalTokens: this.estimateTokenCount(request.prompt + (response.completion || '')),
        }
      };
    } catch (error) {
      logger.error(`Anthropic completion error: ${error}`);
      throw error;
    }
  }

  public async chat(request: IChatRequest): Promise<IChatResponse> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic provider is not available');
    }

    try {
      const defaultModel = this.settings?.defaultModel || 'claude-3-haiku-20240307';
      
      // Anthropic의 메시지 형식으로 변환
      const formattedMessages = this.formatMessages(request.messages);
      
      // 이미지 처리
      let media: any[] = [];
      if (request.files && request.files.length > 0) {
        media = this.processImagesForChat(request.files);
      }

      const response = await this.client!.messages.create({
        model: request.model || defaultModel,
        messages: formattedMessages,
        ...(media.length > 0 ? { media } : {}),
        max_tokens: this.validateMaxTokens(request.maxTokens || 1024),
        temperature: request.temperature || 0.7,
      });

      // 응답을 표준 형식으로 변환
      let content = '';
      if (response.content && response.content.length > 0) {
        const firstBlock = response.content[0];
        if ('text' in firstBlock) {
          content = firstBlock.text;
        } else {
          content = JSON.stringify(firstBlock);
        }
      }
        
      return {
        message: {
          role: 'assistant',
          content,
        },
        usage: {
          // Anthropic API는 사용량 정보를 반환하지 않으므로 추정
          promptTokens: this.estimateTokenCount(JSON.stringify(formattedMessages)),
          completionTokens: this.estimateTokenCount(content),
          totalTokens: this.estimateTokenCount(JSON.stringify(formattedMessages) + content),
        }
      };
    } catch (error) {
      logger.error(`Anthropic chat error: ${error}`);
      throw error;
    }
  }

  // 단순 토큰 수 추정 (정확하지 않음)
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // OpenAI 형식의 메시지를 Anthropic 형식으로 변환
  private formatMessages(messages: any[]): any[] {
    return messages.map(msg => {
      let role = msg.role;
      
      // OpenAI의 'system'은 Anthropic에서는 다르게 처리됨
      if (role === 'system') {
        role = 'user';
      } else if (role === 'assistant') {
        role = 'assistant';
      } else {
        role = 'user';
      }
      
      return {
        role,
        content: msg.content
      };
    });
  }

  // 이미지를 Anthropic의 메시지 포맷에 맞게 처리
  private processImagesForChat(files: any[]): any[] {
    // 이미지 파일 필터링
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    return imageFiles.map(image => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.type,
        data: typeof image.content === 'string' 
          ? image.content 
          : image.content.toString('base64'),
      }
    }));
  }

  // 최대 토큰 수 검증
  private validateMaxTokens(requestedTokens: number): number {
    const maxTokens = this.settings?.maxTokens || null;
    
    // 기본값 설정
    const defaultTokens = 1024;
    
    // 제한이 없는 경우 요청된 토큰 사용
    if (maxTokens === null) {
      return requestedTokens || defaultTokens;
    }
    
    // 요청된 토큰이 제한보다 큰 경우 제한 반환
    return Math.min(requestedTokens || defaultTokens, maxTokens);
  }
} 