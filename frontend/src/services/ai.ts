import { api } from '../utils/api';
import axios, { AxiosRequestConfig } from 'axios';
import { logDiagnostics } from '../utils/debug';
import useAuthStore from '../utils/authStore';

// 제공업체 인터페이스
export interface Provider {
  id: string;
  name: string;
  type: string;
  description: string;
  available: boolean; // 백엔드의 active 필드와 매핑됨
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
  userApiKeyId?: string; // 사용자가 선택한 API 키 ID
  streaming?: boolean;
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

// 스트리밍 응답 콜백 인터페이스
export interface StreamCallbacks {
  onStart?: () => void;
  onContent?: (content: string, done: boolean) => void;
  onComplete?: (usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }) => void;
  onError?: (error: Error) => void;
}

export interface AIResponse {
  success: boolean;
  message?: string;
  data: any;
}

// 모델 목록 캐싱을 위한 변수
let modelCache: Record<string, { data: Model[], timestamp: number }> = {};
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5분 캐시 유효 시간

// 제공업체의 모델 목록 가져오기
export const getModels = async (providerId: string): Promise<AIResponse> => {
  try {
    // 캐시된 데이터가 있고, 유효 기간 내라면 캐시 데이터 반환
    const now = Date.now();
    if (modelCache[providerId] && (now - modelCache[providerId].timestamp) < CACHE_EXPIRY_TIME) {
      return {
        success: true,
        data: modelCache[providerId].data
      };
    }

    const response = await api.get(`/api/ai/providers/${providerId}/models`);
    
    // 응답 데이터를 캐시에 저장
    if (response.data.models) {
      modelCache[providerId] = {
        data: response.data.models,
        timestamp: now
      };
    }
    
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

// AI에 텍스트 요청 보내기
export const sendTextRequest = async (
  providerId: string, 
  modelId: string, 
  prompt: string,
  userApiKeyId?: string
): Promise<AIResponse> => {
  try {
    const response = await api.post(`/api/ai/providers/${providerId}/completion`, {
      model: modelId,
      prompt,
      userApiKeyId
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
  image: File,
  userApiKeyId?: string
): Promise<AIResponse> => {
  try {
    const formData = new FormData();
    formData.append('model', modelId);
    formData.append('prompt', prompt);
    formData.append('image', image);
    if (userApiKeyId) {
      formData.append('userApiKeyId', userApiKeyId);
    }

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
  file: File,
  userApiKeyId?: string
): Promise<AIResponse> => {
  try {
    const formData = new FormData();
    formData.append('model', modelId);
    formData.append('prompt', prompt);
    formData.append('file', file);
    if (userApiKeyId) {
      formData.append('userApiKeyId', userApiKeyId);
    }

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

// 채팅 완성 요청 (스트리밍 지원)
export const chatCompletion = async (
  providerId: string, 
  data: ChatRequest, 
  files?: File[],
  streamCallbacks?: StreamCallbacks
): Promise<ChatResponse | AIResponse> => {
  try {
    // 스트리밍 모드인 경우
    if (data.streaming && streamCallbacks) {
      // 스트리밍 처리
      return await handleStreamingChat(providerId, data, files, streamCallbacks);
    }
    
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
      
      // API 키 ID 추가
      if (data.userApiKeyId) {
        formData.append('userApiKeyId', data.userApiKeyId);
      }
      
      // 스트리밍 설정 추가
      if (data.streaming !== undefined) {
        formData.append('streaming', data.streaming.toString());
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
    } as AIResponse;
  }
};

// 스트리밍 채팅 처리 함수
const handleStreamingChat = async (
  providerId: string,
  data: ChatRequest,
  files?: File[],
  callbacks?: StreamCallbacks
): Promise<AIResponse> => {
  try {
    if (!callbacks) throw new Error('스트리밍 모드에는 콜백 함수가 필요합니다.');
    const { onStart, onContent, onComplete, onError } = callbacks;
    if (onStart) onStart();
    let url = `/api/ai/providers/${providerId}/chat`;
    let fetchUrl = (process.env.NEXT_PUBLIC_API_URL || '') + url;
    let method: 'GET' | 'POST' = 'POST';
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json',
    };
    let body: string | undefined = undefined;
    // 파일이 있는 경우는 별도 처리 필요(여기서는 우선 미지원)
    if (files && files.length > 0) {
      throw new Error('파일 첨부 스트리밍은 아직 지원하지 않습니다.');
    } else {
      // POST로 메시지, 모델 등 포함
      body = JSON.stringify({
        ...data,
        streaming: true
      });
    }
    const response = await fetch(fetchUrl, {
      method,
      headers,
      body,
    });
    if (!response.ok) throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
    if (!response.body) throw new Error('응답에 body가 없습니다');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.done) {
              if (json.usage) usage = json.usage;
              if (onComplete) onComplete(usage);
            } else {
              if (onContent && json.content) onContent(json.content, false);
            }
          } catch (e) {
            console.error('스트림 데이터 파싱 오류:', e);
            if (onError) onError(e as Error);
          }
        }
      }
    }
    if (buffer && buffer.startsWith('data: ')) {
      try {
        const json = JSON.parse(buffer.slice(6));
        if (json.done) {
          if (json.usage) usage = json.usage;
          if (onComplete) onComplete(usage);
        } else {
          if (onContent && json.content) onContent(json.content, false);
        }
      } catch (e) {
        console.error('스트림 데이터 파싱 오류:', e);
        if (onError) onError(e as Error);
      }
    }
    return {
      success: true,
      data: {
        id: `chat-${Date.now()}`,
        providerId,
        model: data.model,
        response: { content: '', role: 'assistant' },
        usage,
      }
    } as any;
  } catch (error: any) {
    console.error('스트리밍 채팅 요청 오류:', error);
    if (callbacks?.onError) callbacks.onError(error);
    return {
      success: false,
      message: error.message || '스트리밍 요청을 처리하는데 실패했습니다.',
      data: null
    };
  }
};

// 텍스트 완성 요청
export const textCompletion = async (
  providerId: string, 
  model: string, 
  prompt: string, 
  options?: { 
    temperature?: number, 
    maxTokens?: number,
    userApiKeyId?: string 
  }
) => {
  try {
    const response = await api.post<{ success: boolean, data: any }>(`/api/ai/providers/${providerId}/completion`, {
      model,
      prompt,
      userApiKeyId: options?.userApiKeyId,
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