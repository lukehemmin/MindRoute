import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  isAdmin: () => boolean;
}

// 인증 상태 관리 스토어
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: true,
      
      setAuth: (user, accessToken, refreshToken) => set({
        isAuthenticated: true,
        user,
        accessToken,
        refreshToken,
        loading: false
      }),
      
      clearAuth: () => set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
      }),

      logout: () => set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
      }),

      setLoading: (loading) => set({ loading }),

      isAdmin: () => {
        const state = get();
        return state.user?.role === 'admin';
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore; 