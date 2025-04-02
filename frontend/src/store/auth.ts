import create from 'zustand';
import { api } from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (status: boolean) => void;
  setLoading: (status: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  
  setUser: (user) => set({ user }),
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  setLoading: (status) => set({ isLoading: status }),
  setError: (error) => set({ error }),
  
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      set({ 
        isAuthenticated: true, 
        user,
        error: null 
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '로그인에 실패했습니다.';
      set({ error: errorMessage });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      set({
        isAuthenticated: false,
        user: null
      });
    }
  },
  
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isAuthenticated: false, user: null });
        return false;
      }
      
      const response = await api.get('/auth/me');
      const user = response.data.data;
      
      set({
        isAuthenticated: true,
        user,
        error: null
      });
      
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      set({
        isAuthenticated: false,
        user: null
      });
      
      return false;
    } finally {
      set({ isLoading: false });
    }
  }
})); 