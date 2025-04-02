import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { getApiKeys, createApiKey, deleteApiKey, ApiKey } from '../services/user';
import useAuthStore from '../utils/authStore';
import { FiPlus, FiTrash, FiCopy, FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi';

export default function ApiKeysPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [keyVisibility, setKeyVisibility] = useState<{[key: string]: boolean}>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApiKeys();
    }
  }, [isAuthenticated]);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getApiKeys();
      if (response.success) {
        setApiKeys(response.data);
      } else {
        if (response.status === 401) {
          setShowLoginPrompt(true);
          setError('인증이 필요합니다. 다시 로그인해 주세요.');
        } else {
          setError(response.message || 'API 키를 불러오는데 실패했습니다.');
        }
      }
    } catch (err) {
      setError('API 키를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      setError('API 키 이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await createApiKey(newKeyName);
      if (response.success) {
        setApiKeys([response.data, ...apiKeys]);
        setNewKeyName('');
        setShowNewKey(response.data.key);
      } else {
        if (response.status === 401) {
          setShowLoginPrompt(true);
          setError('인증이 필요합니다. 다시 로그인해 주세요.');
        } else {
          setError(response.message || 'API 키 생성에 실패했습니다.');
        }
      }
    } catch (err) {
      setError('API 키 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('이 API 키를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await deleteApiKey(keyId);
      if (response.success) {
        setApiKeys(apiKeys.filter(key => key.id !== keyId));
      } else {
        if (response.status === 401) {
          setShowLoginPrompt(true);
          setError('인증이 필요합니다. 다시 로그인해 주세요.');
        } else {
          setError(response.message || 'API 키 삭제에 실패했습니다.');
        }
      }
    } catch (err) {
      setError('API 키 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    fetchApiKeys();
  };

  const handleLogin = () => {
    useAuthStore.getState().logout();
    router.push('/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('API 키가 클립보드에 복사되었습니다.');
      })
      .catch(() => {
        alert('클립보드 복사에 실패했습니다.');
      });
  };

  const toggleKeyVisibility = (keyId: string) => {
    setKeyVisibility({
      ...keyVisibility,
      [keyId]: !keyVisibility[keyId]
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '없음';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p className="text-lg">로딩 중...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">API 키 관리</h1>
          {user && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user.name}</span>님의 API 키
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

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">새 API 키 생성</h2>
          <form onSubmit={handleCreateKey} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="API 키 이름 (예: 프로덕션, 테스트 등)"
              className="flex-1 border rounded-md px-4 py-2"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md flex items-center justify-center"
              disabled={isLoading}
            >
              <FiPlus className="mr-2" />
              생성하기
            </button>
          </form>
        </div>

        {showNewKey && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold mb-1">새 API 키가 생성되었습니다</p>
                <p className="mb-1">이 키는 다시 표시되지 않으니 안전한 곳에 저장해주세요.</p>
                <p className="font-mono break-all bg-green-50 p-2 rounded">{showNewKey}</p>
              </div>
              <div>
                <button
                  onClick={() => copyToClipboard(showNewKey)}
                  className="bg-green-600 text-white p-2 rounded"
                >
                  <FiCopy />
                </button>
              </div>
            </div>
            <div className="mt-2">
              <button
                onClick={() => setShowNewKey(null)}
                className="text-green-800 underline"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API 키 목록</h2>
          
          {isLoading ? (
            <p>로딩 중...</p>
          ) : apiKeys.length === 0 ? (
            <p>등록된 API 키가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
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
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiKeys.map((key) => (
                    <tr key={key.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {key.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        <div className="flex items-center">
                          {keyVisibility[key.id] ? (
                            <span>{key.key}</span>
                          ) : (
                            <span>••••••••••••••••••••</span>
                          )}
                          <button
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            {keyVisibility[key.id] ? <FiEyeOff /> : <FiEye />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(key.key)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            <FiCopy />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(key.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(key.lastUsedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(key.expiresAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-red-600 hover:text-red-900 flex items-center ml-auto"
                        >
                          <FiTrash className="mr-1" />
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 