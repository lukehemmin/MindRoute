import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../utils/authStore';
import { FiSave, FiRefreshCw, FiShare2 } from 'react-icons/fi';

// API 호출을 위한 인터페이스
interface SystemSettings {
  smtpServer: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  apiRateLimit: number;
  logRetentionDays: number;
  allowedOrigins: string;
  webhookUrl: string;
}

const SettingsAdmin: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [testingEmail, setTestingEmail] = useState<boolean>(false);
  
  // 설정 상태
  const [settings, setSettings] = useState<SystemSettings>({
    smtpServer: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
    apiRateLimit: 100,
    logRetentionDays: 30,
    allowedOrigins: '*',
    webhookUrl: '',
  });

  useEffect(() => {
    // 인증되지 않은 사용자 리다이렉트
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // 관리자가 아닌 사용자 리다이렉트
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    // 설정 데이터 로드
    loadSettings();
  }, [isAuthenticated, isAdmin, router]);
  
  // 설정 데이터 로드
  const loadSettings = async () => {
    setLoading(true);
    try {
      // 실제 API 호출 대신 더미 데이터 사용
      // const response = await api.get('/api/admin/settings');
      // setSettings(response.data);
      
      // 실제 구현 시 아래 주석 해제
      /*
      const response = await api.get('/api/admin/settings');
      if (response.data) {
        setSettings(response.data);
      }
      */
      
      // 더미 데이터 (실제 API 연동 시 제거)
      setTimeout(() => {
        setSettings({
          smtpServer: 'smtp.example.com',
          smtpPort: '587',
          smtpUser: 'user@example.com',
          smtpPassword: '********',
          smtpFrom: 'noreply@mindroute.com',
          apiRateLimit: 100,
          logRetentionDays: 30,
          allowedOrigins: 'https://example.com,http://localhost:3000',
          webhookUrl: 'https://webhook.example.com/notifications',
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('설정 로드 오류:', error);
      setError('설정을 로드하는데 실패했습니다.');
      setLoading(false);
    }
  };
  
  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 숫자 필드 처리
    if (name === 'apiRateLimit' || name === 'logRetentionDays') {
      // 숫자만 허용하고 음수는 방지
      const numValue = Math.max(0, parseInt(value) || 0);
      setSettings(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // 설정 저장 핸들러
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSuccess('');
    setError('');
    setLoading(true);
    
    try {
      // 실제 API 호출 (실제 구현 시 주석 해제)
      /*
      const response = await api.put('/api/admin/settings', settings);
      if (response.data.success) {
        setSuccess('시스템 설정이 성공적으로 저장되었습니다.');
      } else {
        setError(response.data.message || '설정 저장에 실패했습니다.');
      }
      */
      
      // 더미 응답 (실제 구현 시 제거)
      setTimeout(() => {
        setSuccess('시스템 설정이 성공적으로 저장되었습니다.');
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('설정 저장 오류:', error);
      setError('설정을 저장하는데 실패했습니다.');
      setLoading(false);
    }
  };
  
  // 이메일 설정 테스트
  const handleTestEmail = async () => {
    setSuccess('');
    setError('');
    setTestingEmail(true);
    
    try {
      // 실제 API 호출 (실제 구현 시 주석 해제)
      /*
      const response = await api.post('/api/admin/settings/test-email', {
        smtpServer: settings.smtpServer,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPassword: settings.smtpPassword,
        smtpFrom: settings.smtpFrom
      });
      
      if (response.data.success) {
        setSuccess('테스트 이메일이 성공적으로 전송되었습니다.');
      } else {
        setError(response.data.message || '이메일 설정 테스트에 실패했습니다.');
      }
      */
      
      // 더미 응답 (실제 구현 시 제거)
      setTimeout(() => {
        setSuccess('테스트 이메일이 성공적으로 전송되었습니다.');
        setTestingEmail(false);
      }, 1500);
    } catch (error) {
      console.error('이메일 테스트 오류:', error);
      setError('이메일 설정 테스트에 실패했습니다.');
      setTestingEmail(false);
    }
  };

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">시스템 설정</h1>
          <p className="mt-1 text-sm text-gray-500">
            시스템 전반적인 설정을 관리합니다.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded" role="alert">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
              {error}
            </div>
          )}
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSaveSettings}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* SMTP 설정 섹션 */}
                  <div className="sm:col-span-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">이메일 (SMTP) 설정</h3>
                    <p className="mt-1 text-sm text-gray-500">이메일 알림 및 비밀번호 재설정에 사용됩니다.</p>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="smtpServer" className="block text-sm font-medium text-gray-700">
                      SMTP 서버
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="smtpServer"
                        id="smtpServer"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.smtpServer}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700">
                      SMTP 포트
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="smtpPort"
                        id="smtpPort"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.smtpPort}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700">
                      SMTP 사용자명
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="smtpUser"
                        id="smtpUser"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.smtpUser}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700">
                      SMTP 비밀번호
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        name="smtpPassword"
                        id="smtpPassword"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.smtpPassword}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="smtpFrom" className="block text-sm font-medium text-gray-700">
                      발신자 이메일
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="smtpFrom"
                        id="smtpFrom"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.smtpFrom}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-white">.</label>
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={testingEmail || !settings.smtpServer || !settings.smtpPort || !settings.smtpFrom}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:bg-gray-400"
                      >
                        {testingEmail ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            이메일 테스트 중...
                          </>
                        ) : (
                          <>
                            <FiShare2 className="-ml-1 mr-2 h-5 w-5" />
                            이메일 설정 테스트
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* API 설정 섹션 */}
                  <div className="sm:col-span-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mt-8">API 설정</h3>
                    <p className="mt-1 text-sm text-gray-500">API 요청 제한 및 기타 설정을 관리합니다.</p>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="apiRateLimit" className="block text-sm font-medium text-gray-700">
                      API 요청 제한 (시간당)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="apiRateLimit"
                        id="apiRateLimit"
                        min="0"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.apiRateLimit}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="logRetentionDays" className="block text-sm font-medium text-gray-700">
                      로그 보존 기간 (일)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="logRetentionDays"
                        id="logRetentionDays"
                        min="1"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.logRetentionDays}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="allowedOrigins" className="block text-sm font-medium text-gray-700">
                      허용된 오리진 (CORS)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="allowedOrigins"
                        id="allowedOrigins"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.allowedOrigins}
                        onChange={handleInputChange}
                        placeholder="쉼표로 구분된 URL (예: https://example.com,http://localhost:3000)"
                      />
                      <p className="mt-1 text-xs text-gray-500">쉼표로 구분된 URL을 입력하세요. 모든 오리진을 허용하려면 '*'를 사용하세요.</p>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
                      웹훅 URL
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="webhookUrl"
                        id="webhookUrl"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.webhookUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/webhook"
                      />
                      <p className="mt-1 text-xs text-gray-500">중요한 이벤트가 발생할 때 알림을 받을 웹훅 URL입니다.</p>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={loadSettings}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <FiRefreshCw className="-ml-1 mr-2 h-5 w-5" />
                        설정 새로고침
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            저장 중...
                          </>
                        ) : (
                          <>
                            <FiSave className="-ml-1 mr-2 h-5 w-5" />
                            설정 저장
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsAdmin; 