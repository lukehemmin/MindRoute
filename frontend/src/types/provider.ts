// 제공업체 모델 인터페이스
export interface Provider {
  id: string;
  name: string;
  type: string;
  description?: string;
  available: boolean;
  apiEndpoint?: string;
}

// AI 모델 인터페이스
export interface AIModel {
  id: string;
  providerId: string;
  name: string;
  modelId: string;
  allowImages: boolean;
  allowVideos: boolean;
  allowFiles: boolean;
  maxTokens?: number;
  contextWindow?: number;
  inputPrice?: number;
  outputPrice?: number;
  active: boolean;
  settings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  provider?: Provider;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 