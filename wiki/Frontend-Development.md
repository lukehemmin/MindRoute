# 프론트엔드 개발 가이드

이 페이지에서는 MindRoute 프로젝트의 프론트엔드 개발 가이드를 제공합니다.

## 기술 스택

MindRoute 프론트엔드는 다음 기술로 구성되어 있습니다:

- **React**: UI 라이브러리
- **Next.js**: React 프레임워크
- **TypeScript**: 정적 타입 시스템
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **React Query**: 서버 상태 관리
- **React Context API**: 클라이언트 상태 관리
- **Axios**: HTTP 클라이언트
- **React Hook Form**: 폼 관리
- **Zod**: 유효성 검사

## 프로젝트 구조

```
frontend/
├── public/                  # 정적 파일
│   ├── assets/              # 이미지, 아이콘, 폰트 등
│   └── favicon.ico          # 파비콘
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── common/          # 공통 UI 컴포넌트
│   │   ├── auth/            # 인증 관련 컴포넌트
│   │   ├── dashboard/       # 대시보드 컴포넌트
│   │   ├── admin/           # 관리자 페이지 컴포넌트
│   │   ├── playground/      # AI Playground 컴포넌트
│   │   └── layout/          # 레이아웃 컴포넌트
│   ├── context/             # React Context
│   │   ├── AuthContext.tsx  # 인증 컨텍스트
│   │   └── ThemeContext.tsx # 테마 컨텍스트
│   ├── hooks/               # 커스텀 훅
│   │   ├── useAuth.ts       # 인증 관련 훅
│   │   ├── useToast.ts      # 토스트 알림 훅
│   │   └── useQuery.ts      # API 요청 훅
│   ├── pages/               # Next.js 페이지
│   │   ├── _app.tsx         # 애플리케이션 진입점
│   │   ├── index.tsx        # 홈페이지
│   │   ├── auth/            # 인증 페이지 (로그인, 회원가입 등)
│   │   ├── dashboard/       # 대시보드 페이지
│   │   ├── admin/           # 관리자 페이지
│   │   └── playground/      # Playground 페이지
│   ├── services/            # API 서비스
│   │   ├── api.ts           # 기본 API 설정
│   │   ├── authService.ts   # 인증 API
│   │   └── aiService.ts     # AI 제공업체 API
│   ├── styles/              # 스타일시트
│   │   ├── globals.css      # 전역 스타일
│   │   └── tailwind.css     # Tailwind CSS 설정
│   ├── types/               # TypeScript 타입 정의
│   │   ├── auth.ts          # 인증 관련 타입
│   │   ├── user.ts          # 사용자 관련 타입
│   │   └── provider.ts      # 제공업체 관련 타입
│   └── utils/               # 유틸리티 함수
│       ├── formatters.ts    # 날짜, 숫자 포맷팅
│       ├── validators.ts    # 유효성 검사
│       └── storage.ts       # 로컬 스토리지 관리
├── .env.example             # 환경 변수 예제
├── next.config.js           # Next.js 설정
├── tailwind.config.js       # Tailwind CSS 설정
├── tsconfig.json            # TypeScript 설정
└── package.json             # 의존성 및 스크립트
```

## 컴포넌트 개발 가이드

### 컴포넌트 생성 규칙

1. **기능별 구성**: 컴포넌트는 기능별로 분류하여 organization하세요.
2. **단일 책임 원칙**: 각 컴포넌트는 하나의 책임만 가지도록 합니다.
3. **재사용성**: 공통 컴포넌트는 최대한 재사용 가능하게 설계하세요.
4. **타입 안전성**: Props와 State에 명확한 타입을 지정하세요.

### 코드 예시

```tsx
// src/components/common/Button.tsx
import React from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };
  
  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  const disabledStyles = (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        widthStyles,
        disabledStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
```

## 상태 관리

### Context API 사용

Context API는 전역 상태 관리를 위해 사용됩니다.

```tsx
// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/user';
import { AuthService } from '@/services/authService';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 토큰 유효성 검사 및 사용자 정보 로드
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          await refreshToken();
          const userInfo = await AuthService.getProfile();
          setUser(userInfo);
        }
      } catch (error) {
        // 토큰이 유효하지 않으면 로그아웃
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await AuthService.login(email, password);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      const userInfo = await AuthService.getProfile();
      setUser(userInfo);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      router.push('/auth/login');
    }
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await AuthService.refreshToken(refreshToken);
      localStorage.setItem('accessToken', response.accessToken);
      return response.accessToken;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      await AuthService.register(userData);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## API 통신

### Axios 인스턴스

```tsx
// src/services/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 토큰 만료 오류 및 재시도 안된 요청일 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // AuthContext의 refreshToken 함수 호출 (window 객체에 함수 노출 필요)
        if (window.refreshAuthToken) {
          const newToken = await window.refreshAuthToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그인 페이지로 이동
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 서비스 구현

```tsx
// src/services/aiService.ts
import api from './api';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface CompletionRequest {
  model: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
}

const AiService = {
  getProviders: async () => {
    const response = await api.get('/ai/providers');
    return response.data.data;
  },
  
  getModels: async (providerId: string) => {
    const response = await api.get(`/ai/providers/${providerId}/models`);
    return response.data.data;
  },
  
  chatCompletion: async (providerId: string, request: ChatRequest) => {
    const response = await api.post(`/ai/providers/${providerId}/chat`, request);
    return response.data.data;
  },
  
  textCompletion: async (providerId: string, request: CompletionRequest) => {
    const response = await api.post(`/ai/providers/${providerId}/completion`, request);
    return response.data.data;
  },
  
  // 이미지/파일이 포함된 요청
  chatWithMedia: async (providerId: string, formData: FormData) => {
    const response = await api.post(`/ai/providers/${providerId}/chat-with-media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  }
};

export default AiService;
```

## 폼 관리 및 유효성 검사

### React Hook Form + Zod

```tsx
// src/components/auth/LoginForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const loginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch (error: any) {
      setError('root', {
        type: 'manual',
        message: error.response?.data?.message || '로그인에 실패했습니다',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          label="이메일"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>
      
      <div>
        <Input
          label="비밀번호"
          type="password"
          {...register('password')}
          error={errors.password?.message}
        />
      </div>
      
      {errors.root && (
        <div className="text-red-500 text-sm">{errors.root.message}</div>
      )}
      
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
      >
        로그인
      </Button>
    </form>
  );
};

export default LoginForm;
```

## 라우팅 및 접근 제어

### 인증 상태에 따른 접근 제어

```tsx
// src/components/layout/ProtectedRoute.tsx
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // 로딩 중인 경우
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    router.push(`/auth/login?returnUrl=${router.asPath}`);
    return null;
  }

  // 관리자 전용 페이지이지만 일반 사용자인 경우
  if (adminOnly && user?.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

### 페이지에서 사용

```tsx
// src/pages/admin/index.tsx
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AdminDashboard from '@/components/admin/AdminDashboard';
import DashboardLayout from '@/components/layout/DashboardLayout';

const AdminPage = () => {
  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <AdminDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default AdminPage;
```

## 테스트

### 컴포넌트 테스트 예시

```tsx
// src/components/common/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders loading state', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    // SVG 로딩 아이콘이 렌더링되었는지 확인
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  test('renders different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toHaveClass('bg-blue-600');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-600');
  });
});
```

## 성능 최적화

### 메모이제이션

컴포넌트 재렌더링을 최소화하기 위해 React.memo, useMemo, useCallback을 적절히 사용합니다.

```tsx
import React, { useMemo, useCallback } from 'react';

interface DataListProps {
  items: Item[];
  onItemClick: (id: string) => void;
}

const DataList: React.FC<DataListProps> = React.memo(({ items, onItemClick }) => {
  // 데이터 가공 로직이 복잡한 경우 useMemo로 최적화
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      displayName: `${item.name} (${item.id})`
    }));
  }, [items]);
  
  // 이벤트 핸들러 메모이제이션
  const handleItemClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);
  
  return (
    <ul>
      {processedItems.map(item => (
        <li 
          key={item.id} 
          onClick={() => handleItemClick(item.id)}
        >
          {item.displayName}
        </li>
      ))}
    </ul>
  );
});

export default DataList;
```

### 이미지 최적화

Next.js의 Image 컴포넌트를 사용하여 이미지를 최적화합니다.

```tsx
import Image from 'next/image';

const ProfileCard = ({ user }) => {
  return (
    <div className="flex items-center">
      <div className="relative w-12 h-12 rounded-full overflow-hidden">
        <Image
          src={user.avatarUrl || '/assets/default-avatar.png'}
          alt={`${user.name}의 프로필 사진`}
          layout="fill"
          objectFit="cover"
          priority={false}
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE..."
        />
      </div>
      <div className="ml-4">
        <h3 className="font-medium">{user.name}</h3>
        <p className="text-gray-500">{user.email}</p>
      </div>
    </div>
  );
};
```

## 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://reactjs.org/docs)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [React Query 공식 문서](https://tanstack.com/query/latest)
- [React Hook Form 공식 문서](https://react-hook-form.com/)
- [Zod 공식 문서](https://zod.dev/)
- [Next.js + TypeScript 예제](https://github.com/vercel/next.js/tree/canary/examples/with-typescript) 