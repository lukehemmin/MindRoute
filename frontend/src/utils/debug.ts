/**
 * 디버깅 및 진단을 위한 유틸리티 함수
 */
import useAuthStore from './authStore';

/**
 * JWT 토큰의 유효성을 검증하고 디코딩합니다.
 * @param token JWT 토큰
 * @returns 디코딩된 토큰 정보 또는 오류 메시지
 */
export const checkToken = (token: string | null): { valid: boolean; info: any } => {
  if (!token) {
    return { valid: false, info: '토큰이 없습니다.' };
  }

  try {
    // JWT 형식 확인 (심플 체크)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, info: 'JWT 형식이 아닙니다.' };
    }

    // Base64 디코딩 시도
    try {
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      // 만료 확인
      if (payload.exp && payload.exp < now) {
        return { valid: false, info: { message: '토큰이 만료되었습니다.', expiry: new Date(payload.exp * 1000), now: new Date() } };
      }

      return { valid: true, info: payload };
    } catch (e) {
      return { valid: false, info: '토큰 디코딩 실패' };
    }
  } catch (error) {
    return { valid: false, info: `토큰 검증 오류: ${error}` };
  }
};

/**
 * 현재 인증 상태 확인
 * @returns 인증 상태 정보
 */
export const checkAuthStatus = (): { authenticated: boolean; info: any } => {
  const token = useAuthStore.getState().accessToken;
  const tokenCheck = checkToken(token);

  return {
    authenticated: tokenCheck.valid,
    info: {
      tokenPresent: !!token,
      tokenValid: tokenCheck.valid,
      tokenInfo: tokenCheck.info,
    }
  };
};

/**
 * 상세 진단 정보 콘솔 출력
 */
export const logDiagnostics = (): void => {
  console.group('🔍 인증 및 토큰 진단');
  const authStatus = checkAuthStatus();
  console.log('인증 상태:', authStatus.authenticated ? '인증됨 ✅' : '인증되지 않음 ❌');
  console.log('토큰 상태:', authStatus.info);
  console.groupEnd();

  console.group('🌐 환경 설정');
  console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || '설정되지 않음');
  console.log('개발 모드:', process.env.NODE_ENV === 'development' ? '활성화' : '비활성화');
  console.groupEnd();

  // Zustand 스토어 정보 출력
  console.group('🔐 인증 스토어 정보');
  const authStore = useAuthStore.getState();
  console.log('인증됨:', authStore.isAuthenticated);
  console.log('사용자:', authStore.user ? `${authStore.user.name} (${authStore.user.email})` : '없음');
  console.log('액세스 토큰:', authStore.accessToken ? `${authStore.accessToken.substring(0, 10)}...` : '없음');
  console.log('리프레시 토큰:', authStore.refreshToken ? `${authStore.refreshToken.substring(0, 10)}...` : '없음');
  console.groupEnd();
}; 