import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/common/ComingSoon';
import useAuthStore from '../../utils/authStore';

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, loading, isAdmin } = useAuthStore();

  useEffect(() => {
    // 인증 체크
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      // 관리자 권한 체크
      if (!isAdmin()) {
        router.push('/dashboard');
        return;
      }
      
      // 이미 인증되고 관리자인 경우 현재 페이지에 유지
    }
  }, [isAuthenticated, loading, isAdmin, router]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="pb-5 mb-6 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">
            시스템 상태 및 사용자 통계를 확인합니다.
          </p>
        </div>

        <ComingSoon 
          title="관리자 대시보드 준비중" 
          description="관리자 대시보드 기능이 현재 개발 중입니다. 사용자 통계, 시스템 상태 모니터링 등의 기능이 곧 제공됩니다." 
        />
      </div>
    </Layout>
  );
};

export default AdminDashboard; 