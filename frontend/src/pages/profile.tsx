import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import useAuthStore from '../utils/authStore';
import { api } from '../utils/api';
import { FiUser, FiMail, FiCalendar, FiSave, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

const Profile: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user, setAuth } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [name, setName] = useState<string>('');
  
  // 사용자 정보 로드 함수
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // 백엔드로부터 최신 사용자 정보 가져오기
      const response = await api.get('/api/auth/me');
      
      if (response.data.success) {
        const userData = response.data.data;
        
        // 로컬 상태 및 인증 스토어 업데이트
        setName(userData.name);
        
        // 현재 accessToken과 refreshToken 유지하면서 사용자 정보만 업데이트
        const currentState = useAuthStore.getState();
        useAuthStore.setState({
          ...currentState,
          user: userData
        });
        
        console.log('최신 사용자 정보 로드됨:', userData);
      } else {
        setError('사용자 정보를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 정보 로드 오류:', err);
      setError('사용자 정보를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // 로그인된 경우 최신 사용자 정보 로드
    loadUserProfile();
    
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // 프로필 업데이트 API 호출
      try {
        const response = await api.put('/api/users/profile', { name });
        
        if (response.data.success) {
          // 프로필 저장 후 최신 정보 다시 로드
          await loadUserProfile();
          setSuccess('프로필이 성공적으로 업데이트되었습니다.');
        } else {
          setError(response.data.message || '프로필 업데이트에 실패했습니다.');
        }
      } catch (apiError: any) {
        console.error('API 호출 오류:', apiError);
        if (apiError.response?.status === 401) {
          setError('인증 세션이 만료되었습니다. 다시 로그인해 주세요.');
        } else {
          setError(apiError.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다.');
        }
      }
      
    } catch (err) {
      console.error('프로필 업데이트 오류:', err);
      setError('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 가입일 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 최신 사용자 정보 수동 새로고침
  const handleRefreshUserInfo = () => {
    loadUserProfile();
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto">
        <div className="pb-5 mb-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">프로필 설정</h1>
            <p className="mt-1 text-sm text-gray-500">
              개인 정보 및 계정 설정을 관리합니다.
            </p>
          </div>
          <button 
            onClick={handleRefreshUserInfo}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiRefreshCw className="h-4 w-4 mr-1" />
            새로고침
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiSave className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <h2 className="text-lg font-medium text-gray-900">기본 정보</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      프로필 설정 및 기본 계정 정보를 관리합니다.
                    </p>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-semibold">
                          {user?.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-medium text-gray-900">{user?.name}</div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <div className="flex items-center h-full">
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                          가입일: {user?.createdAt ? formatDate(user.createdAt) : '로딩 중...'}
                        </div>
                        <div className="mt-1 flex items-center">
                          <FiUser className="mr-2 h-4 w-4 text-gray-400" />
                          권한: {user?.role === 'admin' ? '관리자' : '일반 사용자'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
              <form onSubmit={handleSubmit}>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <h2 className="text-lg font-medium text-gray-900">프로필 변경</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        프로필 정보를 수정합니다.
                      </p>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        이름
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          disabled={saving}
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        이메일
                      </label>
                      <div className="mt-1">
                        <div className="flex items-center">
                          <div className="flex-1 px-3 py-2 bg-gray-100 shadow-sm border border-gray-300 rounded-md text-gray-500 sm:text-sm">
                            {user?.email}
                          </div>
                          <div className="ml-3 text-xs text-gray-500">
                            (변경 불가)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '변경사항 저장'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Profile; 