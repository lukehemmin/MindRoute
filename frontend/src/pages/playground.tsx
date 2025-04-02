import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import useAuthStore from '../utils/authStore';
import { getProviders, getModels, sendTextRequest, Provider, Model } from '../services/ai';

const Playground: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loadingProviders, setLoadingProviders] = useState<boolean>(true);

  useEffect(() => {
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 제공업체 목록 가져오기
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true);
        const result = await getProviders();
        
        if (result.success) {
          setProviders(result.data);
          
          // URL에서 제공업체 ID를 가져와 설정
          const providerId = router.query.provider as string;
          if (providerId && result.data.some((p: Provider) => p.id === providerId)) {
            setSelectedProvider(providerId);
            fetchModels(providerId);
          }
        } else {
          setError('제공업체 목록을 가져오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('제공업체 목록 조회 오류:', err);
        setError('제공업체 목록을 가져오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, [isAuthenticated, router]);

  // 제공업체 변경 시 모델 목록 가져오기
  const fetchModels = async (providerId: string) => {
    if (!providerId) return;
    
    try {
      setLoading(true);
      const result = await getModels(providerId);
      
      if (result.success) {
        setModels(result.data);
        if (result.data.length > 0) {
          setSelectedModel(result.data[0].id);
        }
      } else {
        setError('모델 목록을 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('모델 목록 조회 오류:', err);
      setError('모델 목록을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const providerId = e.target.value;
    setSelectedProvider(providerId);
    setSelectedModel('');
    setModels([]);
    fetchModels(providerId);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProvider || !selectedModel || !prompt.trim()) {
      setError('제공업체, 모델, 프롬프트를 모두 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const result = await sendTextRequest(selectedProvider, selectedModel, prompt);
      
      if (result.success) {
        setResponse(result.data.response);
      } else {
        setError(result.message || 'AI 요청을 처리하는데 실패했습니다.');
      }
    } catch (err) {
      console.error('AI 요청 오류:', err);
      setError('AI 요청을 처리하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">AI 플레이그라운드</h1>
          <p className="mt-1 text-sm text-gray-500">다양한 AI 모델을 테스트하고 비교해보세요.</p>
        </div>
        
        <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                      AI 제공업체
                    </label>
                    <div className="mt-1">
                      <select
                        id="provider"
                        name="provider"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={selectedProvider}
                        onChange={handleProviderChange}
                        disabled={loadingProviders}
                      >
                        <option value="">AI 제공업체 선택</option>
                        {providers.map(provider => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                      AI 모델
                    </label>
                    <div className="mt-1">
                      <select
                        id="model"
                        name="model"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={selectedModel}
                        onChange={handleModelChange}
                        disabled={!selectedProvider || loading}
                      >
                        <option value="">AI 모델 선택</option>
                        {models.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                      프롬프트
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="prompt"
                        name="prompt"
                        rows={4}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="AI에게 질문하거나 요청할 내용을 입력하세요..."
                        value={prompt}
                        onChange={handlePromptChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <button
                      type="submit"
                      disabled={loading || !selectedProvider || !selectedModel}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          AI 응답 받는 중...
                        </span>
                      ) : (
                        '제출'
                      )}
                    </button>
                  </div>
                </div>
              </form>
              
              {response && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">AI 응답</h3>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">{response}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Playground; 