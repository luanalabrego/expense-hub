// Store de UI e notificações
import { create } from 'zustand';
import type { Notification } from '../types';
import { NOTIFICATION } from '../constants';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UIState {
  // Tema
  theme: 'light' | 'dark';
  
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Toasts
  toasts: Toast[];
  
  // Modais
  modals: Record<string, boolean>;
  
  // Filtros persistentes
  filters: Record<string, any>;
  
  // Ações de tema
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  
  // Ações de sidebar
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  
  // Ações de loading
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  
  // Ações de toast
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Ações de modal
  openModal: (key: string) => void;
  closeModal: (key: string) => void;
  toggleModal: (key: string) => void;
  isModalOpen: (key: string) => boolean;
  
  // Ações de filtros
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;
  getFilter: (key: string) => any;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Estado inicial
  theme: 'light',
  sidebarOpen: true,
  sidebarCollapsed: false,
  globalLoading: false,
  loadingStates: {},
  toasts: [],
  modals: {},
  filters: {},
  
  // Ações de tema
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
  
  // Ações de sidebar
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSidebarCollapse: () => set((state) => ({ 
    sidebarCollapsed: !state.sidebarCollapsed 
  })),
  
  // Ações de loading
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  setLoading: (key, loading) => set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: loading }
  })),
  isLoading: (key) => get().loadingStates[key] ?? false,
  
  // Ações de toast
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? NOTIFICATION.AUTO_DISMISS_DELAY,
    };
    
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    // Auto-remover após o tempo especificado
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(toast => toast.id !== id)
  })),
  
  clearToasts: () => set({ toasts: [] }),
  
  // Ações de modal
  openModal: (key) => set((state) => ({
    modals: { ...state.modals, [key]: true }
  })),
  
  closeModal: (key) => set((state) => ({
    modals: { ...state.modals, [key]: false }
  })),
  
  toggleModal: (key) => set((state) => ({
    modals: { ...state.modals, [key]: !state.modals[key] }
  })),
  
  isModalOpen: (key) => get().modals[key] ?? false,
  
  // Ações de filtros
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  
  clearFilter: (key) => set((state) => {
    const { [key]: removed, ...rest } = state.filters;
    return { filters: rest };
  }),
  
  clearAllFilters: () => set({ filters: {} }),
  
  getFilter: (key) => get().filters[key],
}));

// Hook para notificações simplificadas
export const useNotifications = () => {
  const addToast = useUIStore(state => state.addToast);
  
  return {
    success: (title: string, message?: string) => 
      addToast({ type: 'success', title, message }),
    
    error: (title: string, message?: string) => 
      addToast({ type: 'error', title, message }),
    
    warning: (title: string, message?: string) => 
      addToast({ type: 'warning', title, message }),
    
    info: (title: string, message?: string) => 
      addToast({ type: 'info', title, message }),
  };
};

