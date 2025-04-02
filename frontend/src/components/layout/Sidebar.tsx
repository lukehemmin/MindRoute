import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FiHome, 
  FiKey, 
  FiClock, 
  FiSettings, 
  FiUser, 
  FiPlay, 
  FiShield,
  FiBarChart2
} from 'react-icons/fi';
import { useAuthStore } from '../../store/auth';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    {
      name: '대시보드',
      href: '/',
      icon: <FiHome className="mr-3 h-5 w-5" />
    },
    {
      name: 'AI 플레이그라운드',
      href: '/playground',
      icon: <FiPlay className="mr-3 h-5 w-5" />
    },
    {
      name: 'API 키 관리',
      href: '/api-keys',
      icon: <FiKey className="mr-3 h-5 w-5" />
    },
    {
      name: '이용 기록',
      href: '/usage-logs',
      icon: <FiClock className="mr-3 h-5 w-5" />
    },
    {
      name: '내 프로필',
      href: '/profile',
      icon: <FiUser className="mr-3 h-5 w-5" />
    },
    {
      name: '계정 설정',
      href: '/account',
      icon: <FiSettings className="mr-3 h-5 w-5" />
    }
  ];

  const adminMenuItems = [
    {
      name: '관리자 대시보드',
      href: '/admin',
      icon: <FiBarChart2 className="mr-3 h-5 w-5" />
    },
    {
      name: '관리자 설정',
      href: '/admin/settings',
      icon: <FiShield className="mr-3 h-5 w-5" />
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return router.pathname === path;
    }
    return router.pathname.startsWith(path);
  };

  return (
    <div className={`bg-white fixed inset-y-0 left-0 z-30 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:h-full shadow-md`}>
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <span className="text-xl font-bold text-primary-600">MindRoute</span>
      </div>
      
      <div className="overflow-y-auto h-full pb-20">
        <nav className="mt-5 px-2 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                ${isActive(item.href) ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}
                group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors
              `}
              onClick={() => {
                if (isOpen) toggleSidebar();
              }}
            >
              {React.cloneElement(item.icon, {
                className: `${isActive(item.href) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-5 w-5`,
              })}
              {item.name}
            </Link>
          ))}
        </nav>
        
        {isAdmin && (
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              관리자 메뉴
            </h3>
            <nav className="mt-2 px-2 space-y-1">
              {adminMenuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    ${isActive(item.href) ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}
                    group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors
                  `}
                  onClick={() => {
                    if (isOpen) toggleSidebar();
                  }}
                >
                  {React.cloneElement(item.icon, {
                    className: `${isActive(item.href) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-5 w-5`,
                  })}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 