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
  isAdmin: () => boolean;
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
      
      // Verificações de permissão
      hasRole: (role) => {
        const { user } = get();
        return user?.roles.includes(role as any) ?? false;
      },
      
      hasAnyRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.some(role => user.roles.includes(role as any));
      },
      
      canApprove: (costCenterId) => {
        const { user } = get();
        if (!user) return false;
        
        // Admin e Finance podem aprovar qualquer coisa
        if (user.roles.includes('admin') || user.roles.includes('finance')) {
          return true;
        }
        
        // Approver pode aprovar se tem acesso ao centro de custo
        if (user.roles.includes('approver')) {
          if (!costCenterId) return true; // Pode aprovar em geral
          return user.ccScope.includes(costCenterId);
        }
        
        return false;
      },
      
      canManageCostCenter: (costCenterId) => {
        const { user } = get();
        if (!user) return false;
        
        // Admin pode gerenciar qualquer centro de custo
        if (user.roles.includes('admin')) return true;
        
        // Usuário pode gerenciar se está no escopo
        return user.ccScope.includes(costCenterId);
      },
      
      isAdmin: () => {
        const { user } = get();
        return user?.roles.includes('admin') ?? false;
      },
      
      isFinance: () => {
        const { user } = get();
        return user?.roles.includes('finance') ?? false;
      },
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

