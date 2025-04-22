import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import useAuthStore from '../../../utils/authStore';
import { ApiLog, getApiLogById } from '../../../services/admin';

const ApiLogDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuthStore();
  const [log, setLog] = useState<ApiLog | null>(null);
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

    if (id) {
      fetchLogDetail();
    }
  }, [isAuthenticated, router, id]);

  const fetchLogDetail = async () => {
    try {
      setLoading(true);
      const response = await getApiLogById(id as string);
      
      if (response.success) {
        setLog(response.data);
      } else {
        setError('API 로그를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('API 로그 상세 조회 오류:', err);
      setError('API 로그를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">API 로그 상세</h1>
              <p className="mt-1 text-sm text-gray-500">API 요청 상세 정보를 확인합니다.</p>
            </div>
            <button
              onClick={() => router.push('/admin/api-logs')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              목록으로 돌아가기
            </button>
          </div>
          
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {loading ? (
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <p className="text-center text-gray-500">로딩 중...</p>
            </div>
          ) : log ? (
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">API 로그 기본 정보</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">API 요청에 대한 기본 정보입니다.</p>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{log.id}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">사용자</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {log.email || '미인증 사용자'}
                      {log.user && ` (ID: ${log.user.id})`}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">API 키</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {log.apiKeyName ? `${log.apiKeyName} (${log.apiKey})` : '기본 인증'}
                      {log.apiKeyId && ` - ID: ${log.apiKeyId}`}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">모델</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{log.model || '모델 정보 없음'}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">토큰 사용량</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {log.totalTokens ? (
                        <>
                          총 {log.totalTokens.toLocaleString()} 토큰
                          <span className="ml-2 text-xs text-gray-500">
                            (입력: {log.promptTokens?.toLocaleString() || 0}, 출력: {log.completionTokens?.toLocaleString() || 0})
                          </span>
                        </>
                      ) : (
                        '토큰 정보 없음'
                      )}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">요청 시간</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(log.createdAt)}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">구성 설정</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {log.configuration ? (
                        <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-48">
                          {JSON.stringify(log.configuration, null, 2)}
                        </pre>
                      ) : (
                        '구성 정보 없음'
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">요청 및 응답</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">API 요청 및 응답 데이터입니다.</p>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-white px-4 py-5 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 mb-2">입력 데이터</dt>
                    <dd className="text-sm text-gray-900">
                      <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
                        {JSON.stringify(log.input, null, 2)}
                      </pre>
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 mb-2">출력 데이터</dt>
                    <dd className="text-sm text-gray-900">
                      <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
                        {log.output ? JSON.stringify(log.output, null, 2) : '응답 데이터 없음'}
                      </pre>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <p className="text-center text-gray-500">API 로그를 찾을 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ApiLogDetail; 