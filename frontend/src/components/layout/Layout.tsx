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
    // 필요시 추가 로직 구현
  }, []);

  // 인증되지 않은 사용자만 리다이렉트 처리
  useEffect(() => {
    if (!loading && !isAuthenticated && 
        router.pathname !== '/login' && 
        router.pathname !== '/register' && 
        router.pathname !== '/') {
      router.push('/login');
    }
    // 이미 인증된 사용자를 대시보드나 다른 페이지로 리다이렉션하는 로직은 제거
  }, [isAuthenticated, loading, router]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 로그인/회원가입 페이지에서는 레이아웃 없이 표시
  if (router.pathname === '/login' || router.pathname === '/register' || loading) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        
        <main className="flex-1 overflow-auto pt-20">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 