import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useAuthStore from '../../utils/authStore';
import { logout as logoutAPI } from '../../services/auth';
import { 
  FiHome, 
  FiPlay, 
  FiUsers, 
  FiServer, 
  FiActivity, 
  FiMessageSquare,
  FiSettings,
  FiUser,
  FiMenu,
  FiX,
  FiShield,
  FiKey,
  FiClock,
  FiLogOut
} from 'react-icons/fi';

interface NavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const router = useRouter();
  const { isAuthenticated, user, logout, isAdmin } = useAuthStore();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 현재 경로가 메뉴 항목과 일치하는지 확인
  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  const navMenuItems = [
    {
      name: '대시보드',
      icon: <FiHome className="mr-2 h-5 w-5" />,
      href: '/dashboard',
      current: isActive('/dashboard'),
    },
    {
      name: '플레이그라운드',
      icon: <FiPlay className="mr-2 h-5 w-5" />,
      href: '/playground',
      current: isActive('/playground'),
    },
  ];

  const adminNavItems = isAdmin() ? [
    {
      name: '사용자 관리',
      icon: <FiUsers className="mr-2 h-5 w-5" />,
      href: '/admin/users',
      current: isActive('/admin/users'),
    },
    {
      name: '제공업체 관리',
      icon: <FiServer className="mr-2 h-5 w-5" />,
      href: '/admin/providers',
      current: isActive('/admin/providers'),
    },
    {
      name: '로그 관리',
      icon: <FiActivity className="mr-2 h-5 w-5" />,
      href: '/admin/logs',
      current: isActive('/admin/logs'),
    },
    {
      name: '문의 관리',
      icon: <FiMessageSquare className="mr-2 h-5 w-5" />,
      href: '/admin/tickets',
      current: isActive('/admin/tickets'),
    },
    {
      name: '시스템 설정',
      icon: <FiSettings className="mr-2 h-5 w-5" />,
      href: '/admin/settings',
      current: isActive('/admin/settings'),
    },
    {
      name: '프로필 설정',
      icon: <FiUser className="mr-2 h-5 w-5" />,
      href: '/admin/profile',
      current: isActive('/admin/profile'),
    }
  ] : [];

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            >
              {isSidebarOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
            <Link href="/">
              <span className="flex-shrink-0 flex items-center cursor-pointer ml-2 md:ml-0">
                <span className="text-primary-600 font-bold text-xl">MindRoute</span>
              </span>
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:ml-6 md:flex md:space-x-6">
                {navMenuItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}

                {isAdmin() && (
                  <div className="relative group">
                    <button
                      className={`${
                        router.pathname.startsWith('/admin')
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium focus:outline-none`}
                    >
                      관리자
                    </button>
                    <div className="absolute left-0 mt-2 w-56 origin-top-left bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 hidden group-hover:block">
                      <div className="py-1">
                        {adminNavItems.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`${
                              item.current
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-100'
                            } group flex items-center px-4 py-2 text-sm`}
                          >
                            {item.icon}
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center">
                {/* 모바일 메뉴 버튼 */}
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 mr-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="sr-only">메뉴 열기</span>
                  {mobileMenuOpen ? (
                    <FiX className="block h-6 w-6" />
                  ) : (
                    <FiMenu className="block h-6 w-6" />
                  )}
                </button>

                <div className="ml-3 relative" ref={profileMenuRef}>
                  <div>
                    <button
                      className="max-w-xs bg-gray-100 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    >
                      <span className="sr-only">사용자 메뉴 열기</span>
                      <div className="h-8 w-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    </button>
                  </div>
                  
                  {profileMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      
                      <div className="py-1">
                        <a 
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiUser className="mr-3 h-4 w-4" />
                          내 프로필
                        </a>
                        <a 
                          href="/api-keys"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiKey className="mr-3 h-4 w-4" />
                          API 관리
                        </a>
                        <a 
                          href="/usage-logs"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiClock className="mr-3 h-4 w-4" />
                          이용 기록
                        </a>
                        <a 
                          href="/account"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiSettings className="mr-3 h-4 w-4" />
                          계정 설정
                        </a>
                      </div>
                      
                      {user?.role === 'admin' && (
                        <div className="py-1 border-t border-gray-200">
                          <a 
                            href="/admin"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <FiShield className="mr-3 h-4 w-4" />
                            관리자 설정
                          </a>
                        </div>
                      )}
                      
                      <div className="py-1 border-t border-gray-200">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiLogOut className="mr-3 h-4 w-4" />
                          로그아웃
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

      {/* 모바일 메뉴 */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navMenuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  item.current
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-base font-medium rounded-md`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}

            {isAdmin() && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  관리자
                </div>
                {adminNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-3 py-2 text-base font-medium rounded-md`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 