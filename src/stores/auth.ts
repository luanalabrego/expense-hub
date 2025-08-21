// Store de autenticação
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Ações
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: User) => void;
  logout: () => void;
  clearError: () => void;
  
  // Verificações de permissão
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  canApprove: (costCenterId?: string) => boolean;
  canManageCostCenter: (costCenterId: string) => boolean;
  isFinance: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Ações básicas
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      // Login
      login: (user) => set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      }),
      
      // Logout
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: null 
      }),
      
      hasRole: (role: string) => {
        const user = get().user;
        return user?.roles?.includes(role);
      },

      hasAnyRole: (roles: string[]) => {
        const user = get().user;
        return user?.roles?.some((r) => roles.includes(r));
      },

      canApprove: () => true,

      canManageCostCenter: () => true,

      isFinance: () => true,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

