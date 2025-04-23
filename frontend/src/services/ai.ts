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
    // 콜백 확인
    if (!callbacks) {
      throw new Error('스트리밍 모드에는 콜백 함수가 필요합니다.');
    }

    const { onStart, onContent, onComplete, onError } = callbacks;
    
    // 시작 콜백 호출
    if (onStart) onStart();
    
    // 진단 정보 로깅
    console.log('스트리밍 요청 시작 - 인증 상태 진단');
    logDiagnostics();
    
    // 요청 구성
    let url = `/api/ai/providers/${providerId}/chat`;
    let body: any;
    let headers: Record<string, string> = {};
    
    // 파일이 있는 경우 FormData 사용
    if (files && files.length > 0) {
      body = new FormData();
      body.append('model', data.model);
      body.append('messages', JSON.stringify(data.messages));
      
      if (data.temperature) {
        body.append('temperature', data.temperature.toString());
      }
      
      if (data.maxTokens) {
        body.append('maxTokens', data.maxTokens.toString());
      }
      
      if (data.userApiKeyId) {
        body.append('userApiKeyId', data.userApiKeyId);
      }
      
      // 스트리밍 설정
      body.append('streaming', 'true');
      
      // 파일 추가
      files.forEach((file) => {
        body.append('files', file);
      });
      
      headers['Content-Type'] = 'multipart/form-data';
    } else {
      // 일반 JSON 요청
      body = {
        ...data,
        streaming: true
      };
      headers['Content-Type'] = 'application/json';
    }
    
    // EventSource를 사용하여 스트리밍 요청 (FormData는 지원하지 않으므로 XMLHttpRequest 사용)
    if (files && files.length > 0) {
      // FormData는 fetch API의 body로 전달
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}${url}`, {
        method: 'POST',
        body: body,
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`
        }
      });
      
      // 응답 스트림 처리
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('스트림 읽기를 시작할 수 없습니다.');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      let usage = {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      };
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // SSE 형식으로 전송된 데이터 파싱 (각 이벤트는 data: [JSON] 형식)
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              
              if (json.done) {
                // 완료 이벤트
                if (json.usage) {
                  usage = json.usage;
                }
                if (onComplete) onComplete(usage);
              } else {
                // 콘텐츠 이벤트
                if (onContent && json.content) {
                  onContent(json.content, false);
                }
              }
            } catch (e) {
              console.error('스트림 데이터 파싱 오류:', e);
              if (onError) onError(e as Error);
            }
          }
        }
      }
      
      // 마지막 남은 버퍼 처리
      if (buffer && buffer.startsWith('data: ')) {
        try {
          const json = JSON.parse(buffer.slice(6));
          if (json.done) {
            if (json.usage) {
              usage = json.usage;
            }
            if (onComplete) onComplete(usage);
          } else {
            if (onContent && json.content) {
              onContent(json.content, false);
            }
          }
        } catch (e) {
          console.error('스트림 데이터 파싱 오류:', e);
          if (onError) onError(e as Error);
        }
      }
    } else {
      // JSON 요청의 경우 EventSource 사용
      const token = useAuthStore.getState().accessToken;
      
      // 토큰이 없으면 오류 발생
      if (!token) {
        console.error('스트리밍 인증 오류: 토큰이 없음');
        throw new Error('인증 토큰이 필요합니다. 다시 로그인해주세요.');
      }

      console.log('스트리밍 요청 준비: 토큰 확인됨');
      
      // 요청 데이터 준비
      const queryParams = new URLSearchParams();
      queryParams.append('model', data.model);
      if (data.temperature !== undefined) {
        queryParams.append('temperature', data.temperature.toString());
      }
      if (data.maxTokens !== undefined) {
        queryParams.append('maxTokens', data.maxTokens.toString());
      }
      if (data.userApiKeyId) {
        queryParams.append('userApiKeyId', data.userApiKeyId);
      }
      queryParams.append('streaming', 'true');
      
      // 토큰 처리 - URL에 직접 포함시키지 않고 헤더 사용
      // URL 구성
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const eventSourceUrl = `${baseUrl}${url}?${queryParams.toString()}`;
      
      console.log('스트리밍 URL:', eventSourceUrl);
      
      // EventSource 객체를 대체하여 fetch API 사용
      let abortController = new AbortController();
      const signal = abortController.signal;
      
      // 스트리밍 시작 콜백
      if (callbacks?.onStart) callbacks.onStart();
      
      // fetch를 사용한 스트리밍 처리
      fetch(eventSourceUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        signal: signal
      })
      .then(response => {
        console.log('스트리밍 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
        }
        
        if (!response.body) {
          throw new Error('응답에 body가 없습니다');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let buffer = '';
        let usage = {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        };
        
        // 스트림 읽기 함수
        function readStream() {
          reader.read().then(({ done, value }) => {
            if (done) {
              console.log('스트림 읽기 완료됨');
              // 완료 콜백
              if (callbacks?.onComplete) callbacks.onComplete(usage);
              return;
            }
            
            buffer += decoder.decode(value, { stream: true });
            console.log('받은 데이터:', buffer);
            
            // SSE 형식 파싱
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6);
                  console.log('파싱할 JSON:', jsonStr);
                  const json = JSON.parse(jsonStr);
                  console.log('파싱된 JSON:', json);
                  
                  if (json.done) {
                    console.log('완료 이벤트 받음:', json);
                    // 완료 이벤트
                    if (json.usage) {
                      usage = json.usage;
                    }
                    if (callbacks?.onComplete) callbacks.onComplete(usage);
                    return;
                  } else {
                    // 콘텐츠 이벤트
                    console.log('콘텐츠 이벤트 받음:', json);
                    console.log('콘텐츠 포함 여부:', json.content !== undefined);
                    if (callbacks?.onContent && json.content) {
                      console.log('콘텐츠 콜백 호출:', json.content);
                      callbacks.onContent(json.content, false);
                    }
                  }
                } catch (e) {
                  console.error('스트림 데이터 파싱 오류:', e);
                }
              }
            }
            
            // 계속 읽기
            readStream();
          }).catch(error => {
            console.error('스트림 읽기 오류:', error);
            if (callbacks?.onError) callbacks.onError(error);
          });
        }
        
        // 스트림 읽기 시작
        readStream();
        
        // 연결 완료 후 메시지 전송
        fetch(`${baseUrl}${url}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            messages: data.messages,
            eventSourceId: Date.now().toString()
          })
        }).catch(error => {
          console.error('메시지 전송 오류:', error);
          abortController.abort();
          if (callbacks?.onError) callbacks.onError(new Error('메시지 전송 중 오류가 발생했습니다.'));
        });
      })
      .catch(error => {
        console.error('스트리밍 연결 오류:', error);
        if (callbacks?.onError) callbacks.onError(error);
      });
    }
    
    // 성공 응답 반환 (실제 내용은 콜백으로 처리됨)
    return {
      success: true,
      data: {
        id: `chat-${Date.now()}`,
        providerId,
        model: data.model,
        response: {
          content: '',  // 실제 내용은 콜백으로 처리됨
          role: 'assistant'
        },
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
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