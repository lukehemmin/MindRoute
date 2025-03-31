export interface ChatCompletionOptions {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  getName(): string;
  getChatCompletion(options: ChatCompletionOptions): Promise<CompletionResponse>;
  listModels(): Promise<string[]>;
  getDefaultModel(): string;
}

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
