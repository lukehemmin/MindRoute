import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../utils/authStore';
import { updateProfile, updatePassword } from '../../services/auth';

const ProfileAdmin: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(false);
  
  // 프로필 상태
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  
  // 비밀번호 상태
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  // 알림 상태
  const [profileSuccess, setProfileSuccess] = useState<string>('');
  const [profileError, setProfileError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

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
    
    // 사용자 정보 로드
    if (user) {
      setEmail(user.email || '');
      setName(user.name || '');
    }
  }, [isAuthenticated, isAdmin, router, user]);
  
  // 프로필 업데이트 핸들러
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setProfileSuccess('');
    setProfileError('');
    setLoading(true);
    
    try {
      const result = await updateProfile({
        name
      });
      
      if (result.success) {
        setProfileSuccess('프로필이 성공적으로 업데이트 되었습니다.');
      } else {
        setProfileError(result.message || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      setProfileError('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 비밀번호 업데이트 핸들러
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    
    setPasswordSuccess('');
    setPasswordError('');
    setLoading(true);
    
    try {
      const result = await updatePassword({
        currentPassword,
        newPassword
      });
      
      if (result.success) {
        setPasswordSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(result.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      setPasswordError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">계정 설정</h1>
          <p className="mt-1 text-sm text-gray-500">
            개인 프로필 및 보안 설정을 관리합니다.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
          {/* 프로필 정보 섹션 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">프로필 정보</h3>
              <div className="mt-5">
                {profileSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded" role="alert">
                    {profileSuccess}
                  </div>
                )}
                
                {profileError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
                    {profileError}
                  </div>
                )}
                
                <form onSubmit={handleProfileUpdate}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        이메일
                      </label>
                      <div className="mt-1">
                        <input
                          id="email"
                          type="email"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-100"
                          value={email}
                          disabled
                        />
                        <p className="mt-1 text-xs text-gray-500">이메일 주소는 변경할 수 없습니다.</p>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        이름
                      </label>
                      <div className="mt-1">
                        <input
                          id="name"
                          type="text"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {loading ? '업데이트 중...' : '프로필 업데이트'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          {/* 비밀번호 변경 섹션 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">비밀번호 변경</h3>
              <div className="mt-5">
                {passwordSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded" role="alert">
                    {passwordSuccess}
                  </div>
                )}
                
                {passwordError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
                    {passwordError}
                  </div>
                )}
                
                <form onSubmit={handlePasswordUpdate}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                        현재 비밀번호
                      </label>
                      <div className="mt-1">
                        <input
                          id="current-password"
                          type="password"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                        새 비밀번호
                      </label>
                      <div className="mt-1">
                        <input
                          id="new-password"
                          type="password"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">비밀번호는 최소 8자 이상이어야 합니다.</p>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                        새 비밀번호 확인
                      </label>
                      <div className="mt-1">
                        <input
                          id="confirm-password"
                          type="password"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {loading ? '변경 중...' : '비밀번호 변경'}
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

export default ProfileAdmin; 