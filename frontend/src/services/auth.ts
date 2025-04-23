import { api } from '../utils/api';
import { User } from '../utils/authStore';
import useAuthStore from '../utils/authStore';

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: any;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: string;
  };
}

// 로그인
export const login = async (email: string, password: string): Promise<AuthResponse & { status?: number }> => {
  try {
    console.log('[AUTH 서비스] 로그인 시도:', { email });
    
    // 직접 axios로 요청을 수행하여 문제 확인
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    console.log('[AUTH 서비스] 사용할 API URL:', baseURL);
    
    const response = await api.post('/api/auth/login', { email, password });
    
    console.log('[AUTH 서비스] 로그인 응답 상태:', response.status);
    console.log('[AUTH 서비스] 로그인 응답 구조:', {
      success: response.data.success,
      hasData: !!response.data.data,
      dataKeys: response.data.data ? Object.keys(response.data.data) : []
    });
    
    // 응답에서 사용자 정보와 토큰 추출
    const { accessToken, refreshToken, user } = response.data.data;
    
    // Zustand 스토어에 사용자 정보와 토큰 저장
    if (user && accessToken && refreshToken) {
      console.log('[AUTH 서비스] 인증 정보 저장:', { 
        userId: user.id, 
        role: user.role,
        tokenPresent: !!accessToken && !!refreshToken 
      });
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    } else {
      console.error('[AUTH 서비스] 응답에 필요한 인증 정보가 없습니다:', response.data);
    }
    
    return {
      success: true,
      data: response.data.data
    };
  } catch (error: any) {
    console.error('[AUTH 서비스] 로그인 오류:', error.message);
    
    // 더 자세한 오류 정보 로깅
    if (error.response) {
      console.error('[AUTH 서비스] 응답 상태:', error.response.status);
      console.error('[AUTH 서비스] 응답 데이터:', error.response.data);
    } else if (error.request) {
      console.error('[AUTH 서비스] 요청은 전송되었으나 응답이 없음:', error.request);
    } else {
      console.error('[AUTH 서비스] 오류 메시지:', error.message);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || '로그인에 실패했습니다.',
      status: error.response?.status
    };
  }
};

// 회원가입
export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/api/auth/register', { name, email, password });
    
    // 응답에서 사용자 정보와 토큰 추출
    const responseData = response.data.data || {};
    const { accessToken, refreshToken, user } = responseData;
    
    // Zustand 스토어에 사용자 정보와 토큰 저장
    if (user && accessToken && refreshToken) {
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    }
    
    return {
      success: true,
      data: responseData
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
    await api.post('/api/auth/request-password-reset', { email });
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
    await api.post('/api/auth/reset-password', { token, password });
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
    const response = await api.get('/api/users/me');
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
    await api.post('/api/auth/logout');
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
    await api.post('/api/auth/change-password', {
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
  const response = await api.get<AuthResponse>('/api/auth/me');
  return response.data;
};

// 프로필 업데이트
export interface ProfileUpdateParams {
  name: string;
}

export const updateProfile = async (params: ProfileUpdateParams): Promise<{ success: boolean; message?: string; data?: User }> => {
  try {
    const response = await api.put('/api/users/profile', params);
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
    await api.post('/api/users/change-password', params);
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