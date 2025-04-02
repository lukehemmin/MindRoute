import { api } from '../utils/api';
import { User } from '../utils/authStore';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

// 로그인
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '로그인에 실패했습니다.',
    };
  }
};

// 회원가입
export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/register', { name, email, password });
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '회원가입에 실패했습니다.',
    };
  }
};

// 비밀번호 재설정 이메일 요청
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    await api.post('/auth/request-password-reset', { email });
    return {
      success: true,
      message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '비밀번호 재설정 요청에 실패했습니다.',
    };
  }
};

// 비밀번호 재설정
export const resetPassword = async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
  try {
    await api.post('/auth/reset-password', { token, password });
    return {
      success: true,
      message: '비밀번호가 성공적으로 재설정되었습니다.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '비밀번호 재설정에 실패했습니다.',
    };
  }
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await api.get('/users/me');
    return {
      success: true,
      data: {
        user: response.data.user,
        accessToken: '', // API에서 새 토큰을 반환하지 않음
        refreshToken: '', // API에서 새 토큰을 반환하지 않음
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '사용자 정보를 가져오는데 실패했습니다.',
    };
  }
};

// 로그아웃
export const logout = async (): Promise<{ success: boolean; message: string }> => {
  try {
    await api.post('/auth/logout');
    return {
      success: true,
      message: '로그아웃되었습니다.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '로그아웃에 실패했습니다.',
    };
  }
};

// 비밀번호 변경
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '비밀번호 변경에 실패했습니다.',
    };
  }
};

// 사용자 프로필 정보 가져오기
export const getProfile = async () => {
  const response = await api.get<AuthResponse>('/auth/me');
  return response.data;
};

// 프로필 업데이트
export interface ProfileUpdateParams {
  name: string;
}

export const updateProfile = async (params: ProfileUpdateParams): Promise<{ success: boolean; message?: string; data?: User }> => {
  try {
    const response = await api.put('/users/profile', params);
    return {
      success: true,
      data: response.data.user
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '프로필 업데이트에 실패했습니다.',
    };
  }
};

// 비밀번호 업데이트
export interface PasswordUpdateParams {
  currentPassword: string;
  newPassword: string;
}

export const updatePassword = async (params: PasswordUpdateParams): Promise<{ success: boolean; message: string }> => {
  try {
    await api.post('/users/change-password', params);
    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || '비밀번호 변경에 실패했습니다.',
    };
  }
};

// 토큰 저장 (로컬 스토리지)
export const saveTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
};

// 토큰 제거 (로그아웃)
export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}; 