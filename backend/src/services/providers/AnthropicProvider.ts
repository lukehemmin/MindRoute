import Anthropic from '@anthropic-ai/sdk';
import { ProviderInterface, ProviderConfig, CompletionOptions, CompletionResponse, Message } from './ProviderInterface';
import { logger } from '../../utils/logger';

export class AnthropicProvider implements ProviderInterface {
  name: string = 'anthropic';
  displayName: string = 'Anthropic Claude';
  private config: ProviderConfig;
  private client: Anthropic | null = null;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.initClient();
  }

  private initClient(): void {
    try {
      if (this.config.apiKey) {
        this.client = new Anthropic({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseUrl
        });
      }
    } catch (error) {
      logger.error('Anthropic 클라이언트 초기화 실패:', error);
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
    // Anthropic은 API를 통한 모델 리스트 조회를 제공하지 않음
    // 최신 모델 목록을 하드코딩으로 제공
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
  }

  private transformMessages(messages: Message[], systemPrompt?: string): any[] {
    // Anthropic API에 맞게 메시지 형식 변환
    return messages.map((msg) => {
      return {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      };
    });
  }

  async getCompletion(options: CompletionOptions): Promise<CompletionResponse> {
    if (!this.client) {
      throw new Error('Anthropic 클라이언트가 초기화되지 않았습니다');
    }

    try {
      let requestParams: any = {
        model: options.model,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      };

      // 시스템 프롬프트 처리
      if (options.systemPrompt) {
        requestParams.system = options.systemPrompt;
      }

      // 메시지 또는 프롬프트 처리
      if (options.messages && options.messages.length > 0) {
        requestParams.messages = this.transformMessages(options.messages);
      } else if (options.prompt) {
        requestParams.messages = [
          { role: 'user', content: options.prompt }
        ];
      } else {
        throw new Error('메시지 또는 프롬프트가 필요합니다');
      }

      const result = await this.client.messages.create(requestParams);

      const content = result.content[0]?.text || '';

      return {
        id: result.id,
        object: 'anthropic.completion',
        created: Math.floor(Date.now() / 1000),
        model: options.model,
        content: content,
        promptTokens: result.usage.input_tokens || 0,
        completionTokens: result.usage.output_tokens || 0,
        totalTokens: (result.usage.input_tokens || 0) + (result.usage.output_tokens || 0),
        provider: this.name,
        rawResponse: result
      };
    } catch (error) {
      logger.error('Anthropic 완성 요청 중 오류:', error);
      throw new Error('Anthropic API 요청 중 오류가 발생했습니다');
    }
  }

  async *streamCompletion(options: CompletionOptions): AsyncIterable<any> {
    if (!this.client) {
      throw new Error('Anthropic 클라이언트가 초기화되지 않았습니다');
    }

    try {
      let requestParams: any = {
        model: options.model,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        stream: true
      };

      // 시스템 프롬프트 처리
      if (options.systemPrompt) {
        requestParams.system = options.systemPrompt;
      }

      // 메시지 또는 프롬프트 처리
      if (options.messages && options.messages.length > 0) {
        requestParams.messages = this.transformMessages(options.messages);
      } else if (options.prompt) {
        requestParams.messages = [
          { role: 'user', content: options.prompt }
        ];
      } else {
        throw new Error('메시지 또는 프롬프트가 필요합니다');
      }

      const stream = await this.client.messages.create(requestParams);

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.text) {
          yield {
            content: chunk.delta.text,
            done: false
          };
        } 
      }

      // 스트림 완료
      yield {
        content: '',
        done: true,
        // 토큰 정보가 있다면 제공 (스트림에서는 제공되지 않을 수 있음)
        tokens: {
          promptTokens: 0,
          completionTokens: 0
        }
      };
    } catch (error) {
      logger.error('Anthropic 스트리밍 요청 중 오류:', error);
      throw new Error('Anthropic API 스트리밍 요청 중 오류가 발생했습니다');
    }
  }
}
