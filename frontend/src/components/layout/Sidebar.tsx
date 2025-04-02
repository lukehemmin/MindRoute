import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useAuthStore from '../../utils/authStore';
import { 
  FiHome, 
  FiPlay, 
  FiUsers, 
  FiServer, 
  FiActivity, 
  FiMessageSquare, 
  FiSettings 
} from 'react-icons/fi';

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { isAdmin } = useAuthStore();

  const isActive = (path: string) => {
    if (path === '/dashboard' && router.pathname === '/dashboard') {
      return true;
    }
    
    if (path !== '/dashboard' && router.pathname.startsWith(path)) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="w-64 bg-white shadow-sm h-full p-4">
      <div className="space-y-1">
        <Link
          href="/dashboard"
          className={`${
            isActive('/dashboard')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
        >
          <FiHome className="mr-3 h-5 w-5" />
          대시보드
        </Link>

        <Link
          href="/playground"
          className={`${
            isActive('/playground')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
        >
          <FiPlay className="mr-3 h-5 w-5" />
          플레이그라운드
        </Link>

        <Link
          href="/providers"
          className={`${
            isActive('/providers')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
        >
          <FiServer className="mr-3 h-5 w-5" />
          AI 제공업체
        </Link>

        <Link
          href="/history"
          className={`${
            isActive('/history')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
        >
          <FiActivity className="mr-3 h-5 w-5" />
          사용 기록
        </Link>

        <Link
          href="/tickets"
          className={`${
            isActive('/tickets')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
        >
          <FiMessageSquare className="mr-3 h-5 w-5" />
          문의하기
        </Link>

        <Link
          href="/profile"
          className={`${
            isActive('/profile')
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
        >
          <FiSettings className="mr-3 h-5 w-5" />
          계정 설정
        </Link>
      </div>

      {isAdmin() && (
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            관리자 메뉴
          </h3>
          <div className="mt-2 space-y-1">
            <Link
              href="/admin"
              className={`${
                isActive('/admin') && router.pathname === '/admin'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
            >
              <FiHome className="mr-3 h-5 w-5" />
              관리자 대시보드
            </Link>
            
            <Link
              href="/admin/users"
              className={`${
                isActive('/admin/users')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
            >
              <FiUsers className="mr-3 h-5 w-5" />
              사용자 관리
            </Link>
            
            <Link
              href="/admin/providers"
              className={`${
                isActive('/admin/providers')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
            >
              <FiServer className="mr-3 h-5 w-5" />
              제공업체 관리
            </Link>
            
            <Link
              href="/admin/logs"
              className={`${
                isActive('/admin/logs')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
            >
              <FiActivity className="mr-3 h-5 w-5" />
              로그 관리
            </Link>

            <Link
              href="/admin/tickets"
              className={`${
                isActive('/admin/tickets')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
            >
              <FiMessageSquare className="mr-3 h-5 w-5" />
              문의 관리
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 