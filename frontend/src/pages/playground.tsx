import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import useAuthStore from '../utils/authStore';
import { 
  getProviders, 
  getModels, 
  sendTextRequest, 
  sendImageRequest, 
  sendFileRequest, 
  Provider, 
  Model 
} from '../services/ai';
import { FiUpload, FiImage, FiFile, FiX } from 'react-icons/fi';

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
  
  // 이미지/파일 업로드 관련 상태
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [supportsImages, setSupportsImages] = useState<boolean>(false);
  const [supportsFiles, setSupportsFiles] = useState<boolean>(false);
  
  // 참조
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setError(result.message || '제공업체 목록을 가져오는데 실패했습니다.');
          console.error('제공업체 목록 조회 실패:', result.message);
        }
      } catch (err: any) {
        console.error('제공업체 목록 조회 오류:', err);
        setError(err.message || '제공업체 목록을 가져오는 중 오류가 발생했습니다.');
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
      
      // 해당 제공업체 정보를 찾아서 이미지/파일 지원 여부 설정
      const provider = providers.find(p => p.id === providerId);
      setSupportsImages(provider?.allowImages || false);
      setSupportsFiles(provider?.allowFiles || false);
      
      // 모델 목록 가져오기
      const result = await getModels(providerId);
      
      if (result.success) {
        setModels(result.data);
        if (result.data.length > 0) {
          setSelectedModel(result.data[0].id);
        } else {
          setError('사용 가능한 모델이 없습니다. 다른 제공업체를 선택해주세요.');
        }
      } else {
        setError(result.message || '모델 목록을 가져오는데 실패했습니다.');
        console.error('모델 목록 조회 실패:', result.message);
      }
    } catch (err: any) {
      console.error('모델 목록 조회 오류:', err);
      setError(err.message || '모델 목록을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const providerId = e.target.value;
    setSelectedProvider(providerId);
    setSelectedModel('');
    setModels([]);
    
    // 제공업체 변경 시 업로드된 이미지/파일 초기화
    resetUploads();
    
    fetchModels(providerId);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImage(file);
      
      // 이미지 프리뷰 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const resetUploads = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setImagePreview(null);
    
    // 파일 입력 필드 초기화
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      let result;
      
      // 이미지 업로드가 있을 경우
      if (uploadedImage) {
        result = await sendImageRequest(selectedProvider, selectedModel, prompt, uploadedImage);
      }
      // 파일 업로드가 있을 경우
      else if (uploadedFile) {
        result = await sendFileRequest(selectedProvider, selectedModel, prompt, uploadedFile);
      }
      // 텍스트만 있을 경우
      else {
        result = await sendTextRequest(selectedProvider, selectedModel, prompt);
      }
      
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
                  
                  {/* 업로드 버튼 그룹 */}
                  {selectedProvider && (
                    <div className="sm:col-span-6">
                      <div className="flex flex-wrap gap-2">
                        {supportsImages && (
                          <div className="inline-block">
                            <input
                              type="file"
                              ref={imageInputRef}
                              id="image-upload"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                            <label
                              htmlFor="image-upload"
                              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                                uploadedImage 
                                  ? 'text-white bg-primary-600 hover:bg-primary-700' 
                                  : 'text-gray-700 bg-white hover:bg-gray-50'
                              } cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                            >
                              <FiImage className="-ml-1 mr-2 h-5 w-5" />
                              {uploadedImage ? '이미지 선택됨' : '이미지 업로드'}
                            </label>
                          </div>
                        )}
                        
                        {supportsFiles && (
                          <div className="inline-block">
                            <input
                              type="file"
                              ref={fileInputRef}
                              id="file-upload"
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                            <label
                              htmlFor="file-upload"
                              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                                uploadedFile 
                                  ? 'text-white bg-primary-600 hover:bg-primary-700' 
                                  : 'text-gray-700 bg-white hover:bg-gray-50'
                              } cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                            >
                              <FiFile className="-ml-1 mr-2 h-5 w-5" />
                              {uploadedFile ? '파일 선택됨' : '파일 업로드'}
                            </label>
                          </div>
                        )}
                        
                        {(uploadedImage || uploadedFile) && (
                          <button
                            type="button"
                            onClick={resetUploads}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <FiX className="-ml-1 mr-2 h-5 w-5" />
                            업로드 취소
                          </button>
                        )}
                      </div>
                      
                      {/* 업로드된 이미지 미리보기 */}
                      {imagePreview && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">이미지 미리보기:</p>
                          <img 
                            src={imagePreview} 
                            alt="Uploaded preview" 
                            className="max-h-40 rounded border border-gray-200"
                          />
                        </div>
                      )}
                      
                      {/* 업로드된 파일 정보 */}
                      {uploadedFile && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            파일: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
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
                      disabled={loading || !selectedProvider || !selectedModel || !prompt.trim()}
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