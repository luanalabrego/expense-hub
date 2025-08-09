// Configuração do React Query
import { QueryClient } from '@tanstack/react-query';
import { CACHE } from '../constants';

// Configuração do cliente React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE.STALE_TIME,
      gcTime: CACHE.CACHE_TIME,
      retry: CACHE.RETRY_ATTEMPTS,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: CACHE.RETRY_DELAY,
    },
  },
});

// Chaves de query organizadas
export const queryKeys = {
  // Usuários
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  currentUser: ['users', 'current'] as const,
  
  // Fornecedores
  vendors: ['vendors'] as const,
  vendor: (id: string) => ['vendors', id] as const,
  vendorsByTag: (tag: string) => ['vendors', 'tag', tag] as const,
  
  // Centros de custo
  costCenters: ['cost-centers'] as const,
  costCenter: (id: string) => ['cost-centers', id] as const,
  costCentersByUser: (userId: string) => ['cost-centers', 'user', userId] as const,
  
  // Categorias
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  categoriesByType: (type: string) => ['categories', 'type', type] as const,
  
  // Solicitações
  requests: ['requests'] as const,
  request: (id: string) => ['requests', id] as const,
  requestsByStatus: (status: string) => ['requests', 'status', status] as const,
  requestsByUser: (userId: string) => ['requests', 'user', userId] as const,
  requestsByApprover: (userId: string) => ['requests', 'approver', userId] as const,
  requestsFiltered: (filters: Record<string, any>) => ['requests', 'filtered', filters] as const,
  
  // Documentos
  documents: ['documents'] as const,
  document: (id: string) => ['documents', id] as const,
  documentsByRequest: (requestId: string) => ['documents', 'request', requestId] as const,
  documentsByVendor: (vendorId: string) => ['documents', 'vendor', vendorId] as const,
  
  // Orçamentos
  budgets: ['budgets'] as const,
  budget: (id: string) => ['budgets', id] as const,
  budgetsByCostCenter: (ccId: string, year?: number) => ['budgets', 'cost-center', ccId, year] as const,
  budgetsByYear: (year: number) => ['budgets', 'year', year] as const,
  
  // Políticas e alçadas
  policies: ['policies'] as const,
  approvalMatrix: ['policies', 'approval-matrix'] as const,
  
  // Approval Policies
  approvalPolicies: ['approval-policies'] as const,
  approvalPolicy: (id: string) => ['approval-policies', id] as const,
  approvalPoliciesByCategory: (categoryId: string) => ['approval-policies', 'category', categoryId] as const,
  approvalPoliciesByCostCenter: (costCenterId: string) => ['approval-policies', 'cost-center', costCenterId] as const,
  
  // KPIs e dashboard
  kpis: ['kpis'] as const,
  dashboardData: (period: string) => ['kpis', 'dashboard', period] as const,
  chartData: (type: string, filters: Record<string, any>) => ['kpis', 'chart', type, filters] as const,
  
  // Analytics
  analytics: ['analytics'] as const,
  dashboardKPIs: (filters?: any) => ['analytics', 'dashboard-kpis', filters] as const,
  requestsAnalytics: (filters?: any) => ['analytics', 'requests-analytics', filters] as const,
  timeSeries: (period?: string, filters?: any) => ['analytics', 'time-series', period, filters] as const,
  topVendors: (limit?: number, filters?: any) => ['analytics', 'top-vendors', limit, filters] as const,
  costCenterAnalysis: (filters?: any) => ['analytics', 'cost-center-analysis', filters] as const,
  requestsByCategory: (filters?: any) => ['analytics', 'requests-by-category', filters] as const,
  
  // Auditoria
  auditLogs: ['audit-logs'] as const,
  auditLog: (id: string) => ['audit-logs', id] as const,
  auditLogsByEntity: (entity: string, entityId: string) => ['audit-logs', entity, entityId] as const,
  
  // Notificações
  notifications: ['notifications'] as const,
  notification: (id: string) => ['notifications', id] as const,
  unreadNotifications: ['notifications', 'unread'] as const,
} as const;

// Funções de invalidação de cache
export const invalidateQueries = {
  // Invalidar todas as queries de usuários
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
  
  // Invalidar todas as queries de fornecedores
  vendors: () => queryClient.invalidateQueries({ queryKey: queryKeys.vendors }),
  
  // Invalidar todas as queries de centros de custo
  costCenters: () => queryClient.invalidateQueries({ queryKey: queryKeys.costCenters }),
  
  // Invalidar todas as queries de categorias
  categories: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  
  // Invalidar todas as queries de solicitações
  requests: () => queryClient.invalidateQueries({ queryKey: queryKeys.requests }),
  
  // Invalidar todas as queries de documentos
  documents: () => queryClient.invalidateQueries({ queryKey: queryKeys.documents }),
  
  // Invalidar todas as queries de orçamentos
  budgets: () => queryClient.invalidateQueries({ queryKey: queryKeys.budgets }),
  
  // Invalidar todas as queries de políticas
  policies: () => queryClient.invalidateQueries({ queryKey: queryKeys.policies }),
  
  // Invalidar todas as queries de KPIs
  kpis: () => queryClient.invalidateQueries({ queryKey: queryKeys.kpis }),
  
  // Invalidar todas as queries de auditoria
  auditLogs: () => queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs }),
  
  // Invalidar todas as queries de notificações
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  
  // Invalidar tudo
  all: () => queryClient.invalidateQueries(),
};

// Funções de prefetch
export const prefetchQueries = {
  // Prefetch dados do dashboard
  dashboard: async (period: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.dashboardData(period),
      queryFn: () => {
        // Implementar função de busca dos dados do dashboard
        return Promise.resolve({});
      },
    });
  },
  
  // Prefetch dados básicos
  basicData: async () => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.vendors,
        queryFn: () => Promise.resolve([]),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.costCenters,
        queryFn: () => Promise.resolve([]),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.categories,
        queryFn: () => Promise.resolve([]),
      }),
    ]);
  },
};

// Configurações específicas para diferentes tipos de dados
export const queryOptions = {
  // Dados que mudam raramente (configurações, políticas)
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  },
  
  // Dados que mudam frequentemente (solicitações, notificações)
  dynamic: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  },
  
  // Dados em tempo real (dashboard, KPIs)
  realtime: {
    staleTime: 0, // Sempre buscar
    gcTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 30 * 1000, // Atualizar a cada 30 segundos
  },
  
  // Dados de auditoria (raramente acessados)
  audit: {
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
  },
};

