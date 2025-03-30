import { ProviderInterface, ProviderConfig, CompletionOptions, CompletionResponse, Message } from './ProviderInterface';
import { logger } from '../../utils/logger';
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export class GoogleProvider implements ProviderInterface {
  name: string = 'google';
  displayName: string = 'Google Gemini';
  private config: ProviderConfig;
  private client: GoogleGenerativeAI | null = null;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.initClient();
  }

  private initClient(): void {
    try {
      if (this.config.apiKey) {
        this.client = new GoogleGenerativeAI(this.config.apiKey);
      }
    } catch (error) {
      logger.error('Google Gemini 클라이언트 초기화 실패:', error);
      this.client = null;
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  getConfig(): ProviderConfig {
    // API 키는 마스킹하여 반환
    return {
      ...this.config,
      apiKey: this.config.apiKey ? '********' : '',
    };
  }

  updateConfig(config: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...config };
    this.initClient();
  }

  async listModels(): Promise<string[]> {
    // Gemini에서 현재 제공하는 모델들
    return [
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-1.0-pro',
      'gemini-1.0-pro-vision',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];
  }

  private getModelForCompletion(modelName: string): GenerativeModel {
    if (!this.client) {
      throw new Error('Google Gemini 클라이언트가 초기화되지 않았습니다');
    }

    return this.client.getGenerativeModel({
      model: modelName,
      safety_settings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  private mapMessages(messages: Message[], systemPrompt?: string): any[] {
    // Gemini API에 맞는 메시지 형식으로 변환
    const mappedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // 시스템 프롬프트가 있으면 사용자 메시지 앞에 추가
    if (systemPrompt) {
      const userMessages = mappedMessages.filter(msg => msg.role === 'user');
      if (userMessages.length > 0) {
        const firstUserMessage = userMessages[0];
        firstUserMessage.parts.unshift({ text: `${systemPrompt}\n\n` });
      }
    }

    return mappedMessages;
  }

  async getCompletion(options: CompletionOptions): Promise<CompletionResponse> {
    if (!this.client) {
      throw new Error('Google Gemini 클라이언트가 초기화되지 않았습니다');
    }

    try {
      const model = this.getModelForCompletion(options.model);

      // 메시지 형식 준비
      let content: string;
      let result: any;

      if (options.messages && options.messages.length > 0) {
        const chat = model.startChat({
          history: this.mapMessages(options.messages.slice(0, -1), options.systemPrompt),
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens,
          },
        });

        const lastMessage = options.messages[options.messages.length - 1];
        result = await chat.sendMessage(lastMessage.content);
      } else if (options.prompt) {
        // 단일 프롬프트 사용
        let prompt = options.prompt;
        if (options.systemPrompt) {
          prompt = `${options.systemPrompt}\n\n${prompt}`;
        }
        
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens,
          },
        });
      } else {
        throw new Error('메시지 또는 프롬프트가 필요합니다');
      }

      const response = result.response;
      content = response.text();

      // 토큰 사용량 계산
      // Google은 현재 명확한 토큰 카운트 API를 제공하지 않음
      // 단어 기반으로 대략적인 예상치를 제공
      const inputText = options.prompt || 
        options.messages?.map((m) => m.content).join(' ') || '';
      const estimatedPromptTokens = Math.ceil(inputText.split(/\s+/).length * 1.5);
      const estimatedCompletionTokens = Math.ceil(content.split(/\s+/).length * 1.5);

      return {
        id: Math.random().toString(36).substring(2, 15),
        object: 'google.completion',
        created: Math.floor(Date.now() / 1000),
        model: options.model,
        content: content,
        promptTokens: estimatedPromptTokens,
        completionTokens: estimatedCompletionTokens,
        totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
        provider: this.name,
        rawResponse: response
      };
    } catch (error) {
      logger.error('Google Gemini 완성 요청 중 오류:', error);
      throw new Error('Google Gemini API 요청 중 오류가 발생했습니다');
    }
  }

  async *streamCompletion(options: CompletionOptions): AsyncIterable<any> {
    if (!this.client) {
      throw new Error('Google Gemini 클라이언트가 초기화되지 않았습니다');
    }

    try {
      const model = this.getModelForCompletion(options.model);

      let streamingResponse;

      if (options.messages && options.messages.length > 0) {
        const chat = model.startChat({
          history: this.mapMessages(options.messages.slice(0, -1), options.systemPrompt),
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens,
          },
        });

        const lastMessage = options.messages[options.messages.length - 1];
        streamingResponse = await chat.sendMessageStream(lastMessage.content);
      } else if (options.prompt) {
        // 단일 프롬프트 사용
        let prompt = options.prompt;
        if (options.systemPrompt) {
          prompt = `${options.systemPrompt}\n\n${prompt}`;
        }
        
        streamingResponse = await model.generateContentStream({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens,
          },
        });
      } else {
        throw new Error('메시지 또는 프롬프트가 필요합니다');
      }

      for await (const chunk of streamingResponse.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield {
            content: chunkText,
            done: false
          };
        }
      }

      // 스트림 완료
      yield {
        content: '',
        done: true
      };
    } catch (error) {
      logger.error('Google Gemini 스트리밍 요청 중 오류:', error);
      throw new Error('Google Gemini API 스트리밍 요청 중 오류가 발생했습니다');
    }
  }
}
