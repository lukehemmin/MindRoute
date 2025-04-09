import { api } from '../utils/api';
import axios, { AxiosRequestConfig } from 'axios';

// 제공업체 인터페이스
export interface Provider {
  id: string;
  name: string;
  type: string;
  description: string;
  available: boolean; // 백엔드의 active 필드와 매핑됨
  allowImages: boolean;
  allowVideos: boolean;
  allowFiles: boolean;
  models?: Model[];
  apiEndpoint?: string;
}

// 모델 인터페이스
export interface Model {
  id: string;
  name: string;
  providerId: string;
  description: string;
  available: boolean;
  capabilities: string[];
  version: string;
}

// 메시지 인터페이스
export interface Message {
  role: string;
  content: string | Array<{
    type: string;
    text?: string;
    image_url?: string;
    file_url?: string;
  }>;
}

// 채팅 요청 인터페이스
export interface ChatRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
}

// 채팅 응답 인터페이스
export interface ChatResponse {
  success: boolean;
  data: {
    id: string;
    providerId: string;
    model: string;
    response: {
      content: string;
      role: string;
    };
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export interface AIResponse {
  success: boolean;
  message?: string;
  data: any;
}

// 제공업체 목록 가져오기
export const getProviders = async (): Promise<AIResponse> => {
  try {
    const response = await api.get('/api/ai/providers');
    return {
      success: true,
      data: response.data.providers
    };
  } catch (error: any) {
    console.error('제공업체 목록 가져오기 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '제공업체 목록을 가져오는데 실패했습니다.',
      data: []
    };
  }
};

// 특정 제공업체 정보 가져오기
export const getProvider = async (id: string): Promise<AIResponse> => {
  try {
    const response = await api.get(`/providers/${id}`);
    return {
      success: true,
      data: response.data.provider
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '제공업체 정보를 가져오는데 실패했습니다.',
      data: null
    };
  }
};

// 제공업체의 모델 목록 가져오기
export const getModels = async (providerId: string): Promise<AIResponse> => {
  try {
    const response = await api.get(`/api/ai/providers/${providerId}/models`);
    return {
      success: true,
      data: response.data.models
    };
  } catch (error: any) {
    console.error('모델 목록 가져오기 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '모델 목록을 가져오는데 실패했습니다.',
      data: []
    };
  }
};

// AI에 텍스트 요청 보내기
export const sendTextRequest = async (
  providerId: string, 
  modelId: string, 
  prompt: string
): Promise<AIResponse> => {
  try {
    const response = await api.post(`/api/ai/providers/${providerId}/completion`, {
      model: modelId,
      prompt
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('AI 텍스트 요청 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'AI 요청을 처리하는데 실패했습니다.',
      data: null
    };
  }
};

// AI에 이미지 요청 보내기
export const sendImageRequest = async (
  providerId: string,
  modelId: string,
  prompt: string,
  image: File
): Promise<AIResponse> => {
  try {
    const formData = new FormData();
    formData.append('model', modelId);
    formData.append('prompt', prompt);
    formData.append('image', image);

    const response = await api.post(`/api/ai/providers/${providerId}/chat`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('AI 이미지 요청 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '이미지 처리 요청에 실패했습니다.',
      data: null
    };
  }
};

// AI에 파일 요청 보내기
export const sendFileRequest = async (
  providerId: string,
  modelId: string,
  prompt: string,
  file: File
): Promise<AIResponse> => {
  try {
    const formData = new FormData();
    formData.append('model', modelId);
    formData.append('prompt', prompt);
    formData.append('file', file);

    const response = await api.post(`/api/ai/providers/${providerId}/chat`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('AI 파일 요청 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '파일 처리 요청에 실패했습니다.',
      data: null
    };
  }
};

// 채팅 완성 요청
export const chatCompletion = async (providerId: string, data: ChatRequest, files?: File[]) => {
  try {
    // 파일이 있는 경우 FormData 사용
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('model', data.model);
      formData.append('messages', JSON.stringify(data.messages));
      
      if (data.temperature) {
        formData.append('temperature', data.temperature.toString());
      }
      
      if (data.maxTokens) {
        formData.append('maxTokens', data.maxTokens.toString());
      }
      
      // 파일 추가
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      
      const response = await api.post<ChatResponse>(
        `/api/ai/providers/${providerId}/chat`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    }
    
    // 파일이 없는 경우 JSON 요청
    const response = await api.post<ChatResponse>(`/api/ai/providers/${providerId}/chat`, data);
    return response.data;
  } catch (error: any) {
    console.error('채팅 완성 요청 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '채팅 요청을 처리하는데 실패했습니다.',
      data: null
    };
  }
};

// 텍스트 완성 요청
export const textCompletion = async (providerId: string, model: string, prompt: string, options?: { temperature?: number, maxTokens?: number }) => {
  try {
    const response = await api.post<{ success: boolean, data: any }>(`/api/ai/providers/${providerId}/completion`, {
      model,
      prompt,
      ...options
    });
    return response.data;
  } catch (error: any) {
    console.error('텍스트 완성 요청 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || '텍스트 요청을 처리하는데 실패했습니다.',
      data: null
    };
  }
};

// 이미지 생성 요청을 보냅니다.
export const generateImage = async (
  providerId: string,
  modelId: string,
  prompt: string
): Promise<AIResponse> => {
  try {
    const payload = {
      providerId,
      modelId,
      prompt
    };

    const response = await api.post('/ai/generate-image', payload);
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '이미지 생성 요청을 처리하는데 실패했습니다.',
      data: { imageUrl: '' }
    };
  }
}; 