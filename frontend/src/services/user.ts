import { api } from '../utils/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalApiCalls: number;
  totalTokenUsage: number;
  activeProviders: number;
  lastUsed: string | null;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export interface UsageStats {
  totalApiCalls: number;
  totalTokensUsed: number;
  activeProviders: number;
  lastUsedTime: string;
}

// 사용자 프로필 조회
export const getUserProfile = async (): Promise<{success: boolean, data: UserProfile, message?: string}> => {
  try {
    const response = await api.get('/users/profile');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '프로필 정보를 가져오는데 실패했습니다.',
      data: {} as UserProfile
    };
  }
};

// 사용자 프로필 업데이트
export const updateUserProfile = async (data: Partial<UserProfile>): Promise<{success: boolean, data: UserProfile, message?: string}> => {
  try {
    const response = await api.put('/users/profile', data);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '프로필 업데이트에 실패했습니다.',
      data: {} as UserProfile
    };
  }
};

// 사용자 통계 데이터 조회
export const getUserStats = async (): Promise<{success: boolean, data: UsageStats, message?: string, status?: number}> => {
  try {
    const response = await api.get('/api/users/stats');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '사용 통계 데이터를 가져오는데 실패했습니다.',
      status: error.response?.status,
      data: {
        totalApiCalls: 0,
        totalTokensUsed: 0,
        activeProviders: 0,
        lastUsedTime: '없음'
      }
    };
  }
};

// API 키 목록 조회
export const getApiKeys = async (): Promise<{success: boolean, data: ApiKey[], message?: string, status?: number}> => {
  try {
    const response = await api.get('/api/users/api-keys');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'API 키 목록을 가져오는데 실패했습니다.',
      status: error.response?.status,
      data: []
    };
  }
};

// API 키 생성
export const createApiKey = async (name: string): Promise<{success: boolean, data: ApiKey, message?: string, status?: number}> => {
  try {
    const response = await api.post('/api/users/api-keys', { name });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'API 키 생성에 실패했습니다.',
      status: error.response?.status,
      data: {} as ApiKey
    };
  }
};

// API 키 삭제
export const deleteApiKey = async (keyId: string): Promise<{success: boolean, message?: string, status?: number}> => {
  try {
    await api.delete(`/api/users/api-keys/${keyId}`);
    return {
      success: true
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'API 키 삭제에 실패했습니다.',
      status: error.response?.status
    };
  }
}; 