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
      logger.error('OpenAI provider is not available');
      return [];
    }

    try {
      logger.info('Fetching models from OpenAI API...');
      const response = await this.client!.models.list();
      
      // 모델 데이터 가공
      const models: IModel[] = [];
      
      for (const model of response.data) {
        // 모델 ID 기준으로 가격 및 기능 정보 설정
        const modelInfo = this.getModelInfo(model.id);
        
        models.push({
          id: model.id,
          name: model.id,
          contextWindow: modelInfo.contextWindow,
          inputPrice: modelInfo.inputPrice,
          outputPrice: modelInfo.outputPrice,
          features: modelInfo.features
        });
      }
      
      logger.info(`Successfully fetched ${models.length} models from OpenAI API`);
      return models;
    } catch (error) {
      logger.error(`Error fetching OpenAI models: ${error}`);
      return [];
    }
  }

  // 모델별 정보 (컨텍스트 윈도우, 가격, 기능) 반환
  private getModelInfo(modelId: string): { 
    contextWindow: number | undefined; 
    inputPrice: number | undefined;
    outputPrice: number | undefined;
    features: string[];
  } {
    // 기본 값
    const result = {
      contextWindow: undefined as number | undefined,
      inputPrice: undefined as number | undefined,
      outputPrice: undefined as number | undefined,
      features: ['text'] as string[]
    };
    
    // 컨텍스트 윈도우 설정
    const contextWindows: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-4-turbo': 128000,
      'gpt-4-1106-preview': 128000,
      'gpt-4-0125-preview': 128000,
      'gpt-4-vision-preview': 128000,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384,
      'gpt-3.5-turbo-0125': 16385,
      'gpt-3.5-turbo-instruct': 4096
    };
    
    // 입력 토큰 가격 (USD per 1M tokens)
    const inputPrices: Record<string, number> = {
      'gpt-4': 0.03,
      'gpt-4-32k': 0.06,
      'gpt-4-turbo': 0.01,
      'gpt-4-1106-preview': 0.01,
      'gpt-4-0125-preview': 0.01,
      'gpt-4-vision-preview': 0.01,
      'gpt-3.5-turbo': 0.0015,
      'gpt-3.5-turbo-16k': 0.003,
      'gpt-3.5-turbo-0125': 0.0005,
      'gpt-3.5-turbo-instruct': 0.0015
    };
    
    // 출력 토큰 가격 (USD per 1M tokens)
    const outputPrices: Record<string, number> = {
      'gpt-4': 0.06,
      'gpt-4-32k': 0.12,
      'gpt-4-turbo': 0.03,
      'gpt-4-1106-preview': 0.03,
      'gpt-4-0125-preview': 0.03,
      'gpt-4-vision-preview': 0.03,
      'gpt-3.5-turbo': 0.002,
      'gpt-3.5-turbo-16k': 0.004,
      'gpt-3.5-turbo-0125': 0.0015,
      'gpt-3.5-turbo-instruct': 0.002
    };
    
    // 정확한 일치부터 시도하고, 없으면 부분 일치로 설정
    if (contextWindows[modelId]) {
      result.contextWindow = contextWindows[modelId];
    } else {
      // 부분 일치 시도
      for (const [key, value] of Object.entries(contextWindows)) {
        if (modelId.includes(key)) {
          result.contextWindow = value;
          break;
        }
      }
    }
    
    // 가격 정보 설정 (1M 토큰당 가격을 1K 토큰당 가격으로 변환)
    if (inputPrices[modelId]) {
      result.inputPrice = inputPrices[modelId] / 1000;
    } else {
      for (const [key, value] of Object.entries(inputPrices)) {
        if (modelId.includes(key)) {
          result.inputPrice = value / 1000;
          break;
        }
      }
    }
    
    if (outputPrices[modelId]) {
      result.outputPrice = outputPrices[modelId] / 1000;
    } else {
      for (const [key, value] of Object.entries(outputPrices)) {
        if (modelId.includes(key)) {
          result.outputPrice = value / 1000;
          break;
        }
      }
    }
    
    // 특수 기능 설정
    if (modelId.includes('vision') || modelId.includes('gpt-4-turbo')) {
      result.features.push('images');
    }
    
    return result;
  }

  public async completion(request: ICompletionRequest): Promise<ICompletionResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI provider is not available');
    }

    try {
      const defaultModel = this.settings?.defaultModel || 'gpt-3.5-turbo';
      
      // o4 모델 계열은 temperature 파라미터를 지원하지 않아 제외
      const isO4Model = request.model.startsWith('o4-');
      
      // 모델별 파라미터 설정
      const params: any = {
        model: request.model || defaultModel,
        prompt: request.prompt,
        max_tokens: this.validateMaxTokens(request.maxTokens),
      };

      // o4 모델이 아닌 경우에만 temperature 적용
      if (!isO4Model && request.temperature !== undefined) {
        params.temperature = request.temperature;
      }

      // 요청 로깅
      logger.info(`OpenAI 텍스트 완성 요청: 모델=${request.model}, temperature=${isO4Model ? '(지원 안 함)' : request.temperature || 0.7}`);
      
      const response = await this.client!.completions.create(params);

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

      // o4 모델 계열은 temperature 파라미터를 지원하지 않아 제외
      const isO4Model = request.model.startsWith('o4-');
      
      // 모델별 파라미터 설정
      const params: any = {
        model: request.model || defaultModel,
        messages: messages as any[],
        max_tokens: this.validateMaxTokens(request.maxTokens),
      };

      // o4 모델이 아닌 경우에만 temperature 적용
      if (!isO4Model && request.temperature !== undefined) {
        params.temperature = request.temperature;
      }

      // 요청 로깅
      logger.info(`OpenAI 채팅 요청: 모델=${request.model}, temperature=${isO4Model ? '(지원 안 함)' : request.temperature || 0.7}`);

      const response = await this.client!.chat.completions.create(params);

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