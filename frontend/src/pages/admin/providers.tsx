import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../utils/authStore';
import { getAllProviders, createProvider, updateProvider, deleteProvider } from '../../services/admin';
import { ProviderInput } from '../../services/admin';
import { Provider } from '../../services/ai';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { 
  Button, 
  Card, 
  Modal, 
  Label, 
  TextInput, 
  Select,
  Spinner,
  Checkbox
} from 'flowbite-react';

// 제공업체 수정용 인터페이스 (ai.ts의 Provider와 admin.ts의 ProviderInput을 조합)
interface EditingProvider {
  id: string;
  name: string;
  type: string;
  apiKey: string;
  endpointUrl?: string;
  maxTokens?: number;
  settings?: Record<string, any>;
  active: boolean;
}

const ProvidersAdmin: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<EditingProvider | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isApiTesting, setIsApiTesting] = useState<boolean>(false);
  const [apiTestResult, setApiTestResult] = useState<{success: boolean, message: string, data?: any, error?: string} | null>(null);

  useEffect(() => {
    // 인증 상태 로딩 중이면 아무것도 하지 않음
    if (useAuthStore.getState().loading) {
      return;
    }
    
    const authState = useAuthStore.getState();
    // 인증되지 않은 경우에만 로그인 페이지로 리다이렉트
    if (!authState.isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // 관리자가 아닌 경우에만 대시보드로 리다이렉트
    if (!authState.isAdmin()) {
      router.push('/dashboard');
      return;
    }
    
    // 인증 및 권한 확인 후 데이터 로드
    fetchProviders();
    
    // 인증 상태 변경 감지를 위한 구독
    const unsubscribe = useAuthStore.subscribe(
      (state) => {
        // 인증 상태가 변경될 때 확인
        if (!state.loading) {
          if (!state.isAuthenticated) {
            router.push('/login');
          } else if (!state.isAdmin()) {
            router.push('/dashboard');
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [router]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      console.log("제공업체 목록 조회 시작");
      
      // 사용자 인증 상태 및 토큰 확인
      const authState = useAuthStore.getState();
      console.log("인증 상태:", { 
        isAuthenticated: authState.isAuthenticated, 
        hasToken: !!authState.accessToken,
        isAdmin: authState.isAdmin(),
        tokenLength: authState.accessToken ? authState.accessToken.length : 0
      });
      
      if (!authState.accessToken) {
        console.error("인증 토큰이 없습니다!");
        setError('인증 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }
      
      const response = await getAllProviders();
      console.log("제공업체 응답 데이터:", response);
      
      if (response.success) {
        console.log("성공적으로 제공업체 목록을 받았습니다:", response.data);
        
        // 백엔드 응답이 유효한지 확인
        if (Array.isArray(response.data)) {
          // 백엔드 응답 타입에 맞춰 명시적 타입 정의
          type BackendProvider = {
            id: string;
            name: string;
            type: string;
            endpointUrl?: string;
            maxTokens?: number;
            active?: boolean;
          };
          
          // 백엔드의 응답을 프론트엔드 Provider 인터페이스로 변환
          const mappedProviders = response.data.map((backendProvider: BackendProvider) => {
            // 백엔드 응답을 로깅
            console.log(`제공업체 '${backendProvider.name}' 데이터:`, backendProvider);
            
            // 프론트엔드 Provider 인터페이스에 맞게 매핑
            const provider: Provider = {
              id: backendProvider.id,
              name: backendProvider.name,
              type: backendProvider.type,
              description: backendProvider.name, // description이 없으면 name을 사용
              available: !!backendProvider.active, // active -> available로 매핑
              apiEndpoint: backendProvider.endpointUrl || ''
            };
            
            return provider;
          });
          
          setProviders(mappedProviders);
          console.log("매핑된 제공업체 목록:", mappedProviders);
        } else {
          console.error("응답 데이터가 배열이 아닙니다:", response.data);
          setError('제공업체 데이터 형식이 올바르지 않습니다.');
        }
      } else {
        console.error("제공업체 목록 가져오기 실패:", response.message);
        setError('제공업체 목록을 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('제공업체 목록 조회 오류:', err);
      setError('제공업체 목록을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = () => {
    setEditingProvider({
      id: '',
      name: '',
      type: 'openai',
      apiKey: '',
      endpointUrl: '',
      maxTokens: 0,
      settings: {},
      active: true
    });
    setIsCreating(true);
    setIsModalOpen(true);
    setApiTestResult(null);
  };

  const handleEditProvider = (provider: Provider) => {
    console.log('편집할 제공업체 데이터:', {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      available: provider.available
    });
    
    setEditingProvider({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      apiKey: '',  // 보안상 API 키는 빈 값으로 표시
      endpointUrl: provider.apiEndpoint,
      maxTokens: 0, // 기본값 설정
      settings: {},
      active: provider.available // 백엔드 active와 프론트엔드 available 간 매핑
    });
    console.log('편집용 제공업체 객체 생성:', {
      id: provider.id,
      active: provider.available
    });
    
    setIsCreating(false);
    setIsModalOpen(true);
    setApiTestResult(null);
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (window.confirm('정말로 이 제공업체를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.')) {
      try {
        setLoading(true);
        const response = await deleteProvider(providerId);
        
        if (response.success) {
          setProviders(providers.filter(provider => provider.id !== providerId));
        } else {
          setError('제공업체 삭제에 실패했습니다.');
        }
      } catch (err) {
        console.error('제공업체 삭제 오류:', err);
        setError('제공업체를 삭제하는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveProvider = async () => {
    if (!editingProvider) return;
    
    try {
      setLoading(true);
      console.log('저장 중인 제공업체 데이터:', {
        ...editingProvider,
        apiKey: editingProvider.apiKey ? '******' : undefined
      });
      
      if (isCreating) {
        // 새 제공업체 생성
        const response = await createProvider({
          ...editingProvider,
          active: editingProvider.active
        });
        
        if (response.success) {
          toast.success('제공업체가 성공적으로 생성되었습니다.');
          await fetchProviders(); // 목록 새로고침으로 변경
          setIsModalOpen(false);
          setEditingProvider(null);
        } else {
          setError('제공업체 생성에 실패했습니다.');
          toast.error('제공업체 생성에 실패했습니다.');
        }
      } else {
        // 기존 제공업체 수정 - API 키가 비어있는 경우 제외
        const updateData: Partial<ProviderInput> = { 
          id: editingProvider.id,
          name: editingProvider.name,
          type: editingProvider.type,
          endpointUrl: editingProvider.endpointUrl,
          maxTokens: editingProvider.maxTokens,
          settings: editingProvider.settings,
          active: editingProvider.active
        };
        
        // API 키가 비어있으면 전송하지 않음
        if (editingProvider.apiKey && editingProvider.apiKey.trim() !== '') {
          updateData.apiKey = editingProvider.apiKey;
          console.log('API 키가 입력되어 업데이트에 포함됩니다. (마스킹됨)');
        } else {
          console.log('API 키가 비어있어 업데이트에서 제외합니다.');
        }
        
        console.log('서버로 전송할 최종 데이터:', {
          ...updateData,
          apiKey: updateData.apiKey ? '******' : undefined
        });
        
        // 제공업체 정보 업데이트
        const response = await updateProvider(editingProvider.id, updateData);
        
        if (response.success) {
          // 사용자에게 명확한 피드백 제공
          let successMessage = '제공업체가 성공적으로 업데이트되었습니다.';
          
          // API 키 업데이트 확인
          if (editingProvider.apiKey && editingProvider.apiKey.trim() !== '') {
            successMessage += ' API 키가 업데이트되었습니다.';
          }
          
          // 활성화 상태 변경 확인
          const currentProvider = providers.find(p => p.id === editingProvider.id);
          if (currentProvider && currentProvider.available !== editingProvider.active) {
            successMessage += ` 제공업체가 ${editingProvider.active ? '활성화' : '비활성화'} 되었습니다.`;
          }
          
          toast.success(successMessage);
          
          // 제공업체 목록 즉시 갱신
          await fetchProviders();
          setIsModalOpen(false);
          setEditingProvider(null);
        } else {
          setError('제공업체 수정에 실패했습니다.');
          toast.error('제공업체 수정에 실패했습니다.');
        }
      }
    } catch (err) {
      console.error('제공업체 저장 오류:', err);
      setError('제공업체를 저장하는 중 오류가 발생했습니다.');
      toast.error('제공업체 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiConnection = async () => {
    if (!editingProvider) return;
    
    if (!editingProvider.apiKey.trim()) {
      toast.error('API 키를 입력해주세요.');
      return;
    }
    
    try {
      setIsApiTesting(true);
      setApiTestResult(null);
      
      const { testProviderApi } = await import('../../services/admin');
      const result = await testProviderApi(editingProvider.id, {
        type: editingProvider.type,
        apiKey: editingProvider.apiKey,
        endpointUrl: editingProvider.endpointUrl
      });
      
      setApiTestResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('API 테스트 중 오류:', error);
      setApiTestResult({
        success: false,
        message: '알 수 없는 오류가 발생했습니다.',
        error: 'UNKNOWN_ERROR'
      });
      toast.error('API 테스트 중 오류가 발생했습니다.');
    } finally {
      setIsApiTesting(false);
    }
  };

  const providerTypeOptions = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'google', label: 'Google AI' }
  ];

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">AI 제공업체 관리</h1>
              <p className="mt-1 text-sm text-gray-500">AI 서비스 제공업체 및 모델 설정을 관리합니다.</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
              >
                대시보드로 돌아가기
              </button>
              <button
                onClick={handleCreateProvider}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                제공업체 추가
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {/* 제공업체 목록 */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            {loading && !isModalOpen ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : providers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {providers.map((provider) => (
                  <li key={provider.id}>
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="sm:flex sm:items-center sm:space-x-4">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">{provider.name}</h3>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            provider.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {provider.available ? '활성' : '비활성'}
                          </span>
                        </div>
                        <div className="flex space-x-4">
                          <button
                            onClick={() => handleEditProvider(provider)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDeleteProvider(provider.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex sm:space-x-6">
                          <p className="flex items-center text-sm text-gray-500">
                            타입: {provider.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-12 text-center text-gray-500">
                등록된 제공업체가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 제공업체 추가/편집 모달 */}
      {isModalOpen && editingProvider && (
        <div className="modal-container">
          <div className="modal-flex-container">
            <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="modal-content overflow-y-auto max-h-[80vh]">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {isCreating ? '제공업체 추가' : '제공업체 편집'}
                    </h3>
                    <div className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">제공업체 이름</label>
                          <input
                            type="text"
                            id="name"
                            value={editingProvider.name}
                            onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700">제공업체 유형</label>
                          <select
                            id="type"
                            value={editingProvider.type}
                            onChange={(e) => setEditingProvider({ ...editingProvider, type: e.target.value })}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          >
                            {providerTypeOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">API 키</label>
                          <input
                            type="password"
                            id="apiKey"
                            value={editingProvider.apiKey}
                            onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="endpointUrl" className="block text-sm font-medium text-gray-700">엔드포인트 URL (선택)</label>
                          <input
                            type="text"
                            id="endpointUrl"
                            value={editingProvider.endpointUrl || ''}
                            onChange={(e) => setEditingProvider({ ...editingProvider, endpointUrl: e.target.value })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={handleTestApiConnection}
                            disabled={isApiTesting}
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            {isApiTesting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                API 테스트 중...
                              </>
                            ) : "API 연결 테스트"}
                          </button>
                        </div>
                        
                        {apiTestResult && (
                          <div className={`mt-2 p-3 rounded-md text-sm ${apiTestResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            <p className="font-medium">{apiTestResult.message}</p>
                            {apiTestResult.success && apiTestResult.data?.modelsCount && (
                              <p className="mt-1">사용 가능한 모델: {apiTestResult.data.modelsCount}개</p>
                            )}
                            {apiTestResult.success && apiTestResult.data?.models && (
                              <div className="mt-1">
                                <p className="font-medium">일부 모델 목록:</p>
                                <ul className="mt-1 ml-4 list-disc">
                                  {apiTestResult.data.models.slice(0, 5).map((model: {id: string, name: string}) => (
                                    <li key={model.id}>{model.name}</li>
                                  ))}
                                  {apiTestResult.data.models.length > 5 && (
                                    <li>... 외 {apiTestResult.data.models.length - 5}개</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div>
                          <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">최대 토큰 (0은 무제한)</label>
                          <input
                            type="number"
                            id="maxTokens"
                            value={editingProvider.maxTokens}
                            onChange={(e) => setEditingProvider({ ...editingProvider, maxTokens: parseInt(e.target.value) })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div className="mt-4 space-y-4">
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="active"
                                type="checkbox"
                                checked={editingProvider.active}
                                onChange={(e) => setEditingProvider({ ...editingProvider, active: e.target.checked })}
                                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="active" className="font-medium text-gray-700">활성화</label>
                              <p className="text-gray-500">이 제공업체를 시스템에서 활성화할지 설정합니다.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSaveProvider}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isCreating ? '추가' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setApiTestResult(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProvidersAdmin; 