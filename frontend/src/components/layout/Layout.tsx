import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useAuthStore from '../../utils/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  
  // 로딩 상태 초기화
  useEffect(() => {
    const initLoading = setTimeout(() => {
      useAuthStore.getState().setLoading(false);
    }, 1000);
    
    return () => clearTimeout(initLoading);
  }, []);

  // 로딩 중일 때 표시할 화면
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // 로그인 여부에 따라 다른 레이아웃 적용
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout; 