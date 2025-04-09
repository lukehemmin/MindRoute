import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import useAuthStore from '../utils/authStore';
import { FiServer, FiKey, FiClock, FiActivity, FiRefreshCw } from 'react-icons/fi';
import { getUserStats, UsageStats } from '../services/user';

const Dashboard: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<UsageStats>({
    totalApiCalls: 0,
    totalTokensUsed: 0,
    activeProviders: 0,
    lastUsedTime: '없음'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchStats();
  }, [isAuthenticated, loading, router]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getUserStats();
      if (response.success) {
        setStats(response.data);
      } else {
        // 401 인증 오류가 발생할 경우
        if (response.status === 401) {
          setShowLoginPrompt(true);
          setError('인증이 필요합니다. 다시 로그인해 주세요.');
        } else {
          setError(response.message || '통계 데이터를 가져오는데 실패했습니다.');
        }
      }
    } catch (err: any) {
      console.error('통계 데이터 조회 오류:', err);
      
      // 오류 응답의 상태 코드 확인
      if (err.response?.status === 401) {
        setShowLoginPrompt(true);
        setError('인증 세션이 만료되었습니다. 다시 로그인해 주세요.');
      } else {
        setError('통계 데이터를 가져오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    fetchStats();
  };

  const handleLogin = () => {
    useAuthStore.getState().logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-primary-600 mb-4" role="status">
            </div>
            <p className="text-lg">로딩 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-red-600">로그인이 필요합니다</p>
            <p className="text-gray-600 mt-2">이 페이지에 접근하려면 로그인이 필요합니다</p>
          </div>
          <button 
            onClick={() => router.push('/login')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">대시보드</h1>
            <p className="text-gray-600">지금까지의 API 사용 현황을 한눈에 확인하세요.</p>
          </div>
          {user && (
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">
                <strong>{user.name}</strong>님 환영합니다
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">오류 발생</p>
                <p className="text-sm">{error}</p>
              </div>
              <div className="flex">
                {showLoginPrompt && (
                  <button 
                    onClick={handleLogin}
                    className="mr-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    로그인
                  </button>
                )}
                <button 
                  onClick={handleRetry}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded flex items-center"
                >
                  <FiRefreshCw className="mr-1" /> 재시도
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <FiActivity className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-medium">총 API 호출</h2>
            </div>
            <div className="text-3xl font-bold mb-2">{isLoading ? '-' : stats.totalApiCalls.toLocaleString()}</div>
            <p className="text-gray-500 text-sm">모든 API 엔드포인트 호출의 합계</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <FiKey className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-medium">토큰 사용량</h2>
            </div>
            <div className="text-3xl font-bold mb-2">{isLoading ? '-' : stats.totalTokensUsed.toLocaleString()}</div>
            <p className="text-gray-500 text-sm">전체 토큰 사용량</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <FiServer className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-lg font-medium">활성 제공업체</h2>
            </div>
            <div className="text-3xl font-bold mb-2">{isLoading ? '-' : stats.activeProviders}</div>
            <p className="text-gray-500 text-sm">현재 사용 가능한 AI 제공업체 수</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-yellow-100 p-3 mr-4">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
              <h2 className="text-lg font-medium">마지막 사용</h2>
            </div>
            <div className="text-xl font-bold mb-2">{isLoading ? '-' : stats.lastUsedTime}</div>
            <p className="text-gray-500 text-sm">가장 최근 API 사용 시간</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">빠른 시작</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 className="font-medium mb-2">API 키 발급하기</h3>
              <p className="text-gray-600 text-sm mb-3">API를 사용하기 위한 첫 번째 단계, API 키를 생성하세요.</p>
              <button
                onClick={() => router.push('/api-keys')}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                API 키 관리 &rarr;
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 className="font-medium mb-2">AI 플레이그라운드</h3>
              <p className="text-gray-600 text-sm mb-3">다양한 AI 모델을 직접 테스트하고 결과를 비교해보세요.</p>
              <button
                onClick={() => router.push('/playground')}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                플레이그라운드 가기 &rarr;
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all">
              <h3 className="font-medium mb-2">API 문서 보기</h3>
              <p className="text-gray-600 text-sm mb-3">MindRoute API의 사용 방법에 대한 자세한 문서입니다.</p>
              <button
                onClick={() => router.push('/docs')}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                API 문서 보기 &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 