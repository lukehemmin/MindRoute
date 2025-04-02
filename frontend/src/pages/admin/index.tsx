import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../utils/authStore';
import { getAllUsers, getAllProviders, getLogs } from '../../services/admin';
import { User, Log, PaginationResponse } from '../../services/admin';
import { Provider } from '../../services/ai';

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // 인증되지 않았거나 관리자가 아닌 경우 접근 거부
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!useAuthStore.getState().isAdmin()) {
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 사용자 목록 가져오기
        const usersResult = await getAllUsers();
        if (usersResult.success) {
          setUsers(usersResult.data.items);
        }
        
        // 제공업체 목록 가져오기
        const providersResult = await getAllProviders();
        if (providersResult.success) {
          setProviders(providersResult.data);
        }
        
        // 최근 로그 가져오기
        const logsResult = await getLogs(1, 10);
        if (logsResult.success) {
          setLogs(logsResult.data.items);
        }
      } catch (err) {
        console.error('관리자 대시보드 데이터 로딩 오류:', err);
        setError('관리자 대시보드 데이터를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, router]);

  const adminCards = [
    {
      title: '사용자 관리',
      description: '사용자 계정을 관리하고 권한을 설정합니다.',
      path: '/admin/users',
      count: users.length,
    },
    {
      title: '제공업체 관리',
      description: 'API 제공업체 및 모델 설정을 관리합니다.',
      path: '/admin/providers',
      count: providers.length,
    },
    {
      title: '로그 관리',
      description: 'API 호출 로그 및 시스템 로그를 확인합니다.',
      path: '/admin/logs',
      count: logs.length,
    },
    {
      title: '문의 관리',
      description: '사용자 문의에 응답하고 관리합니다.',
      path: '/admin/tickets',
      count: 0,
    },
  ];

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">관리자 대시보드</h1>
          
          <div className="mt-2">
            <p className="text-gray-500">
              시스템 관리를 위한 대시보드입니다.
            </p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* 관리자 카드 */}
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {adminCards.map((card) => (
                  <div 
                    key={card.title}
                    className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-all"
                    onClick={() => router.push(card.path)}
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
                          <p className="mt-1 text-sm text-gray-500">{card.description}</p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                            {card.count}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                      <div className="text-sm">
                        <button className="font-medium text-primary-600 hover:text-primary-500">
                          관리하기 <span aria-hidden="true">&rarr;</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 최근 로그 */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">최근 API 호출 로그</h2>
                  <button 
                    onClick={() => router.push('/admin/logs')}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    모든 로그 보기
                  </button>
                </div>
                <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                  {logs.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {logs.map((log) => (
                        <li key={log.id}>
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-primary-600 truncate">
                                {log.requestType}
                              </p>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  log.status === 'success' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {log.status}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  사용자: {log.user?.name || log.userId}
                                </p>
                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  제공업체: {log.provider?.name || log.providerId}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <p>
                                  {new Date(log.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                      로그 데이터가 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* 시스템 상태 */}
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">시스템 상태</h2>
                <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">활성 사용자</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{users.filter(u => u.isActive).length}</dd>
                      </div>
                      <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">활성 제공업체</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{providers.filter(p => p.available).length}</dd>
                      </div>
                      <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">오늘의 API 호출</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                          {logs.filter(log => {
                            const today = new Date();
                            const logDate = new Date(log.createdAt);
                            return (
                              logDate.getDate() === today.getDate() &&
                              logDate.getMonth() === today.getMonth() &&
                              logDate.getFullYear() === today.getFullYear()
                            );
                          }).length}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard; 