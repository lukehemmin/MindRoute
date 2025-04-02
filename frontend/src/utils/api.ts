import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import useAuthStore from './authStore';

// API 기본 URL 설정
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// axios 인스턴스 생성
export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 자동으로 인증 토큰 추가
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const { accessToken } = useAuthStore.getState();
      
      if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 401 에러이고 리프레시 토큰이 존재하면 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      
      const { refreshToken } = useAuthStore.getState();
      
      if (refreshToken) {
        try {
          // 토큰 갱신 요청
          const response = await axios.post(`${baseURL}/auth/refresh-token`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // 새 토큰 저장
          useAuthStore.setState({ 
            accessToken, 
            refreshToken: newRefreshToken,
          });
          
          // 원래 요청 재시도
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return axios(originalRequest);
        } catch (refreshError) {
          // 토큰 갱신 실패 - 로그아웃 처리
          useAuthStore.setState({ 
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
          });
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
); 