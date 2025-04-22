import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../utils/authStore';
import { ApiLog, ApiLogFilters, getApiLogs } from '../../services/admin';

const ApiLogsAdmin: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // 필터 상태
  const [email, setEmail] = useState<string>('');
  const [apiKeyId, setApiKeyId] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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

    fetchLogs();
  }, [isAuthenticated, router, currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // 필터 구성
      const filters: ApiLogFilters = {};
      if (email) filters.email = email;
      if (apiKeyId) filters.apiKeyId = apiKeyId;
      if (model) filters.model = model;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const response = await getApiLogs(currentPage, 10, filters);
      
      if (response.success) {
        setLogs(response.data.logs);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError('API 로그 목록을 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('API 로그 목록 조회 오류:', err);
      setError('API 로그 목록을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilter = () => {
    setEmail('');
    setApiKeyId('');
    setModel('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchLogs();
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

  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            이전
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            다음
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{currentPage}</span> 페이지 / 총 <span className="font-medium">{totalPages}</span> 페이지
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">이전</span>
                &lt;
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (currentPage <= 3) {
                  pageNumber = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = currentPage - 2 + index;
                }
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNumber
                        ? 'bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">다음</span>
                &gt;
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">API 로그 관리</h1>
              <p className="mt-1 text-sm text-gray-500">사용자 API 요청 로그를 조회하고 관리합니다.</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              대시보드로 돌아가기
            </button>
          </div>
          
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {/* 필터 패널 */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">로그 필터</h2>
            <form onSubmit={handleFilter}>
              <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">사용자 이메일</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="apiKeyId" className="block text-sm font-medium text-gray-700">API 키 ID</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="apiKeyId"
                      value={apiKeyId}
                      onChange={(e) => setApiKeyId(e.target.value)}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">모델</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">시작일</label>
                  <div className="mt-1">
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">종료일</label>
                  <div className="mt-1">
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  필터 초기화
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  적용
                </button>
              </div>
            </form>
          </div>
          
          {/* 로그 목록 */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">표시할 API 로그가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        API 키
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        모델
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        토큰
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        일시
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        자세히
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.email || '미인증 사용자'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.apiKeyName ? `${log.apiKeyName} (${log.apiKey?.substring(0, 8)}...)` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.model || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.totalTokens ? `${log.totalTokens.toLocaleString()} (P: ${log.promptTokens}, C: ${log.completionTokens})` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/admin/api-logs/${log.id}`)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            상세 보기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* 페이지네이션 */}
            {renderPagination()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ApiLogsAdmin; 