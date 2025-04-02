import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../utils/authStore';
import { getAllUsers, updateUser } from '../../services/admin';
import { User, PaginationResponse } from '../../services/admin';

const UsersAdmin: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // 인증되지 않았거나 관리자가 아닌 경우 접근 거부
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!useAuthStore.getState().isAdmin()) {
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [isAuthenticated, router, currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers(currentPage, 10, searchTerm);
      
      if (response.success) {
        setUsers(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError('사용자 목록을 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 목록 조회 오류:', err);
      setError('사용자 목록을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      const response = await updateUser(editingUser.id, {
        name: editingUser.name,
        role: editingUser.role,
        isActive: editingUser.isActive
      });
      
      if (response.success) {
        // 목록 업데이트
        setUsers(users.map(user => user.id === editingUser.id ? response.data : user));
        setIsModalOpen(false);
        setEditingUser(null);
      } else {
        setError('사용자 정보 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 수정 오류:', err);
      setError('사용자 정보를 수정하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      setLoading(true);
      const response = await updateUser(userId, { isActive });
      
      if (response.success) {
        // 목록 업데이트
        setUsers(users.map(user => user.id === userId ? { ...user, isActive } : user));
      } else {
        setError('사용자 상태 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('사용자 상태 변경 오류:', err);
      setError('사용자 상태를 변경하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            이전
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            다음
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{currentPage}</span> 페이지 / 총 <span className="font-medium">{totalPages}</span> 페이지
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">이전</span>
                &lt;
              </button>
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === index + 1
                      ? 'bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">다음</span>
                &gt;
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">사용자 관리</h1>
              <p className="mt-1 text-sm text-gray-500">시스템에 등록된 사용자를 관리합니다.</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              대시보드로 돌아가기
            </button>
          </div>
          
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {/* 검색 폼 */}
          <div className="mt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="사용자 이름 또는 이메일로 검색"
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                검색
              </button>
            </form>
          </div>
          
          {/* 사용자 목록 테이블 */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? '관리자' : '사용자'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleStatusChange(user.id, !user.isActive)}
                            className={user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                          >
                            {user.isActive ? '비활성화' : '활성화'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                검색 결과가 없습니다.
              </div>
            )}
            
            {users.length > 0 && renderPagination()}
          </div>
        </div>
      </div>
      
      {/* 사용자 편집 모달 */}
      {isModalOpen && editingUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">사용자 편집</h3>
                    <div className="mt-2">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
                          <input
                            type="text"
                            id="name"
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
                          <input
                            type="email"
                            id="email"
                            value={editingUser.email}
                            disabled
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-100"
                          />
                        </div>
                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">역할</label>
                          <select
                            id="role"
                            value={editingUser.role}
                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          >
                            <option value="user">사용자</option>
                            <option value="admin">관리자</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">상태</label>
                          <div className="mt-2">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                checked={editingUser.isActive === true}
                                onChange={() => setEditingUser({ ...editingUser, isActive: true })}
                                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">활성</span>
                            </label>
                            <label className="inline-flex items-center ml-6">
                              <input
                                type="radio"
                                checked={editingUser.isActive === false}
                                onChange={() => setEditingUser({ ...editingUser, isActive: false })}
                                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">비활성</span>
                            </label>
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
                  onClick={handleSaveUser}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

export default UsersAdmin; 