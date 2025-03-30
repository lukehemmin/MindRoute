import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  updateUserInfo: (userData: any) => void;
}

// 기본 컨텍스트 값 생성
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: () => Promise.resolve(),
  register: () => Promise.resolve(),
  logout: () => {},
  updateUserInfo: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  // 초기화 시 토큰이 있는 경우 사용자 정보 가져오기
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await authApi.getCurrentUser();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.data.token);
      
      // 사용자 정보 가져오기
      const userResponse = await authApi.getCurrentUser();
      setUser(userResponse.data);
      setIsAuthenticated(true);
      
      return userResponse.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.register(name, email, password);
      localStorage.setItem('token', response.data.token);
      
      // 사용자 정보 가져오기
      const userResponse = await authApi.getCurrentUser();
      setUser(userResponse.data);
      setIsAuthenticated(true);
      
      return userResponse.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    
    // 서버에 로그아웃 요청 (실패해도 로컬에선 로그아웃 처리)
    authApi.logout().catch(error => {
      console.error('Logout request failed:', error);
    });
  };

  const updateUserInfo = (userData: any) => {
    setUser(userData);
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
    updateUserInfo
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
