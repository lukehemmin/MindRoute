import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useAuthStore from '../../utils/authStore';
import { logout as logoutAPI } from '../../services/auth';

const Navbar: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user, logout, isAdmin } = useAuthStore();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // API 로그아웃 요청
      await logoutAPI();
      
      // Zustand 스토어 로그아웃
      logout();
      
      // 로그인 페이지로 이동
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      
      // 에러가 발생해도 로컬에서는 로그아웃 처리
      logout();
      router.push('/login');
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary-600">MindRoute</span>
            </Link>
            
            {isAuthenticated && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className={`${
                    router.pathname === '/dashboard'
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  대시보드
                </Link>
                
                <Link
                  href="/playground"
                  className={`${
                    router.pathname === '/playground'
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  플레이그라운드
                </Link>
                
                {isAdmin() && (
                  <Link
                    href="/admin"
                    className={`${
                      router.pathname.startsWith('/admin')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    관리자
                  </Link>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="ml-2 text-sm">{user?.name}</span>
                  </button>
                </div>
                
                {profileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      프로필
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 