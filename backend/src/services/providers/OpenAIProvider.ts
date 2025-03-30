import OpenAI from 'openai';
import { ProviderInterface, ProviderConfig, CompletionOptions, CompletionResponse, Message } from './ProviderInterface';
import { logger } from '../../utils/logger';

export class OpenAIProvider implements ProviderInterface {
  name: string = 'openai';
  displayName: string = 'OpenAI';
  private config: ProviderConfig;
  private client: OpenAI | null = null;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.initClient();
  }

  private initClient(): void {
    try {
      if (this.config.apiKey) {
        this.client = new OpenAI({
          apiKey: this.config.apiKey,
          organization: this.config.organization,
          baseURL: this.config.baseUrl
        });
      }
    } catch (error) {
      logger.error('OpenAI 클라이언트 초기화 실패:', error);
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
    if (!this.client) {
      throw new Error('OpenAI 클라이언트가 초기화되지 않았습니다');
    }

    try {
      const response = await this.client.models.list();
      // OpenAI 모델 중 GPT 모델만 필터링
      const gptModels = response.data
        .filter(model => 
          model.id.includes('gpt') || 
          model.id.includes('text-davinci') ||
          model.id.includes('dall-e')
        )
        .map(model => model.id);
      
      return gptModels;
    } catch (error) {
      logger.error('OpenAI 모델 목록 조회 중 오류:', error);
      
      // OpenAI API에서 모델 리스트를 가져오는데 실패하면 주요 모델 하드코딩
      return [
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
        'dall-e-3',
        'dall-e-2'
      ];
    }
  }

  async getCompletion(options: CompletionOptions): Promise<CompletionResponse> {
    if (!this.client) {
      throw new Error('OpenAI 클라이언트가 초기화되지 않았습니다');
    }

    try {
      let messages: any[] = [];
      
      // 시스템 메시지 추가
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }
      
      // 메시지 또는 프롬프트 사용
      if (options.messages && options.messages.length > 0) {
        // 기존 메시지 사용
        messages = [...messages, ...options.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))];
      } else if (options.prompt) {
        // 단일 프롬프트를 사용자 메시지로 변환
        messages.push({
          role: 'user',
          content: options.prompt
        });
      }

      const completion = await this.client.chat.completions.create({
        model: options.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop
      });

      const content = completion.choices[0]?.message?.content || '';

      return {
        id: completion.id,
        object: completion.object,
        created: completion.created,
        model: completion.model,
        content,
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
        provider: this.name,
        rawResponse: completion
      };
    } catch (error) {
      logger.error('OpenAI 완성 요청 중 오류:', error);
      throw new Error('OpenAI API 요청 중 오류가 발생했습니다');
    }
  }

  async *streamCompletion(options: CompletionOptions): AsyncIterable<any> {
    if (!this.client) {
      throw new Error('OpenAI 클라이언트가 초기화되지 않았습니다');
    }

    try {
      let messages: any[] = [];
      
      // 시스템 메시지 추가
      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }
      
      // 메시지 또는 프롬프트 사용
      if (options.messages && options.messages.length > 0) {
        messages = [...messages, ...options.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))];
      } else if (options.prompt) {
        messages.push({
          role: 'user',
          content: options.prompt
        });
      }

      const stream = await this.client.chat.completions.create({
        model: options.model,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        frequency_penalty: options.frequencyPenalty,
        presence_penalty: options.presencePenalty,
        stop: options.stop,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield {
            content,
            done: false
          };
        }
      }

      // 스트림 완료
      yield {
        content: '',
        done: true,
        // 토큰 정보 제공
        tokens: {
          // OpenAI 스트림에서는 정확한 토큰 수를 제공하지 않아 나중에 로그에서 추정됨
          promptTokens: 0,
          completionTokens: 0
        }
      };
    } catch (error) {
      logger.error('OpenAI 스트리밍 요청 중 오류:', error);
      throw new Error('OpenAI API 스트리밍 요청 중 오류가 발생했습니다');
    }
  }
}
