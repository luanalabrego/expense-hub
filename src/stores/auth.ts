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

        // Finance pode aprovar qualquer solicitação
        if (user.roles.includes('finance')) {
          return true;
        }

        // Dono de centro de custos pode aprovar solicitações do seu centro
        if (user.roles.includes('cost_center_owner')) {
          if (!costCenterId) return true;
          return user.ccScope.includes(costCenterId);
        }

        return false;
      },

      canManageCostCenter: (costCenterId) => {
        const { user } = get();
        if (!user) return false;

        // Finance pode gerenciar qualquer centro de custo
        if (user.roles.includes('finance')) return true;

        // Dono de centro de custos pode gerenciar se está no escopo
        return user.ccScope.includes(costCenterId);
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

