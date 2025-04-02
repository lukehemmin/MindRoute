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
  success: boolean;
  data: {
    items: T[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      itemsPerPage: number;
    };
  };
}

// 로그 인터페이스
export interface Log {
  id: string;
  userId: string;
  providerId: string;
  requestType: string;
  requestBody: any;
  responseBody?: any;
  status: string;
  executionTime?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  provider?: Provider;
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
export const getAllUsers = async (page = 1, limit = 10, search?: string) => {
  const response = await api.get<PaginationResponse<User>>('/admin/users', {
    params: { page, limit, search },
  });
  return response.data;
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
export const getAllProviders = async () => {
  const response = await api.get<{ success: boolean, data: Provider[] }>('/admin/providers');
  return response.data;
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
export const getLogs = async (page = 1, limit = 10, filters?: { userId?: string, providerId?: string, status?: string, startDate?: string, endDate?: string }) => {
  const response = await api.get<PaginationResponse<Log>>('/admin/logs', {
    params: { page, limit, ...filters },
  });
  return response.data;
};

// 특정 로그 상세 조회
export const getLogById = async (logId: string) => {
  const response = await api.get<{ success: boolean, data: Log }>(`/admin/logs/${logId}`);
  return response.data;
}; 