import api from './api';
import { Provider } from './ai';

// 사용자 인터페이스
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// 페이지네이션 응답 타입
export interface PaginationResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  pagination?: {
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
  };
}

// 로그 인터페이스
export interface Log {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  providerId: string;
  provider?: {
    id: string;
    name: string;
  };
  requestType: string;
  requestData: any;
  responseData: any;
  status: string;
  statusCode: number;
  errorMessage?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  processingTime: number;
  executionTime: number | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// 티켓 인터페이스
export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  adminResponse?: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// 제공업체 생성/수정 인터페이스
export interface ProviderInput {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  endpointUrl?: string;
  maxTokens?: number;
  settings?: Record<string, any>;
  active?: boolean;
}

// API 로그 인터페이스
export interface ApiLog {
  id: string;
  userId: number | null;
  email: string | null;
  apiKeyId: string | null;
  apiKeyName: string | null;
  apiKey: string | null;
  model: string | null;
  input: any;
  output: any;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  configuration: any;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

// API 로그 필터 인터페이스
export interface ApiLogFilters {
  email?: string;
  apiKeyId?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
}

// 사용자 목록 조회
export const getAllUsers = async (page = 1, limit = 10, search?: string): Promise<{success: boolean, data: PaginationResponse<User>, message?: string}> => {
  try {
    const response = await api.get<PaginationResponse<User>>('/api/admin/users', {
      params: { page, limit, search },
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '사용자 목록을 가져오는데 실패했습니다.',
      data: {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
        itemsPerPage: limit
      }
    };
  }
};

// 특정 사용자 조회
export const getUserById = async (userId: string) => {
  const response = await api.get<{ success: boolean, data: User }>(`/api/admin/users/${userId}`);
  return response.data;
};

// 사용자 정보 수정
export const updateUser = async (userId: string, data: Partial<User>) => {
  const response = await api.put<{ success: boolean, message: string, data: User }>(`/api/admin/users/${userId}`, data);
  return response.data;
};

// 제공업체 목록 조회
export const getAllProviders = async (): Promise<{success: boolean, data: Provider[], message?: string}> => {
  try {
    console.log('제공업체 목록 조회 요청 시작');
    const response = await api.get<{ success: boolean, data: Provider[], message?: string }>('/api/admin/providers');
    console.log('제공업체 응답:', response.data);
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data.data
      };
    } else {
      console.error('API 응답은 성공했지만 데이터 성공 플래그가 false:', response.data);
      return {
        success: false,
        message: response.data.message || '제공업체 목록을 가져오는데 실패했습니다.',
        data: []
      };
    }
  } catch (error: any) {
    console.error('제공업체 목록 요청 오류:', error);
    console.error('오류 상세:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || '제공업체 목록을 가져오는데 실패했습니다.',
      data: []
    };
  }
};

// 제공업체 추가
export const createProvider = async (data: ProviderInput) => {
  const response = await api.post<{ success: boolean, message: string, data: Provider }>('/api/admin/providers', data);
  return response.data;
};

// 제공업체 수정
export const updateProvider = async (providerId: string, data: Partial<ProviderInput>) => {
  try {
    // 파라미터 로깅
    console.log(`제공업체 업데이트 요청 데이터:`, {
      providerId,
      data: {
        ...data,
        apiKey: data.apiKey ? '******' : undefined, // API 키는 로그에 노출되지 않도록 함
        active: data.active, // active 상태 로깅 명시적 추가
        maxTokens: data.maxTokens
      }
    });
    
    // active 필드가 undefined가 아닌 경우에만 명시적으로 포함
    const payload = {
      ...data,
      active: data.active !== undefined ? Boolean(data.active) : undefined // active 필드를 명시적으로 Boolean 타입으로 변환
    };
    
    console.log('실제 전송 payload:', {
      ...payload,
      apiKey: payload.apiKey ? '******' : undefined
    });
    
    const response = await api.put<{ success: boolean, message: string, data: Provider }>(
      `/api/admin/providers/${providerId}`, 
      payload
    );
    console.log('제공업체 업데이트 응답:', response.data);
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      console.error('API 응답 성공했으나 내부 성공 플래그가 false:', response.data);
      return {
        success: false,
        message: response.data?.message || '제공업체 정보 업데이트에 실패했습니다.',
        data: null
      };
    }
  } catch (error: any) {
    console.error('제공업체 업데이트 오류:', error);
    console.error('오류 상세:', error.response?.data || error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || '제공업체 정보 업데이트에 실패했습니다.',
      data: null
    };
  }
};

// 제공업체 삭제
export const deleteProvider = async (providerId: string) => {
  const response = await api.delete<{ success: boolean, message: string }>(`/api/admin/providers/${providerId}`);
  return response.data;
};

// 로그 목록 조회
export const getLogs = async (page = 1, limit = 10, filters?: { userId?: string, providerId?: string, status?: string, startDate?: string, endDate?: string }): Promise<{success: boolean, data: { logs: Log[], pagination: { totalItems: number, totalPages: number, currentPage: number, itemsPerPage: number } }, message?: string}> => {
  try {
    const response = await api.get('/api/admin/logs', {
      params: { page, limit, ...filters },
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '로그 목록을 가져오는데 실패했습니다.',
      data: {
        logs: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: limit
        }
      }
    };
  }
};

// 특정 로그 상세 조회
export const getLogById = async (logId: string) => {
  const response = await api.get<{ success: boolean, data: Log }>(`/api/admin/logs/${logId}`);
  return response.data;
};

// 사용자 통계 데이터 조회
export const getUserStats = async (): Promise<{success: boolean, data: UsageStats, message?: string}> => {
  try {
    const response = await api.get('/api/users/stats');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '사용자 통계 데이터를 가져오는데 실패했습니다.',
      data: {
        totalApiCalls: 0,
        totalTokensUsed: 0,
        activeProviders: 0,
        lastUsedTime: '없음'
      }
    };
  }
};

// 관리자 대시보드 통계 데이터 조회
export const getAdminStats = async (): Promise<{success: boolean, data: any, message?: string}> => {
  try {
    const response = await api.get('/api/admin/stats');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '관리자 통계 데이터를 가져오는데 실패했습니다.',
      data: {}
    };
  }
};

export interface UsageStats {
  totalApiCalls: number;
  totalTokensUsed: number;
  activeProviders: number;
  lastUsedTime: string;
}

// 제공업체 API 연결 테스트
export const testProviderApi = async (providerId: string, providerData: Partial<ProviderInput>) => {
  try {
    console.log('제공업체 API 테스트 요청:', {
      providerId,
      data: {
        ...providerData,
        apiKey: providerData.apiKey ? '******' : undefined // API 키는 로그에 노출되지 않도록 함
      }
    });
    
    // 임시 제공업체 객체 생성
    const tempProvider = {
      id: providerId || 'temp-provider',
      name: providerData.name || '테스트 제공업체',
      type: providerData.type || 'openai',
      apiKey: providerData.apiKey || '',
      endpointUrl: providerData.endpointUrl,
      active: true
    };
    
    // 제공업체 테스트 API 호출
    const response = await api.post<{ success: boolean, message: string, data: any }>(
      `/api/admin/providers/test-connection`, 
      tempProvider
    );
    
    console.log('제공업체 API 테스트 응답:', response.data);
    
    return {
      success: response.data.success,
      message: response.data.message,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('제공업체 API 테스트 오류:', error);
    
    // 오류 응답 분석
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 401) {
        return {
          success: false,
          message: 'API 키 인증 실패: 유효하지 않은 API 키입니다.',
          error: 'UNAUTHORIZED'
        };
      } else if (errorData && errorData.error === 'ENOTFOUND') {
        return {
          success: false,
          message: '엔드포인트 URL에 연결할 수 없습니다. URL이 올바른지 확인하세요.',
          error: 'ENOTFOUND'
        };
      } else if (errorData && errorData.error === 'ECONNREFUSED') {
        return {
          success: false,
          message: '엔드포인트 서버가 연결을 거부했습니다. URL이 올바른지 확인하세요.',
          error: 'ECONNREFUSED'
        };
      }
    }
    
    return {
      success: false,
      message: error.response?.data?.message || '제공업체 API 테스트 중 오류가 발생했습니다.',
      error: error.code || 'UNKNOWN_ERROR'
    };
  }
};

/**
 * API 로그 목록 조회
 */
export const getApiLogs = async (
  page = 1,
  limit = 10,
  filters: ApiLogFilters = {}
): Promise<{success: boolean, data: { logs: ApiLog[], pagination: { totalItems: number, totalPages: number, currentPage: number, itemsPerPage: number } }, message?: string}> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // 필터 추가
    if (filters.email) params.append('email', filters.email);
    if (filters.apiKeyId) params.append('apiKeyId', filters.apiKeyId);
    if (filters.model) params.append('model', filters.model);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/api/admin/api-logs?${params.toString()}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('API 로그 목록 요청 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'API 로그 목록을 가져오는데 실패했습니다.',
      data: {
        logs: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          itemsPerPage: limit
        }
      }
    };
  }
};

/**
 * API 로그 상세 조회
 */
export const getApiLogById = async (logId: string): Promise<{success: boolean, data: ApiLog | null, message?: string}> => {
  try {
    const response = await api.get(`/api/admin/api-logs/${logId}`);
    return response.data;
  } catch (error: any) {
    console.error('API 로그 상세 조회 오류:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'API 로그를 가져오는데 실패했습니다.',
      data: null
    };
  }
}; 