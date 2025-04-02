import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import ComingSoon from '../components/common/ComingSoon';
import useAuthStore from '../utils/authStore';

const AccountSettings: React.FC = () => {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">계정 설정</h1>
          <p className="mt-1 text-sm text-gray-500">
            비밀번호 변경, 알림 설정 등 계정 관련 설정을 관리합니다.
          </p>
        </div>

        <ComingSoon 
          title="계정 설정 페이지 준비중" 
          description="계정 설정 기능이 현재 개발 중입니다. 보안 설정, 결제 정보, 알림 설정 등의 기능이 곧 제공됩니다." 
        />
      </div>
    </Layout>
  );
};

export default AccountSettings; 