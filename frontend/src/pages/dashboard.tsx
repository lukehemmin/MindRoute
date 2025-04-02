import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import useAuthStore from '../utils/authStore';
import { getProviders } from '../services/ai';
import { Provider } from '../services/ai';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 제공업체 목록 가져오기
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const result = await getProviders();
        
        if (result.success) {
          setProviders(result.data);
        } else {
          setError('제공업체 목록을 가져오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('제공업체 목록 조회 오류:', err);
        setError('제공업체 목록을 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [isAuthenticated, router]);

  // 통계 데이터 (실제로는 API에서 가져와야 함)
  const stats = [
    { name: '총 API 호출 수', value: '24,521' },
    { name: '총 토큰 사용량', value: '2,103,430' },
    { name: '활성 제공업체', value: providers.filter(p => p.available).length.toString() },
    { name: '마지막 사용', value: '1시간 전' },
  ];

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">대시보드</h1>
          
          <div className="mt-2">
            <p className="text-gray-500">
              안녕하세요, <span className="font-medium text-gray-900">{user?.name}</span>님!
            </p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 통계 카드 */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 제공업체 목록 */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">AI 제공업체</h2>
            
            {loading ? (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="mt-4 bg-red-50 p-4 rounded-md">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={() => router.push(`/providers/${provider.id}`)}
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{provider.name}</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            provider.available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {provider.available ? '활성' : '비활성'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{provider.type}</p>
                      <div className="mt-4 space-y-2 text-sm text-gray-500">
                        <div className="flex">
                          <div className="w-32">이미지 지원:</div>
                          <div>{provider.allowImages ? '가능' : '불가능'}</div>
                        </div>
                        <div className="flex">
                          <div className="w-32">비디오 지원:</div>
                          <div>{provider.allowVideos ? '가능' : '불가능'}</div>
                        </div>
                        <div className="flex">
                          <div className="w-32">파일 지원:</div>
                          <div>{provider.allowFiles ? '가능' : '불가능'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/playground?provider=${provider.id}`);
                          }}
                          className="font-medium text-primary-600 hover:text-primary-500"
                        >
                          플레이그라운드에서 사용하기
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 빠른 액세스 버튼 */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">빠른 액세스</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => router.push('/playground')}
                className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="block text-sm font-medium text-gray-900">AI 플레이그라운드</span>
              </button>
              
              <button
                onClick={() => router.push('/history')}
                className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="block text-sm font-medium text-gray-900">이용 기록</span>
              </button>
              
              <button
                onClick={() => router.push('/providers')}
                className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="block text-sm font-medium text-gray-900">제공업체 관리</span>
              </button>
              
              <button
                onClick={() => router.push('/profile')}
                className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="block text-sm font-medium text-gray-900">계정 설정</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 