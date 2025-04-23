import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import useAuthStore from './authStore';

// API 기본 URL 설정
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

console.log('[API 초기화] API URL:', baseURL);

// axios 인스턴스 생성
export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 요청이 CORS 문제를 해결하기 위한 옵션
  withCredentials: false
});

// 인증 오류 시 사용자에게 알림을 표시하는 함수
const showAuthErrorModal = (message: string) => {
  // 모달이 이미 표시되어 있는지 확인
  if (document.getElementById('auth-error-modal')) {
    return;
  }
  
  // 모달 요소 생성
  const modalContainer = document.createElement('div');
  modalContainer.id = 'auth-error-modal';
  modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center';
  modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto';
  
  const heading = document.createElement('h3');
  heading.className = 'text-lg font-medium text-gray-900 mb-4';
  heading.textContent = '인증이 필요합니다';
  
  const messageEl = document.createElement('p');
  messageEl.className = 'text-sm text-gray-500 mb-4';
  messageEl.textContent = message;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'mt-5 sm:mt-6 flex justify-end';
  
  const loginButton = document.createElement('button');
  loginButton.className = 'inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none sm:text-sm';
  loginButton.textContent = '로그인 페이지로 이동';
  loginButton.onclick = () => {
    modalContainer.remove();
    window.location.href = '/login';
  };
  
  const closeButton = document.createElement('button');
  closeButton.className = 'ml-3 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm';
  closeButton.textContent = '닫기';
  closeButton.onclick = () => {
    modalContainer.remove();
  };
  
  buttonContainer.appendChild(loginButton);
  buttonContainer.appendChild(closeButton);
  
  modalContent.appendChild(heading);
  modalContent.appendChild(messageEl);
  modalContent.appendChild(buttonContainer);
  modalContainer.appendChild(modalContent);
  
  document.body.appendChild(modalContainer);
};

// 요청 인터셉터 - 자동으로 인증 토큰 추가
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const { accessToken } = useAuthStore.getState();
      
      // 디버그 로그: 요청 URL
      console.log(`[API 요청] URL: ${config.url}, 메소드: ${config.method}`);
      
      if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log(`[API 요청] 토큰 추가: 토큰 길이: ${accessToken.length}`);
      } else {
        console.log(`[API 요청] 인증 토큰 없음`);
      }
      
      // Headers 디버그 출력
      console.log('[API 요청] 헤더:', JSON.stringify(config.headers));
    }
    
    return config;
  },
  (error) => {
    console.error('[API 요청 오류]:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리
api.interceptors.response.use(
  (response) => {
    console.log(`[API 응답] 성공 (${response.status}):`, response.config.url);
    return response;
  },
  async (error) => {
    // 디버그 로그: 오류 상세
    console.error(`[API 응답 오류] URL: ${error.config?.url}, 상태: ${error.response?.status}`);
    if (error.response) {
      console.error('[API 응답 오류] 데이터:', error.response.data);
    }

    const originalRequest = error.config;
    
    // 요청 경로가 '/auth/login'이면 인증 오류 처리를 건너뜀
    if (originalRequest?.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }
    
    // 401 에러이고 리프레시 토큰이 존재하면 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      
      const { refreshToken } = useAuthStore.getState();
      
      if (refreshToken) {
        try {
          console.log('[API] 액세스 토큰 갱신 시도');
          // 토큰 갱신 요청
          const response = await axios.post(`${baseURL}/api/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data.data;
          console.log('[API] 새 액세스 토큰 획득:', accessToken.substring(0, 10) + '...');
          
          // 새 토큰으로 사용자 정보 가져오기
          const userResponse = await axios.get(`${baseURL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          });
          
          // 사용자 정보가 성공적으로 로드되면 저장
          if (userResponse.data.success) {
            const userData = userResponse.data.data;
            console.log('[API] 사용자 정보 갱신 성공');
            
            // 새 토큰과 사용자 정보 저장
            useAuthStore.getState().setAuth(
              userData, 
              accessToken, 
              refreshToken
            );
          } else {
            // 사용자 정보 불러오기 실패 시 토큰만 업데이트
            console.log('[API] 사용자 정보 갱신 실패, 토큰만 업데이트');
            const currentUser = useAuthStore.getState().user;
            useAuthStore.getState().setAuth(
              currentUser!, 
              accessToken, 
              refreshToken
            );
          }
          
          // 원래 요청 재시도
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          console.log('[API] 원래 요청 재시도');
          return axios(originalRequest);
        } catch (refreshError) {
          // 토큰 갱신 실패 - 로그아웃 처리
          console.error('[API] 토큰 갱신 실패:', refreshError);
          useAuthStore.getState().logout();
          
          // 사용자에게 로그인이 필요하다는 알림 표시
          if (typeof window !== 'undefined') {
            showAuthErrorModal('인증 세션이 만료되었습니다. 다시 로그인해 주세요.');
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        // 리프레시 토큰이 없는 경우 - 로그인 필요
        console.log('[API] 리프레시 토큰 없음, 로그아웃 처리');
        useAuthStore.getState().logout();
        
        // 사용자에게 로그인이 필요하다는 알림 표시
        if (typeof window !== 'undefined') {
          showAuthErrorModal('로그인이 필요한 기능입니다. 로그인 페이지로 이동하시겠습니까?');
        }
      }
    } else if (error.response?.status === 403) {
      // 권한 부족 오류 처리
      console.log('[API] 권한 부족 (403)');
      if (typeof window !== 'undefined') {
        showAuthErrorModal('이 기능에 접근할 권한이 없습니다. 권한이 있는 계정으로 로그인해 주세요.');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api; 