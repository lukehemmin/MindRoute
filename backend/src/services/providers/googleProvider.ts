import { AIProvider, ChatCompletionOptions, CompletionResponse, ApiError } from './baseProvider';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

export class GoogleProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'gemini-1.5-pro') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.defaultModel = defaultModel;
  }

  getName(): string {
    return 'Google AI (Gemini)';
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async listModels(): Promise<string[]> {
    // Google Gemini 모델 목록 (API가 정식으로 제공되지 않아 수동으로 목록을 제공)
    return [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-1.0-pro-vision'
    ];
  }

  async getChatCompletion(options: ChatCompletionOptions): Promise<CompletionResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: options.model || this.defaultModel
      });

      // OpenAI 형식의 메시지를 Google 형식으로 변환
      const history = [];
      let systemPrompt = '';

      for (const msg of options.messages) {
        if (msg.role === 'system') {
          systemPrompt += msg.content + '\n';
        } else if (msg.role === 'user' || msg.role === 'assistant') {
          history.push({
            role: msg.role,
            parts: [{ text: msg.content }]
          });
        }
      }

      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: options.temperature || 0.7,
          topP: options.topP || 1,
          maxOutputTokens: options.maxTokens,
        }
      });

      let lastUserMessage = options.messages[options.messages.length - 1].content;
      if (options.messages[options.messages.length - 1].role !== 'user') {
        lastUserMessage = "계속해서 응답을 생성해주세요.";
      }

      if (systemPrompt) {
        lastUserMessage = `${systemPrompt}\n\n${lastUserMessage}`;
      }

      const result = await chat.sendMessage(lastUserMessage);
      const response = await result.response;
      const text = response.text();

      // Google API는 현재 토큰 사용량 정보를 제공하지 않으므로 대략적인 추정을 제공
      const estimatedPromptTokens = Math.ceil(JSON.stringify(options.messages).length / 4);
      const estimatedCompletionTokens = Math.ceil(text.length / 4);
      
      return {
        id: `google-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: options.model || this.defaultModel,
        content: text,
        usage: {
          promptTokens: estimatedPromptTokens,
          completionTokens: estimatedCompletionTokens,
          totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
        }
      };
    } catch (error: any) {
      throw new ApiError(`Google AI 요청 실패: ${error.message}`, 500);
    }
  }
}
