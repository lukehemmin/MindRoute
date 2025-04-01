import { ProviderType, IProvider, IModel, IChatRequest, IChatResponse, ICompletionRequest, ICompletionResponse } from '../../utils/providerManager';
import { decrypt } from '../../utils/encryption';
import logger from '../../utils/logger';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export class GoogleAIProvider implements IProvider {
  private client: GoogleGenerativeAI | null = null;
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
      // Google AI 클라이언트 초기화
      this.client = new GoogleGenerativeAI(this.apiKey);

      this.available = true;
      logger.info(`Google AI provider initialized`);
    } catch (error) {
      logger.error(`Failed to initialize Google AI provider: ${error}`);
      this.available = false;
    }
  }

  public getType(): ProviderType {
    return ProviderType.GOOGLE;
  }

  public isAvailable(): boolean {
    return this.available && this.client !== null;
  }

  public async getModels(): Promise<IModel[]> {
    // Google AI는 현재 API를 통한 모델 목록을 제공하지 않음
    // 하드코딩된 모델 목록 제공
    const models = [
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
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
      'gemini-pro': 32768,
      'gemini-pro-vision': 16384,
      'gemini-1.5-pro': 1000000,
      'gemini-1.5-flash': 1000000,
    };
    
    return contextWindows[modelId];
  }

  // 모델별 지원 기능 반환
  private getFeaturesForModel(modelId: string): string[] {
    const features: string[] = ['text'];
    
    if (modelId.includes('-vision') || modelId === 'gemini-1.5-pro' || modelId === 'gemini-1.5-flash') {
      features.push('images');
    }
    
    return features;
  }

  public async completion(request: ICompletionRequest): Promise<ICompletionResponse> {
    // Google AI Gemini는 완전한 completion API가 없어서 chat API로 라우팅
    const messages = [
      { role: 'user', content: request.prompt }
    ];
    
    const chatRequest: IChatRequest = {
      messages,
      model: request.model,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    };
    
    const response = await this.chat(chatRequest);
    
    // 응답 형식 변환
    return {
      text: typeof response.message.content === 'string' 
        ? response.message.content 
        : JSON.stringify(response.message.content),
      usage: response.usage
    };
  }

  public async chat(request: IChatRequest): Promise<IChatResponse> {
    if (!this.isAvailable()) {
      throw new Error('Google AI provider is not available');
    }

    try {
      const defaultModel = this.settings?.defaultModel || 'gemini-pro';
      
      // 메시지 형식 변환
      const formattedMessages = this.formatMessages(request.messages);
      
      // 모델 가져오기
      const model = this.client!.getGenerativeModel({
        model: request.model || defaultModel,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          }
        ],
      });

      // 이미지 처리
      let content: any[] = [];
      if (request.files && request.files.length > 0) {
        content = this.processImagesForChat(formattedMessages, request.files);
      } else {
        content = formattedMessages;
      }

      // 생성 시작
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: content }],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: this.validateMaxTokens(request.maxTokens),
        },
      });

      const response = result.response;
      const responseText = response.text();
      
      // 표준 형식으로 변환
      return {
        message: {
          role: 'assistant',
          content: responseText,
        },
        // Google AI에서는 토큰 사용량을 제공하지 않으므로 추정값을 사용
        usage: {
          promptTokens: this.estimateTokenCount(JSON.stringify(content)),
          completionTokens: this.estimateTokenCount(responseText),
          totalTokens: this.estimateTokenCount(JSON.stringify(content) + responseText),
        },
      };
    } catch (error) {
      logger.error(`Google AI chat error: ${error}`);
      throw error;
    }
  }

  // OpenAI 형식의 메시지를 Google AI 형식으로 변환
  private formatMessages(messages: any[]): any[] {
    const result: any[] = [];

    for (const msg of messages) {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      result.push({ text: content });
    }

    return result;
  }

  // 이미지를 Google AI 메시지 포맷에 맞게 처리
  private processImagesForChat(messages: any[], files: any[]): any[] {
    const result = [...messages];
    
    // 이미지 파일 필터링
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // 각 이미지 추가
    for (const image of imageFiles) {
      result.push({
        inlineData: {
          mimeType: image.type,
          data: typeof image.content === 'string' 
            ? image.content 
            : image.content.toString('base64')
        }
      });
    }
    
    return result;
  }

  // 단순 토큰 수 추정 (정확하지 않음)
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // 최대 토큰 수 검증
  private validateMaxTokens(requestedTokens?: number): number | undefined {
    const maxTokens = this.settings?.maxTokens || null;
    
    // 제한이 없거나 요청된 토큰이 없는 경우 undefined 반환
    if (maxTokens === null || requestedTokens === undefined) {
      return undefined;
    }
    
    // Google Gemini의 기본 제한 적용
    const geminiLimit = 2048;
    const effectiveLimit = maxTokens === null ? geminiLimit : Math.min(geminiLimit, maxTokens);
    
    // 요청된 토큰이 제한보다 큰 경우 제한 반환
    return Math.min(requestedTokens, effectiveLimit);
  }
} 