import OpenAI from 'openai';
import { AIProvider, ChatCompletionOptions, CompletionResponse, ApiError } from './baseProvider';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'gpt-4') {
    this.client = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
  }

  getName(): string {
    return 'OpenAI';
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      // 일반적으로 사용되는 모델만 필터링
      const commonModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'];
      return response.data
        .filter(model => commonModels.some(commonModel => model.id.includes(commonModel)))
        .map(model => model.id);
    } catch (error: any) {
      throw new ApiError(`OpenAI 모델 목록 조회 실패: ${error.message}`, 500);
    }
  }

  async getChatCompletion(options: ChatCompletionOptions): Promise<CompletionResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
      });

      return {
        id: response.id,
        object: response.object,
        created: response.created,
        model: response.model,
        content: response.choices[0]?.message?.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        }
      };
    } catch (error: any) {
      throw new ApiError(`OpenAI 요청 실패: ${error.message}`, 500);
    }
  }
}
