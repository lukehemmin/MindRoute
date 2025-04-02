import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useAuthStore } from '../store/auth';
import { FiPlus, FiTrash2, FiCopy, FiInfo } from 'react-icons/fi';
import { ApiKey, getApiKeys, createApiKey, deleteApiKey } from '../services/user';

const ApiKeys: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [newKey, setNewKey] = useState<ApiKey | null>(null);

  // 인증된 사용자만 페이지 접근 가능
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      fetchApiKeys();
    }
  }, [isAuthenticated, isLoading, router]);

  // API 키 목록 가져오기
  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    setError(null);

    try {
      const response = await getApiKeys();
      
      if (response.success) {
        setApiKeys(response.data);
      } else {
        setError(response.message || 'API 키 목록을 가져오는데 실패했습니다.');
      }
    } catch (err) {
      setError('API 키 목록을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // API 키 생성
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKeyName.trim()) {
      setError('API 키 이름을 입력해주세요.');
      return;
    }
    
    setIsLoadingKeys(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await createApiKey(newKeyName);
      
      if (response.success) {
        setNewKey(response.data);
        setApiKeys([response.data, ...apiKeys]);
        setSuccess('API 키가 성공적으로 생성되었습니다.');
        setNewKeyName('');
        setShowCreateForm(false);
      } else {
        setError(response.message || 'API 키 생성에 실패했습니다.');
      }
    } catch (err) {
      setError('API 키 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // API 키 삭제
  const handleDeleteKey = async (keyId: string) => {
    if (!window.confirm('이 API 키를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    setIsLoadingKeys(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await deleteApiKey(keyId);
      
      if (response.success) {
        setApiKeys(apiKeys.filter(key => key.id !== keyId));
        setSuccess('API 키가 성공적으로 삭제되었습니다.');
      } else {
        setError(response.message || 'API 키 삭제에 실패했습니다.');
      }
    } catch (err) {
      setError('API 키 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // 클립보드에 복사
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setSuccess('API 키가 클립보드에 복사되었습니다.');
        setTimeout(() => setSuccess(null), 3000);
      },
      () => {
        setError('API 키 복사에 실패했습니다.');
      }
    );
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">API 키 관리</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded transition flex items-center"
          >
            <FiPlus className="mr-1" /> 새 API 키 생성
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">새 API 키 생성</h2>
            <form onSubmit={handleCreateKey}>
              <div className="mb-4">
                <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-2">
                  API 키 이름
                </label>
                <input
                  type="text"
                  id="keyName"
                  name="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="프로젝트 이름 또는 용도를 입력하세요"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="mr-2 bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded transition"
                  disabled={isLoadingKeys}
                >
                  {isLoadingKeys ? '처리 중...' : '생성하기'}
                </button>
              </div>
            </form>
          </div>
        )}

        {newKey && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
            <div className="flex items-start">
              <FiInfo className="mt-1 mr-2" />
              <div>
                <h3 className="font-medium">중요: 이 키는 지금 한 번만 표시됩니다!</h3>
                <p className="text-sm mt-1 mb-2">
                  이 API 키를 저장하세요. 페이지를 떠나면 전체 키를 다시 볼 수 없습니다.
                </p>
                <div className="flex items-center bg-white rounded border p-2 mb-2">
                  <code className="flex-1 text-sm font-mono truncate">{newKey.key}</code>
                  <button
                    onClick={() => copyToClipboard(newKey.key)}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    <FiCopy />
                  </button>
                </div>
                <button
                  onClick={() => setNewKey(null)}
                  className="text-sm text-yellow-800 underline"
                >
                  확인, 저장했습니다
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoadingKeys && apiKeys.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">API 키 로딩 중...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">생성된 API 키가 없습니다.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded transition"
              >
                API 키 생성하기
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API 키
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    마지막 사용
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    만료일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{key.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-gray-500 font-mono text-sm">
                          {key.key.substring(0, 10)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          title="API 키 복사"
                        >
                          <FiCopy size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(key.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.lastUsedAt ? formatDate(key.lastUsedAt) : '사용 내역 없음'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.expiresAt ? formatDate(key.expiresAt) : '만료 없음'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ApiKeys; 