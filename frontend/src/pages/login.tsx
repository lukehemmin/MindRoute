import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useAuthStore from '../utils/authStore';
import { login } from '../services/auth';
import axios from 'axios';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 이미 로그인된 사용자 자동 리다이렉트 - 로그인 페이지에서만 작동
  useEffect(() => {
    // 로그인 페이지에 직접 접근한 경우에만 리다이렉트 수행
    // router.pathname이 '/login'인 경우에만 리다이렉트
    if (isAuthenticated && router.pathname === '/login') {
      const user = useAuthStore.getState().user;
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 입력 시 에러 메시지 제거
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setLoginError('');
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        console.log('로그인 성공:', { 
          userId: user.id, 
          role: user.role, 
          tokenLength: accessToken.length
        });
        
        // 인증 정보 저장
        useAuthStore.getState().setAuth(user, accessToken, refreshToken);
        
        // 리다이렉트
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setLoginError(response.data.message || '로그인에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('로그인 오류:', err);
      setLoginError(err.response?.data?.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">로그인</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {!isAuthenticated ? (
              <>
                계정이 없으신가요?{' '}
                <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                  회원가입
                </Link>
              </>
            ) : (
              <>
                이미 로그인되어 있습니다.{' '}
                <Link href="/" className="font-medium text-primary-600 hover:text-primary-500">
                  홈으로 돌아가기
                </Link>
                {' 또는 '}
                <Link href="/dashboard" className="font-medium text-primary-600 hover:text-primary-500">
                  대시보드로 이동
                </Link>
              </>
            )}
          </p>
        </div>
        
        {loginError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{loginError}</span>
          </div>
        )}
        
        {!isAuthenticated ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  이메일 주소
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                  placeholder="이메일 주소"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  로그인 상태 유지
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    로그인 중...
                  </span>
                ) : (
                  '로그인'
                )}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default LoginPage; 