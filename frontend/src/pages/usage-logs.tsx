import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import ComingSoon from '../components/common/ComingSoon';
import useAuthStore from '../utils/authStore';

const UsageLogs: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="pb-5 mb-6 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">이용 기록</h1>
          <p className="mt-1 text-sm text-gray-500">
            API 사용 내역 및 요금 정보를 확인합니다.
          </p>
        </div>

        <ComingSoon 
          title="이용 기록 페이지 준비중" 
          description="API 사용량 및 요금 정보를 확인하는 기능이 곧 제공될 예정입니다. 빠른 시일 내에 서비스를 오픈하겠습니다." 
        />
      </div>
    </Layout>
  );
};

export default UsageLogs; 