import axios from 'axios';
import useAuthStore from '../utils/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request 인터셉터: 요청 전 처리 (토큰 추가 등)
api.interceptors.request.use(
  (config) => {
    // 브라우저에서만 접근
    if (typeof window !== 'undefined') {
      // localStorage 대신 authStore에서 토큰 가져오기
      const authState = useAuthStore.getState();
      const token = authState.accessToken;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('API 요청에 인증 토큰 추가됨:', config.url);
      } else {
        console.warn('인증 토큰이 없습니다. API 요청:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response 인터셉터: 응답 처리 (토큰 갱신 등)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 토큰 만료 오류 (401) 및 토큰 갱신 재시도 여부 확인
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true;

      try {
        // authStore에서 리프레시 토큰 가져오기
        const { refreshToken } = useAuthStore.getState();
        
        if (!refreshToken) {
          console.error('리프레시 토큰이 없습니다. 로그아웃 처리합니다.');
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // 토큰 갱신 요청
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        
        // 새 토큰을 스토어에 저장
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setAuth(currentUser, accessToken, refreshToken);
        }

        // 새 토큰으로 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료됐거나 오류 발생 시 로그아웃
        console.error('토큰 갱신 실패:', refreshError);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 