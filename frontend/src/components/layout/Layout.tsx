import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useAuthStore from '../../utils/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 인증 상태 체크
  useEffect(() => {
    // 인증 상태 확인 (선택적)
  }, []);

  // 인증되지 않은 사용자 리다이렉트 처리
  useEffect(() => {
    if (!loading && !isAuthenticated && router.pathname !== '/login' && router.pathname !== '/register') {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 로그인 페이지에서는 레이아웃 없이 표시
  if (router.pathname === '/login' || router.pathname === '/register' || loading) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto pt-20 pb-6 px-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 