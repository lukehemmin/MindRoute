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
  FiSettings,
  FiUser
} from 'react-icons/fi';

const Sidebar: React.FC = () => {
  const router = useRouter();
  const authStore = useAuthStore();
  const isAdminUser = authStore.isAdmin();
  
  // 현재 경로가 메뉴 항목과 일치하는지 확인
  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };
  
  // 모든 사용자를 위한 기본 메뉴 항목
  const menuItems = [
    {
      name: '대시보드',
      icon: <FiHome className="mr-3 h-5 w-5" />,
      href: '/dashboard',
      current: isActive('/dashboard'),
    },
    {
      name: '플레이그라운드',
      icon: <FiPlay className="mr-3 h-5 w-5" />,
      href: '/playground',
      current: isActive('/playground'),
    },
  ];
  
  // 관리자만을 위한 메뉴 항목
  const adminMenuItems = isAdminUser
    ? [
        {
          name: '사용자 관리',
          icon: <FiUsers className="mr-3 h-5 w-5" />,
          href: '/admin/users',
          current: isActive('/admin/users'),
        },
        {
          name: '제공업체 관리',
          icon: <FiServer className="mr-3 h-5 w-5" />,
          href: '/admin/providers',
          current: isActive('/admin/providers'),
        },
        {
          name: '로그 관리',
          icon: <FiActivity className="mr-3 h-5 w-5" />,
          href: '/admin/logs',
          current: isActive('/admin/logs'),
        },
        {
          name: '문의 관리',
          icon: <FiMessageSquare className="mr-3 h-5 w-5" />,
          href: '/admin/tickets',
          current: isActive('/admin/tickets'),
        },
        {
          name: '시스템 설정',
          icon: <FiSettings className="mr-3 h-5 w-5" />,
          href: '/admin/settings',
          current: isActive('/admin/settings'),
        },
        {
          name: '프로필 설정',
          icon: <FiUser className="mr-3 h-5 w-5" />,
          href: '/admin/profile',
          current: isActive('/admin/profile'),
        },
      ]
    : [];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="text-white text-xl font-bold">MindRoute</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  ${
                    item.current
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            
            {adminMenuItems.length > 0 && (
              <div className="pt-6">
                <div className="mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  관리자
                </div>
                {adminMenuItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${
                        item.current
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 