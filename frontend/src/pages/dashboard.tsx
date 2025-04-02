import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import useAuthStore from '../utils/authStore';
import { FiServer, FiKey, FiClock, FiActivity } from 'react-icons/fi';
import { getUserStats, UsageStats } from '../services/user';

const Dashboard: React.FC = () => {
  const { isAuthenticated, loading: isLoading } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<UsageStats>({
    totalApiCalls: 0,
    totalTokensUsed: 0,
    activeProviders: 0,
    lastUsedTime: '없음'
  });
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      fetchUsageStats();
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchUsageStats = async () => {
    setIsLoadingStats(true);
    setError(null);

    try {
      const response = await getUserStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || '통계 데이터를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      setError('통계 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const quickAccessItems = [
    {
      title: 'API 관리',
      description: 'API 키 발급 및 관리',
      icon: <FiKey className="text-blue-500 text-2xl" />,
      path: '/api-keys'
    },
    {
      title: '이용 기록',
      description: 'API 호출 기록 조회',
      icon: <FiClock className="text-green-500 text-2xl" />,
      path: '/usage-logs'
    },
    {
      title: '프로필 설정',
      description: '개인 정보 관리',
      icon: <FiServer className="text-purple-500 text-2xl" />,
      path: '/profile'
    },
    {
      title: '계정 설정',
      description: '계정 및 보안 설정',
      icon: <FiActivity className="text-orange-500 text-2xl" />,
      path: '/account'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">대시보드</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">총 API 호출</h3>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {isLoadingStats ? '로딩 중...' : formatNumber(stats.totalApiCalls)}
              </span>
              <span className="text-green-500 ml-2">
                <FiActivity />
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">총 토큰 사용량</h3>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {isLoadingStats ? '로딩 중...' : formatNumber(stats.totalTokensUsed)}
              </span>
              <span className="text-blue-500 ml-2">
                <FiServer />
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">활성 제공업체</h3>
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                {isLoadingStats ? '로딩 중...' : stats.activeProviders}
              </span>
              <span className="text-purple-500 ml-2">
                <FiServer />
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">마지막 사용</h3>
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-700">
                {isLoadingStats ? '로딩 중...' : stats.lastUsedTime}
              </span>
              <span className="text-orange-500 ml-2">
                <FiClock />
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">빠른 액세스</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickAccessItems.map((item, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(item.path)}
              >
                <div className="flex items-center mb-2">
                  {item.icon}
                  <h3 className="text-lg font-medium ml-2">{item.title}</h3>
                </div>
                <p className="text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">API 키 관리</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-700 mb-4">
              API 키를 발급하여 외부 애플리케이션이나 서비스에서 MindRoute API를 사용할 수 있습니다.
            </p>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition"
              onClick={() => router.push('/api-keys')}
            >
              <span className="flex items-center">
                <FiKey className="mr-1" />
                API 키 관리하기
              </span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 