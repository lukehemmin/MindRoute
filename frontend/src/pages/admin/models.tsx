import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../utils/authStore';
import { 
  getAllModels, 
  getModelsByProviderId, 
  createModel, 
  updateModel, 
  deleteModel,
  refreshProviderModels
} from '../../services/api';
import { getAllProviders } from '../../services/admin';
import { AIModel, Provider } from '../../types/provider';

// 모델 생성/수정을 위한 폼 데이터 인터페이스
interface ModelFormData {
  id?: string;
  providerId: string;
  name: string;
  modelId: string;
  allowImages: boolean;
  allowVideos: boolean;
  allowFiles: boolean;
  maxTokens?: number;
  contextWindow?: number;
  inputPrice?: number;
  outputPrice?: number;
  active: boolean;
  settings: Record<string, any>;
}

const ModelsAdmin = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  // 상태 관리
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(true);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  
  // 모델 폼 데이터
  const [modelForm, setModelForm] = useState<ModelFormData>({
    providerId: '',
    name: '',
    modelId: '',
    allowImages: false,
    allowVideos: false,
    allowFiles: false,
    maxTokens: undefined,
    contextWindow: undefined,
    inputPrice: undefined,
    outputPrice: undefined,
    active: true,
    settings: {}
  });

  // 컴포넌트 마운트 시 데이터 로드
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
    fetchModels();
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

  // 모든 모델 데이터 가져오기
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllModels();
      
      if (response.success) {
        setModels(response.data);
      } else {
        setError('모델 데이터를 가져오는데 실패했습니다.');
        toast.error('모델 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('모델 목록 조회 오류:', err);
      setError('모델 목록을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 제공업체 데이터 가져오기
  const fetchProviders = async () => {
    try {
      const response = await getAllProviders();
      
      if (response.success) {
        // 백엔드 응답에서 active 속성을 available로 매핑
        if (Array.isArray(response.data)) {
          // 백엔드의 응답을 프론트엔드 Provider 인터페이스로 변환
          const mappedProviders = response.data.map((backendProvider: any) => {
            console.log(`제공업체 '${backendProvider.name}' 데이터:`, backendProvider);
            
            // 프론트엔드 Provider 인터페이스에 맞게 매핑 (active -> available)
            return {
              ...backendProvider,
              available: !!backendProvider.active, // active -> available로 명시적 변환
              apiEndpoint: backendProvider.endpointUrl || ''
            };
          });
          
          console.log("매핑된 제공업체 목록:", mappedProviders);
          setProviders(mappedProviders);
        } else {
          console.error("응답 데이터가 배열이 아닙니다:", response.data);
          setProviders([]);
        }
      } else {
        toast.error('제공업체 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('제공업체 목록 조회 오류:', err);
    }
  };

  // 제공업체 필터링 적용 시
  const handleProviderFilter = async (providerId: string | null) => {
    try {
      setLoading(true);
      setSelectedProviderId(providerId);
      
      if (providerId) {
        const response = await getModelsByProviderId(providerId);
        if (response.success) {
          setModels(response.data);
        } else {
          toast.error('해당 제공업체의 모델을 불러올 수 없습니다.');
        }
      } else {
        // 전체 모델 다시 로드
        fetchModels();
      }
    } catch (err) {
      console.error('제공업체별 모델 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 모델 생성 모달 열기
  const handleCreateModel = () => {
    setModelForm({
      providerId: providers.length > 0 ? providers[0].id : '',
      name: '',
      modelId: '',
      allowImages: false,
      allowVideos: false,
      allowFiles: false,
      maxTokens: undefined,
      contextWindow: undefined,
      inputPrice: undefined,
      outputPrice: undefined,
      active: true,
      settings: {}
    });
    setIsCreating(true);
    setIsModalOpen(true);
  };

  // 모델 수정 모달 열기
  const handleEditModel = (model: AIModel) => {
    setModelForm({
      id: model.id,
      providerId: model.providerId,
      name: model.name,
      modelId: model.modelId,
      allowImages: model.allowImages,
      allowVideos: model.allowVideos,
      allowFiles: model.allowFiles,
      maxTokens: model.maxTokens,
      contextWindow: model.contextWindow,
      inputPrice: model.inputPrice,
      outputPrice: model.outputPrice,
      active: model.active,
      settings: model.settings || {}
    });
    setIsCreating(false);
    setIsModalOpen(true);
  };

  // 폼 입력값 변경 처리
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    setModelForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 스위치 변경 처리
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setModelForm(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // 모델 삭제
  const handleDeleteModel = async (modelId: string) => {
    if (!window.confirm('정말로 이 모델을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const response = await deleteModel(modelId);
      
      if (response.success) {
        toast.success('모델이 성공적으로 삭제되었습니다.');
        fetchModels(); // 목록 새로고침
      } else {
        toast.error('모델 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('모델 삭제 오류:', err);
      toast.error('모델 삭제 중 오류가 발생했습니다.');
    }
  };

  // 모델 저장 (생성 또는 수정)
  const handleSaveModel = async () => {
    try {
      // 필수 필드 검증
      if (!modelForm.providerId || !modelForm.name || !modelForm.modelId) {
        toast.error('필수 필드를 모두 입력해주세요.');
        return;
      }
      
      let response;
      
      if (isCreating) {
        // 새 모델 생성
        response = await createModel(modelForm);
      } else {
        // 모델 수정
        response = await updateModel(modelForm.id!, modelForm);
      }
      
      if (response.success) {
        toast.success(isCreating ? '새 모델이 생성되었습니다.' : '모델 정보가 업데이트되었습니다.');
        setIsModalOpen(false);
        fetchModels(); // 목록 새로고침
      } else {
        toast.error(isCreating ? '모델 생성에 실패했습니다.' : '모델 업데이트에 실패했습니다.');
      }
    } catch (err) {
      console.error('모델 저장 오류:', err);
      toast.error('모델 저장 중 오류가 발생했습니다.');
    }
  };

  // 모델 새로고침 요청
  const handleRefreshModels = async (providerId: string) => {
    try {
      setLoading(true);
      const response = await refreshProviderModels(providerId);
      
      if (response.success) {
        toast.success(response.message || '모델 목록이 새로고침되었습니다.');
        // 선택된 제공업체가 있으면 해당 제공업체의 모델 목록 다시 로드
        if (selectedProviderId) {
          handleProviderFilter(selectedProviderId);
        } else {
          fetchModels(); // 전체 모델 목록 다시 로드
        }
      } else {
        toast.error(response.message || '모델 새로고침에 실패했습니다.');
      }
    } catch (err) {
      console.error('모델 새로고침 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 모든 제공업체 모델 새로고침
  const handleRefreshAllModels = async () => {
    try {
      setLoading(true);
      // 활성화된 모든 제공업체에 대해 새로고침 수행
      const activeProviders = providers.filter(provider => provider.available);
      
      if (activeProviders.length === 0) {
        toast.error('활성화된 제공업체가 없습니다.');
        setLoading(false);
        return;
      }
      
      console.log('활성화된 제공업체:', activeProviders);
      let successCount = 0;
      let errorMessages: string[] = [];
      
      for (const provider of activeProviders) {
        try {
          console.log(`${provider.name} 제공업체 모델 새로고침 시도...`);
          const response = await refreshProviderModels(provider.id);
          
          if (response.success) {
            successCount++;
            console.log(`${provider.name} 제공업체 모델 새로고침 성공`);
          } else {
            console.error(`${provider.name} 제공업체 모델 새로고침 실패:`, response.message);
            errorMessages.push(`${provider.name}: ${response.message || '알 수 없는 오류'}`);
          }
        } catch (err: any) {
          console.error(`${provider.name} 모델 새로고침 오류:`, err);
          errorMessages.push(`${provider.name}: ${err.message || '알 수 없는 오류'}`);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount}개 제공업체의 모델 목록이 새로고침되었습니다.`);
        fetchModels(); // 전체 모델 목록 다시 로드
      } else {
        toast.error('모든 제공업체 모델 새로고침에 실패했습니다.');
        if (errorMessages.length > 0) {
          console.error('오류 메시지:', errorMessages);
        }
      }
    } catch (err) {
      console.error('모든 모델 새로고침 오류:', err);
      toast.error('모델 새로고침 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 제공업체별로 모델 데이터 그룹화
  const groupModelsByProvider = () => {
    const grouped: Record<string, {provider: Provider, models: AIModel[]}> = {};
    
    if (models.length > 0 && providers.length > 0) {
      models.forEach(model => {
        const provider = providers.find(p => p.id === model.providerId);
        if (provider) {
          if (!grouped[provider.id]) {
            grouped[provider.id] = {
              provider,
              models: []
            };
          }
          grouped[provider.id].models.push(model);
        }
      });
    }
    
    return grouped;
  };

  const groupedModels = groupModelsByProvider();

  // 로딩 중일 때 스피너 표시
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">API 모델 관리</h1>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md flex items-center hover:bg-gray-300"
              onClick={handleRefreshAllModels}
              disabled={loading}
            >
              <FiRefreshCw className="mr-2" /> 전체 새로고침
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
              onClick={handleCreateModel}
            >
              <FiPlus className="mr-2" /> 모델 추가
            </button>
          </div>
        </div>

        {/* 제공업체 필터 */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="font-medium">제공업체 필터:</span>
          <button
            className={`px-3 py-1 rounded-md ${
              selectedProviderId === null ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => handleProviderFilter(null)}
          >
            전체
          </button>
          {providers
            .filter(provider => provider.available) // 활성화된 제공업체만 필터링
            .map(provider => (
              <div key={provider.id} className="flex items-center">
                <button
                  className={`px-3 py-1 rounded-md ${
                    selectedProviderId === provider.id ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                  onClick={() => handleProviderFilter(provider.id)}
                >
                  {provider.name}
                </button>
                <button
                  className="ml-1 p-1 text-gray-600 hover:text-blue-600"
                  onClick={() => handleRefreshModels(provider.id)}
                  title={`${provider.name} 모델 새로고침`}
                >
                  <FiRefreshCw size={16} />
                </button>
              </div>
            ))}
        </div>

        {/* 모델 목록 */}
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <span className="text-gray-500">로딩 중...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">{error}</div>
        ) : selectedProviderId ? (
          // 선택된 제공업체의 모델 목록
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">모델 ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">컨텍스트 창</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기능</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {models.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  models.map(model => (
                    <tr key={model.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{model.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{model.modelId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{model.contextWindow?.toLocaleString() || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {[
                          model.allowImages && '이미지',
                          model.allowVideos && '비디오',
                          model.allowFiles && '파일'
                        ].filter(Boolean).join(', ') || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {model.inputPrice ? `입력: $${model.inputPrice}/1K` : ''}
                        {model.inputPrice && model.outputPrice ? ', ' : ''}
                        {model.outputPrice ? `출력: $${model.outputPrice}/1K` : ''}
                        {!model.inputPrice && !model.outputPrice && '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          model.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {model.active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => handleEditModel(model)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteModel(model.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          // 제공업체별로 그룹화된 모든 모델 표시
          Object.values(groupedModels).map(({ provider, models }) => (
            <div key={provider.id} className="mb-8">
              <div className="flex items-center mb-2">
                <h2 className="text-xl font-semibold">{provider.name}</h2>
                <button
                  className="ml-2 p-1 text-gray-600 hover:text-blue-600"
                  onClick={() => handleRefreshModels(provider.id)}
                  title={`${provider.name} 모델 새로고침`}
                >
                  <FiRefreshCw size={16} />
                </button>
              </div>
              
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">모델 ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">컨텍스트 창</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기능</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {models.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      models.map(model => (
                        <tr key={model.id}>
                          <td className="px-6 py-4 whitespace-nowrap">{model.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{model.modelId}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{model.contextWindow?.toLocaleString() || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {[
                              model.allowImages && '이미지',
                              model.allowVideos && '비디오',
                              model.allowFiles && '파일'
                            ].filter(Boolean).join(', ') || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {model.inputPrice ? `입력: $${model.inputPrice}/1K` : ''}
                            {model.inputPrice && model.outputPrice ? ', ' : ''}
                            {model.outputPrice ? `출력: $${model.outputPrice}/1K` : ''}
                            {!model.inputPrice && !model.outputPrice && '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              model.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {model.active ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              onClick={() => handleEditModel(model)}
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteModel(model.id)}
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        {/* 모델 생성/수정 모달 */}
        {isModalOpen && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {isCreating ? '새 모델 추가' : '모델 정보 수정'}
                      </h3>
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="mb-4">
                              <label htmlFor="providerId" className="block text-sm font-medium text-gray-700">제공업체</label>
                              <select
                                id="providerId"
                                name="providerId"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={modelForm.providerId}
                                onChange={handleFormChange}
                                required
                              >
                                {providers.map(provider => (
                                  <option key={provider.id} value={provider.id}>
                                    {provider.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <div className="mb-4">
                              <label htmlFor="name" className="block text-sm font-medium text-gray-700">모델 이름</label>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={modelForm.name}
                                onChange={handleFormChange}
                                placeholder="모델 이름"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <div className="mb-4">
                              <label htmlFor="modelId" className="block text-sm font-medium text-gray-700">모델 ID</label>
                              <input
                                type="text"
                                id="modelId"
                                name="modelId"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={modelForm.modelId}
                                onChange={handleFormChange}
                                placeholder="모델 ID"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <div className="mb-4">
                              <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">최대 토큰 수</label>
                              <input
                                type="number"
                                id="maxTokens"
                                name="maxTokens"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={modelForm.maxTokens || ''}
                                onChange={handleFormChange}
                                placeholder="최대 토큰 수"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="mb-4">
                              <label htmlFor="contextWindow" className="block text-sm font-medium text-gray-700">컨텍스트 윈도우 크기</label>
                              <input
                                type="number"
                                id="contextWindow"
                                name="contextWindow"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={modelForm.contextWindow || ''}
                                onChange={handleFormChange}
                                placeholder="컨텍스트 윈도우 크기"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="mb-4">
                              <label htmlFor="inputPrice" className="block text-sm font-medium text-gray-700">입력 토큰 가격</label>
                              <input
                                type="number"
                                step="0.000001"
                                id="inputPrice"
                                name="inputPrice"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={modelForm.inputPrice || ''}
                                onChange={handleFormChange}
                                placeholder="입력 토큰당 가격"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="mb-4">
                              <label htmlFor="outputPrice" className="block text-sm font-medium text-gray-700">출력 토큰 가격</label>
                              <input
                                type="number"
                                step="0.000001"
                                id="outputPrice"
                                name="outputPrice"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={modelForm.outputPrice || ''}
                                onChange={handleFormChange}
                                placeholder="출력 토큰당 가격"
                              />
                            </div>
                          </div>

                          <div className="col-span-1 md:col-span-2">
                            <div className="mb-2 mt-2">
                              <span className="block text-sm font-medium text-gray-700">기능 지원</span>
                            </div>
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="allowImages"
                                  name="allowImages"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={modelForm.allowImages}
                                  onChange={handleCheckboxChange}
                                />
                                <label htmlFor="allowImages" className="text-sm text-gray-700">
                                  이미지 지원
                                </label>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="allowVideos"
                                  name="allowVideos"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={modelForm.allowVideos}
                                  onChange={handleCheckboxChange}
                                />
                                <label htmlFor="allowVideos" className="text-sm text-gray-700">
                                  비디오 지원
                                </label>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="allowFiles"
                                  name="allowFiles"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={modelForm.allowFiles}
                                  onChange={handleCheckboxChange}
                                />
                                <label htmlFor="allowFiles" className="text-sm text-gray-700">
                                  파일 지원
                                </label>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="active"
                                  name="active"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={modelForm.active}
                                  onChange={handleCheckboxChange}
                                />
                                <label htmlFor="active" className="text-sm text-gray-700">
                                  활성화
                                </label>
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
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleSaveModel}
                  >
                    {isCreating ? '생성' : '저장'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ModelsAdmin; 