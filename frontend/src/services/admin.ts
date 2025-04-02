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
  allowImages?: boolean;
  allowVideos?: boolean;
  allowFiles?: boolean;
  maxTokens?: number;
  settings?: Record<string, any>;
  active?: boolean;
}

// 사용자 목록 조회
export const getAllUsers = async (page = 1, limit = 10, search?: string): Promise<{success: boolean, data: PaginationResponse<User>, message?: string}> => {
  try {
    const response = await api.get<PaginationResponse<User>>('/admin/users', {
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
  const response = await api.get<{ success: boolean, data: User }>(`/admin/users/${userId}`);
  return response.data;
};

// 사용자 정보 수정
export const updateUser = async (userId: string, data: Partial<User>) => {
  const response = await api.put<{ success: boolean, message: string, data: User }>(`/admin/users/${userId}`, data);
  return response.data;
};

// 제공업체 목록 조회
export const getAllProviders = async (): Promise<{success: boolean, data: Provider[], message?: string}> => {
  try {
    const response = await api.get<{ data: Provider[] }>('/admin/providers');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '제공업체 목록을 가져오는데 실패했습니다.',
      data: []
    };
  }
};

// 제공업체 추가
export const createProvider = async (data: ProviderInput) => {
  const response = await api.post<{ success: boolean, message: string, data: Provider }>('/admin/providers', data);
  return response.data;
};

// 제공업체 수정
export const updateProvider = async (providerId: string, data: Partial<ProviderInput>) => {
  const response = await api.put<{ success: boolean, message: string, data: Provider }>(`/admin/providers/${providerId}`, data);
  return response.data;
};

// 제공업체 삭제
export const deleteProvider = async (providerId: string) => {
  const response = await api.delete<{ success: boolean, message: string }>(`/admin/providers/${providerId}`);
  return response.data;
};

// 로그 목록 조회
export const getLogs = async (page = 1, limit = 10, filters?: { userId?: string, providerId?: string, status?: string, startDate?: string, endDate?: string }): Promise<{success: boolean, data: PaginationResponse<Log>, message?: string}> => {
  try {
    const response = await api.get<PaginationResponse<Log>>('/admin/logs', {
      params: { page, limit, ...filters },
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '로그 목록을 가져오는데 실패했습니다.',
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

// 특정 로그 상세 조회
export const getLogById = async (logId: string) => {
  const response = await api.get<{ success: boolean, data: Log }>(`/admin/logs/${logId}`);
  return response.data;
};

// 사용자 통계 데이터 조회
export const getUserStats = async (): Promise<{success: boolean, data: UsageStats, message?: string}> => {
  try {
    const response = await api.get('/users/stats');
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
    const response = await api.get('/admin/stats');
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