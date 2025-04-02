import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../utils/authStore';
import { Ticket } from '../../services/admin';

const TicketsAdmin: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 더미 데이터 (실제로는 API에서 가져와야 함)
  const dummyTickets: Ticket[] = [
    {
      id: '1',
      userId: 'user1',
      subject: '로그인 문제가 있습니다',
      message: '로그인을 시도하는데 계속 실패합니다. 어떻게 해결할 수 있을까요?',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: 'user1',
        name: '홍길동',
        email: 'hong@example.com',
        role: 'user',
        createdAt: new Date().toISOString()
      }
    },
    {
      id: '2',
      userId: 'user2',
      subject: 'API 호출 오류',
      message: 'OpenAI 모델을 호출할 때 계속 오류가 발생합니다. 로그를 확인해주세요.',
      status: 'in_progress',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
      updatedAt: new Date(Date.now() - 43200000).toISOString(), // 12시간 전
      adminResponse: '문제 확인 중입니다. 조금만 기다려주세요.',
      user: {
        id: 'user2',
        name: '김철수',
        email: 'kim@example.com',
        role: 'user',
        createdAt: new Date(Date.now() - 2592000000).toISOString() // 30일 전
      }
    },
    {
      id: '3',
      userId: 'user3',
      subject: '결제 관련 문의',
      message: '구독 해지를 하고 싶은데 방법을 모르겠습니다.',
      status: 'closed',
      createdAt: new Date(Date.now() - 604800000).toISOString(), // 7일 전
      updatedAt: new Date(Date.now() - 518400000).toISOString(), // 6일 전
      adminResponse: '구독 해지는 계정 설정 > 구독 관리에서 가능합니다. 추가 문의 사항이 있으시면 알려주세요.',
      user: {
        id: 'user3',
        name: '이영희',
        email: 'lee@example.com',
        role: 'user',
        createdAt: new Date(Date.now() - 7776000000).toISOString() // 90일 전
      }
    }
  ];

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

    // 더미 데이터로 설정 (실제로는 API 호출 필요)
    setLoading(true);
    setTimeout(() => {
      setTickets(dummyTickets);
      setLoading(false);
    }, 500);
  }, [isAuthenticated, router]);

  const handleOpenTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResponse(ticket.adminResponse || '');
    setIsModalOpen(true);
  };

  const handleStatusChange = (ticketId: string, newStatus: 'open' | 'in_progress' | 'closed') => {
    // 실제로는 API 호출 필요
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() }
        : ticket
    ));
  };

  const handleResponseSubmit = () => {
    if (!selectedTicket) return;
    
    // 실제로는 API 호출 필요
    setTickets(tickets.map(ticket => 
      ticket.id === selectedTicket.id 
        ? { 
            ...ticket, 
            adminResponse: response, 
            status: 'in_progress', 
            updatedAt: new Date().toISOString() 
          }
        : ticket
    ));
    
    setIsModalOpen(false);
    setSelectedTicket(null);
    setResponse('');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return '미처리';
      case 'in_progress':
        return '처리중';
      case 'closed':
        return '완료';
      default:
        return status;
    }
  };

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">문의 관리</h1>
              <p className="mt-1 text-sm text-gray-500">사용자 문의를 확인하고 응답합니다.</p>
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
          
          {/* 문의 목록 */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : tickets.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <li key={ticket.id} className="hover:bg-gray-50">
                    <div 
                      className="px-4 py-4 sm:px-6 cursor-pointer"
                      onClick={() => handleOpenTicket(ticket)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="sm:flex sm:items-center">
                          <p className="text-sm font-medium text-primary-600 truncate">{ticket.subject}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(ticket.status)}`}>
                              {getStatusText(ticket.status)}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex items-center text-sm text-gray-500">
                          <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {ticket.user?.name || ticket.userId}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              {ticket.user?.email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700 line-clamp-2">
                          {ticket.message}
                        </div>
                        {ticket.adminResponse && (
                          <div className="mt-2 text-sm text-gray-500 italic line-clamp-1">
                            응답: {ticket.adminResponse}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-12 text-center text-gray-500">
                문의 내역이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 문의 상세 모달 */}
      {isModalOpen && selectedTicket && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedTicket.subject}
                      </h3>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedTicket.status)}`}>
                        {getStatusText(selectedTicket.status)}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{selectedTicket.user?.name || selectedTicket.userId} ({selectedTicket.user?.email})</p>
                      <p>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">{selectedTicket.message}</p>
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="response" className="block text-sm font-medium text-gray-700">
                        응답
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="response"
                          name="response"
                          rows={4}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        상태 변경
                      </label>
                      <div className="mt-1 flex space-x-3">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedTicket.id, 'open')}
                          className={`px-3 py-1 text-xs rounded-full ${
                            selectedTicket.status === 'open'
                              ? 'bg-blue-100 text-blue-800 font-semibold'
                              : 'bg-gray-100 text-gray-800 hover:bg-blue-50'
                          }`}
                        >
                          미처리
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedTicket.id, 'in_progress')}
                          className={`px-3 py-1 text-xs rounded-full ${
                            selectedTicket.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800 font-semibold'
                              : 'bg-gray-100 text-gray-800 hover:bg-yellow-50'
                          }`}
                        >
                          처리중
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedTicket.id, 'closed')}
                          className={`px-3 py-1 text-xs rounded-full ${
                            selectedTicket.status === 'closed'
                              ? 'bg-green-100 text-green-800 font-semibold'
                              : 'bg-gray-100 text-gray-800 hover:bg-green-50'
                          }`}
                        >
                          완료
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleResponseSubmit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  응답 저장
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TicketsAdmin; 