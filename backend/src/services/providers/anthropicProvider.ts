import { AIProvider, ChatCompletionOptions, CompletionResponse, ApiError } from './baseProvider';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'claude-3-opus-20240229') {
    this.client = new Anthropic({ apiKey });
    this.defaultModel = defaultModel;
  }

  getName(): string {
    return 'Anthropic Claude';
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async listModels(): Promise<string[]> {
    // Anthropic은 현재 공식 모델 목록 API를 제공하지 않으므로 수동으로 목록을 제공합니다
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
  }

  async getChatCompletion(options: ChatCompletionOptions): Promise<CompletionResponse> {
    try {
      // OpenAI 형식의 메시지를 Anthropic 형식으로 변환
      const messages = options.messages.map(msg => {
        if (msg.role === 'user') {
          return { role: 'user', content: msg.content };
        } else if (msg.role === 'assistant') {
          return { role: 'assistant', content: msg.content };
        } else if (msg.role === 'system') {
          return { role: 'system', content: msg.content };
        }
        return { role: 'user', content: msg.content };
      });

      const response = await this.client.messages.create({
        model: options.model || this.defaultModel,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP || 1,
      });

      return {
        id: response.id,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: response.model,
        content: response.content[0]?.text || '',
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        }
      };
    } catch (error: any) {
      throw new ApiError(`Anthropic 요청 실패: ${error.message}`, 500);
    }
  }
}
