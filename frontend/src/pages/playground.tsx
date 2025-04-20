import React, { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import useAuthStore from '../utils/authStore';
import { 
  getProviders, 
  getModels, 
  sendTextRequest, 
  sendImageRequest, 
  sendFileRequest, 
  chatCompletion,
  Provider, 
  Model,
  Message
} from '../services/ai';
import { getApiKeys, ApiKey } from '../services/user';
import { FiUpload, FiImage, FiFile, FiX, FiSend, FiUser, FiServer, FiKey, FiChevronDown, FiChevronUp, FiSettings } from 'react-icons/fi';

// 메시지 콘텐츠 아이템 인터페이스 확장
interface MessageContentItem {
  type: string;
  text?: string;
  image_url?: string;
  file_url?: string;
}

const Playground: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loadingProviders, setLoadingProviders] = useState<boolean>(true);
  const [loadingApiKeys, setLoadingApiKeys] = useState<boolean>(false);
  
  // 시스템 프롬프트와 하이퍼파라미터 관련 상태
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number | null>(null);
  
  // 채팅 메시지 관련 상태
  const [messages, setMessages] = useState<Message[]>([]);
  
  // 이미지/파일 업로드 관련 상태
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [supportsImages, setSupportsImages] = useState<boolean>(false);
  const [supportsFiles, setSupportsFiles] = useState<boolean>(false);
  
  // 참조
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    fetchApiKeys();
  }, [isAuthenticated, router]);

  // API 키 목록 가져오기
  const fetchApiKeys = async () => {
    try {
      setLoadingApiKeys(true);
      const result = await getApiKeys();
      
      if (result.success) {
        setApiKeys(result.data);
        // 기본값으로 첫 번째 API 키 선택
        if (result.data.length > 0) {
          setSelectedApiKey(result.data[0].id);
        }
      } else {
        console.error('API 키 목록 조회 실패:', result.message);
      }
    } catch (err: any) {
      console.error('API 키 목록 조회 오류:', err);
    } finally {
      setLoadingApiKeys(false);
    }
  };

  // 새 메시지가 추가될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 제공업체 변경 시 모델 목록 가져오기
  const fetchModels = async (providerId: string) => {
    if (!providerId) return;
    
    try {
      setLoading(true);
      
      // 모델 목록 가져오기
      const result = await getModels(providerId);
      
      if (result.success) {
        setModels(result.data);
        if (result.data.length > 0) {
          const firstModel = result.data[0];
          setSelectedModel(firstModel.id);
          
          // 모델의 capabilities 배열에서 지원 기능 확인
          // 백엔드에서 모델 정보의 allowImages, allowVideos, allowFiles를 capabilities 배열로 변환하도록 해야 함
          // 임시로 모든 모델이 이미지와 파일을 지원한다고 가정
          setSupportsImages(true);
          setSupportsFiles(true);
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
    const modelId = e.target.value;
    setSelectedModel(modelId);
    
    // 선택된 모델이 바뀔 때 해당 모델의 capabilities 확인
    const selectedModelInfo = models.find(m => m.id === modelId);
    if (selectedModelInfo) {
      // 백엔드에서 capabilities를 확인하도록 수정되어야 함
      // 임시로 모든 모델이 이미지와 파일을 지원한다고 가정
      setSupportsImages(true);
      setSupportsFiles(true);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const keyId = e.target.value;
    setSelectedApiKey(keyId);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter는 줄바꿈을 허용하고, Enter만 누르면 폼 제출
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && selectedProvider && selectedModel && !loading) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
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

    // API 키 선택 검증 로직 강화
    if (apiKeys.length > 0) {
      if (!selectedApiKey) {
        setError('API 키를 선택해주세요. API 키 선택은 필수입니다.');
        return;
      }
    } else {
      setError('사용 가능한 API 키가 없습니다. API 키 관리에서 먼저 API 키를 생성해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 사용자 메시지 추가
      const newMessages = [...messages];
      
      // 시스템 프롬프트가 있는 경우, 첫 메시지로 추가
      const allMessages: Message[] = [];
      if (systemPrompt.trim()) {
        allMessages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      // 기존 메시지 추가
      allMessages.push(...newMessages);
      
      // 사용자 메시지 추가
      allMessages.push({
        role: 'user',
        content: prompt
      });
      
      // UI에 사용자 메시지 표시
      setMessages([...newMessages, {
        role: 'user',
        content: prompt
      }]);
      
      let result;
      
      // 이미지 업로드가 있는 경우
      if (uploadedImage) {
        result = await sendImageRequest(
          selectedProvider,
          selectedModel,
          prompt,
          uploadedImage,
          selectedApiKey
        );
      }
      // 파일 업로드가 있는 경우
      else if (uploadedFile) {
        result = await sendFileRequest(
          selectedProvider,
          selectedModel,
          prompt,
          uploadedFile,
          selectedApiKey
        );
      }
      // 일반 텍스트 요청인 경우
      else {
        result = await chatCompletion(
          selectedProvider, 
          {
            model: selectedModel,
            messages: allMessages,
            temperature: temperature,
            maxTokens: maxTokens || undefined,
            userApiKeyId: selectedApiKey
          }
        );
      }
      
      if (result.success && result.data) {
        // AI 응답 메시지 추가
        setMessages(prevMessages => [
          ...prevMessages, 
          {
            role: 'assistant',
            content: result.data.response.content
          }
        ]);
      } else {
        // 오류 메시지를 더 구체적으로 표시
        const errorMsg = (result as any).message || 'AI 요청을 처리하는데 실패했습니다.';
        setError(errorMsg);
      }
      
      // 입력 필드 및 업로드 초기화
      setPrompt('');
      resetUploads();
    } catch (err: any) {
      console.error('AI 요청 오류:', err);
      const errorMessage = err.message || 'AI 요청을 처리하는 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 채팅 메시지 렌더링 함수
  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    
    if (!message.content) {
      return null;
    }
    
    // 타임스탬프 생성 (실제로는 메시지 생성 시간을 저장하고 표시해야 함)
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // 콘텐츠 렌더링
    const renderContent = () => {
      if (typeof message.content === 'string') {
        // 문자열인 경우 텍스트로 표시
        return (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        );
      } else if (Array.isArray(message.content)) {
        // 배열인 경우 각 아이템을 표시
        return (
          <div className="flex flex-col gap-2">
            {message.content.map((item, i) => {
              if (item.type === 'text' && item.text) {
                return <div key={i} className="whitespace-pre-wrap break-words">{item.text}</div>;
              } else if (item.type === 'image_url' && item.image_url) {
                return (
                  <div key={i} className="mt-2">
                    <img 
                      src={item.image_url} 
                      alt="Attached" 
                      className="max-w-sm rounded-md"
                    />
                  </div>
                );
              } else if (item.type === 'file_url' && item.file_url) {
                return (
                  <div key={i} className="mt-2 p-2 border border-gray-200 rounded bg-gray-50 text-sm flex items-center">
                    <FiFile className="mr-2" /> 
                    <span>{item.file_url}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        );
      }
      return null;
    };
    
    return (
      <div 
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isUser ? 'bg-primary-100 text-primary-600' : 
              isAssistant ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {isUser ? (
                <FiUser />
              ) : (
                <FiServer />
              )}
            </div>
          </div>
          
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`px-4 py-3 rounded-lg ${
              isUser ? 
              'bg-primary-50 text-gray-900 border border-primary-100' : 
              'bg-white text-gray-900 border border-gray-200'
            }`}>
              {renderContent()}
            </div>
            <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {isUser ? '나' : 'AI'} · {timestamp}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col flex-1 w-full h-full">
        <div className="bg-white p-4 border-b flex-shrink-0">
          <div className="max-w-full mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">AI 플레이그라운드</h1>
            <p className="mt-1 text-sm text-gray-500">다양한 AI 모델을 테스트하고 비교해보세요.</p>
          </div>
        </div>
        
        {error && (
          <div className="mx-4 mt-2 mb-0 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex-shrink-0" role="alert">
            <div className="flex justify-between items-center">
              <span className="block sm:inline">{error}</span>
              {(error.includes('API 키') || error.includes('API키')) && (
                <a 
                  href="/api-keys" 
                  className="ml-4 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  API 키 관리
                </a>
              )}
            </div>
          </div>
        )}
        
        <div className="flex flex-1 min-h-0 w-full">
          <div className="flex flex-col md:flex-row w-full h-full">
            {/* 왼쪽 사이드바 - 모델 선택 */}
            <div className="w-full md:w-64 bg-gray-50 p-4 border-r border-gray-200 flex-shrink-0 md:h-full flex flex-col">
              <div className="mb-4">
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                  AI 제공업체
                </label>
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
              
              <div className="mb-4">
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  AI 모델
                </label>
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
              
              <div className="mb-4">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                  API 키
                </label>
                <select
                  id="apiKey"
                  name="apiKey"
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={selectedApiKey}
                  onChange={handleApiKeyChange}
                  disabled={loading || apiKeys.length === 0}
                >
                  <option value="">API 키 선택</option>
                  {apiKeys.map(key => (
                    <option key={key.id} value={key.id}>
                      {key.name}
                    </option>
                  ))}
                </select>
                {apiKeys.length === 0 && (
                  <div className="mt-2">
                    <a 
                      href="/api-keys" 
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      API 키 관리 페이지로 이동
                    </a>
                  </div>
                )}
              </div>
              
              {/* 시스템 프롬프트 입력 영역 */}
              <div className="mb-4">
                <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                  시스템 프롬프트
                </label>
                <textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  rows={3}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md resize-none"
                  placeholder="AI의 역할이나 지시사항을 입력하세요..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {/* 모델 추가 설정 (하이퍼파라미터) */}
              <div className="mb-4 border border-gray-200 rounded-md">
                <button
                  type="button"
                  className="flex justify-between items-center w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-t-md"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  <div className="flex items-center">
                    <FiSettings className="mr-2" size={16} />
                    <span>모델 추가 설정</span>
                  </div>
                  {showAdvancedSettings ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </button>
                
                {showAdvancedSettings && (
                  <div className="p-3 bg-white">
                    <div className="mb-3">
                      <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                        Temperature
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center flex-1">
                          <span className="text-xs text-gray-500 mr-2">0</span>
                          <input
                            type="range"
                            id="temperature"
                            name="temperature"
                            min="0"
                            max="2"
                            step="0.01"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={loading}
                          />
                          <span className="text-xs text-gray-500 ml-2">2</span>
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            value={temperature}
                            onChange={(e) => {
                              let value = parseFloat(e.target.value);
                              if (isNaN(value)) value = 0;
                              if (value < 0) value = 0;
                              if (value > 2) value = 2;
                              // 소수점 2자리까지만 저장
                              value = Math.round(value * 100) / 100;
                              setTemperature(value);
                            }}
                            onBlur={(e) => {
                              // 입력이 비어있을 경우 기본값 0으로 설정
                              if (e.target.value === '') {
                                setTemperature(0);
                              }
                            }}
                            min="0"
                            max="2"
                            step="0.01"
                            className="shadow-sm block w-full text-center px-2 py-1 text-sm border-gray-300 rounded-md"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        낮을수록 일관된 응답, 높을수록 다양한 응답이 생성됩니다.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 mb-1">
                        최대 토큰 수
                      </label>
                      <input
                        type="number"
                        id="maxTokens"
                        name="maxTokens"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="자동 (모델 기본값)"
                        value={maxTokens === null ? '' : maxTokens}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseInt(e.target.value);
                          setMaxTokens(value);
                        }}
                        min="1"
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        생성할 최대 토큰 수를 제한합니다. 비워두면 모델 기본값이 사용됩니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-4">
                <div className="text-sm text-gray-500">
                  <p className="mb-2">도움말:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>최적의 결과를 위해 올바른 제공업체와 모델을 선택하세요.</li>
                    <li>API 키가 필요합니다. 없으면 생성해주세요.</li>
                    <li>특수 기능(이미지, 파일)은 지원하는 모델에서만 사용 가능합니다.</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* 오른쪽 채팅 영역 */}
            <div className="flex-1 flex flex-col h-full bg-white">
              {/* 채팅 메시지 영역 */}
              <div 
                ref={chatContainerRef}
                className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-white"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto text-center">
                      <div className="mb-4 flex justify-center">
                        <FiServer className="h-12 w-12 text-primary-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">AI 모델과 대화해보세요</h3>
                      <p className="text-gray-500">왼쪽에서 AI 제공업체, 모델, API 키를 선택한 후, 아래 입력창에 메시지를 입력해주세요.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 px-2 pb-2">
                    {messages.map((message, index) => renderMessage(message, index))}
                  </div>
                )}
              </div>
              
              {/* 메시지 입력 영역 */}
              <div className="p-3 border-t shadow-md flex-shrink-0 bg-white">
                <form onSubmit={handleSubmit} className="flex flex-col">
                  <div className="relative">
                    <textarea
                      id="prompt"
                      name="prompt"
                      rows={1}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-lg resize-none py-2 px-3"
                      placeholder="AI에게 질문하거나 요청할 내용을 입력하세요... (Enter 키를 눌러 전송)"
                      value={prompt}
                      onChange={handlePromptChange}
                      onKeyDown={handleKeyDown}
                    />
                    
                    {/* 업로드된 이미지 프리뷰 */}
                    {imagePreview && (
                      <div className="mt-2 relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="h-16 w-auto rounded-md border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedImage(null);
                            setImagePreview(null);
                            if (imageInputRef.current) imageInputRef.current.value = '';
                          }}
                          className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 text-xs"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    )}
                    
                    {/* 업로드된 파일 표시 */}
                    {uploadedFile && (
                      <div className="mt-2 relative inline-block">
                        <div className="py-1 px-3 rounded-md bg-gray-100 border border-gray-300 flex items-center">
                          <FiFile size={14} className="mr-2" />
                          <span className="text-xs">{uploadedFile.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="ml-2 text-red-500"
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center mt-2">
                    <div className="flex space-x-2">
                      {supportsImages && (
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          disabled={loading}
                          title="이미지 업로드"
                        >
                          <FiImage className="h-4 w-4 mr-1" />
                          <span>이미지</span>
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={loading}
                          />
                        </button>
                      )}
                      
                      {supportsFiles && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          disabled={loading}
                          title="파일 업로드"
                        >
                          <FiFile className="h-4 w-4 mr-1" />
                          <span>파일</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={loading}
                          />
                        </button>
                      )}
                    </div>
                    
                    <div className="ml-auto">
                      <button
                        type="submit"
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          loading || !selectedProvider || !selectedModel
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                        }`}
                        disabled={loading || !selectedProvider || !selectedModel}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>처리 중...</span>
                          </>
                        ) : (
                          <>
                            <FiSend className="h-4 w-4 mr-1" />
                            <span>전송</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Playground; 