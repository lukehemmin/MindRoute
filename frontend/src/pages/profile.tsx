import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import useAuthStore from '../utils/authStore';
import { api } from '../utils/api';
import { FiUser, FiMail, FiCalendar, FiSave, FiAlertTriangle } from 'react-icons/fi';

const Profile: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [name, setName] = useState<string>('');
  
  useEffect(() => {
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // 현재 사용자 정보 로드
    if (user) {
      setName(user.name);
    }
  }, [isAuthenticated, router, user]);

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
      
      // 실제 구현에서는 API 호출을 통해 프로필을 업데이트합니다
      // const response = await api.put('/users/profile', { name });
      
      // 임시 처리 (실제 API 연동 전 테스트용)
      setTimeout(() => {
        // 로컬 상태 업데이트
        useAuthStore.setState({
          user: user ? { ...user, name } : null
        });
        
        setSuccess('프로필이 성공적으로 업데이트되었습니다.');
        setSaving(false);
      }, 700);
      
    } catch (err) {
      console.error('프로필 업데이트 오류:', err);
      setError('프로필 업데이트 중 오류가 발생했습니다.');
      setSaving(false);
    }
  };

  // 가입일 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto">
        <div className="pb-5 mb-6 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">프로필 설정</h1>
          <p className="mt-1 text-sm text-gray-500">
            개인 정보 및 계정 설정을 관리합니다.
          </p>
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
      </div>
    </Layout>
  );
};

export default Profile; 