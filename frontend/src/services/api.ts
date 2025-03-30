import axios, { AxiosRequestConfig } from 'axios';

// 기본 axios 인스턴스 설정
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 설정 - 토큰 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 인증 API 서비스
export const authApi = {
  // 로그인
  login: (email: string, password: string) => 
    axiosInstance.post('/api/v1/auth/login', { email, password }),
  
  // 회원가입
  register: (name: string, email: string, password: string) => 
    axiosInstance.post('/api/v1/auth/register', { name, email, password }),
  
  // 로그아웃
  logout: () => 
    axiosInstance.post('/api/v1/auth/logout'),
  
  // 현재 사용자 정보 조회
  getCurrentUser: () => 
    axiosInstance.get('/api/v1/users/me'),
};

// 사용자 API 서비스
export const userApi = {
  // API 키 목록 조회
  getApiKeys: () => 
    axiosInstance.get('/api/v1/users/api-keys'),
  
  // API 키 생성
  createApiKey: (name: string) => 
    axiosInstance.post('/api/v1/users/api-keys', { name }),
  
  // API 키 상태 업데이트
  updateApiKey: (keyId: string, isActive: boolean) => 
    axiosInstance.put(`/api/v1/users/api-keys/${keyId}`, { isActive }),
  
  // API 키 삭제
  deleteApiKey: (keyId: string) => 
    axiosInstance.delete(`/api/v1/users/api-keys/${keyId}`),
};

// 프로바이더 API 서비스
export const providerApi = {
  // 모든 프로바이더 조회
  getAllProviders: () => 
    axiosInstance.get('/api/v1/providers'),
  
  // 특정 프로바이더 조회
  getProvider: (name: string) => 
    axiosInstance.get(`/api/v1/providers/${name}`),
  
  // 프로바이더 모델 목록 조회
  getProviderModels: (name: string) => 
    axiosInstance.get(`/api/v1/providers/${name}/models`),
};

// 완성(Completion) API 서비스
export const completionApi = {
  // 텍스트 완성 요청
  createCompletion: (data: any) => 
    axiosInstance.post('/api/v1/completions', data),
  
  // 스트리밍 텍스트 완성 요청
  streamCompletion: (data: any) => 
    axiosInstance.post('/api/v1/completions/stream', data, { 
      responseType: 'stream' 
    }),
};

// 로그 API 서비스
export const logApi = {
  // 사용자 자신의 API 사용 로그 조회
  getUserLogs: (params?: any) => 
    axiosInstance.get('/api/v1/logs', { params }),
};

// 관리자 API 서비스
export const adminApi = {
  // 프로바이더 등록
  registerProvider: (data: any) => 
    axiosInstance.post('/api/v1/admin/providers', data),
  
  // 프로바이더 업데이트
  updateProvider: (data: any) => 
    axiosInstance.put(`/api/v1/admin/providers/${data.name}`, data),
  
  // 프로바이더 삭제
  deleteProvider: (name: string) => 
    axiosInstance.delete(`/api/v1/admin/providers/${name}`),
  
  // 프로바이더 테스트
  testProvider: (name: string) => 
    axiosInstance.post(`/api/v1/admin/providers/${name}/test`),
  
  // 사용량 통계 가져오기
  getUsageStats: (params: any) => 
    axiosInstance.get('/api/v1/admin/stats/usage', { params }),
  
  // 사용자 통계 가져오기
  getUserStats: () => 
    axiosInstance.get('/api/v1/admin/stats/users'),
  
  // 프로바이더 통계 가져오기
  getProviderStats: () => 
    axiosInstance.get('/api/v1/admin/stats/providers'),
  
  // 모든 사용자 조회
  getAllUsers: (params?: any) => 
    axiosInstance.get('/api/v1/admin/users', { params }),
  
  // 사용자 상태 변경
  updateUserStatus: (userId: string, isActive: boolean) => 
    axiosInstance.put(`/api/v1/admin/users/${userId}/status`, { isActive }),
  
  // 사용자 역할 변경
  updateUserRole: (userId: string, roleId: string) => 
    axiosInstance.put(`/api/v1/admin/users/${userId}/role`, { roleId }),
  
  // 모든 API 사용 로그 조회
  getAllLogs: (params?: any) => 
    axiosInstance.get('/api/v1/admin/logs', { params }),
};

export default axiosInstance;
