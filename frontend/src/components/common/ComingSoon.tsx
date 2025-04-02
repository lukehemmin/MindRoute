import React from 'react';
import { FiClock, FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface ComingSoonProps {
  title: string;
  description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title, description }) => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="bg-blue-100 rounded-full mx-auto p-3 w-16 h-16 flex items-center justify-center">
          <FiClock className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-gray-900">{title}</h2>
        <p className="mt-2 text-base text-gray-500">
          {description || '이 페이지는 현재 개발 중입니다. 조금만 기다려주세요!'}
        </p>
        <div className="mt-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiArrowLeft className="mr-2 -ml-1 h-4 w-4" />
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon; 