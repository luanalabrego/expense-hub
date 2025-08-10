// Hooks React Query para gestão de solicitações de pagamento
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '../lib/react-query';
import { useNotifications } from '../stores/ui';
import * as requestsService from '../services/requests';
import type { PaymentRequest, RequestStatus } from '../types';

// Hook para obter solicitação por ID
export const useRequest = (id: string) => {
  return useQuery({
    queryKey: queryKeys.request(id),
    queryFn: () => requestsService.getRequestById(id),
    enabled: !!id,
    ...queryOptions.dynamic,
  });
};

// Hook para listar solicitações com paginação e filtros
export const useRequestsList = (
  params: {
    page: number;
    limit: number;
    search?: string;
    status?: RequestStatus;
    vendorId?: string;
    costCenterId?: string;
    categoryId?: string;
    orderBy?: 'createdAt' | 'dueDate' | 'amount' | 'status' | 'priority';
    orderDir?: 'asc' | 'desc';
    minAmount?: number;
    maxAmount?: number;
    fromDate?: Date;
    toDate?: Date;
  } = { page: 1, limit: 20 }
) => {
  return useQuery({
    queryKey: ['requests', 'list', params],
    queryFn: () =>
      requestsService.getRequests({
        page: params.page,
        limit: params.limit,
        status: params.status,
        vendorId: params.vendorId,
        costCenterId: params.costCenterId,
        categoryId: params.categoryId,
        search: params.search,
        dateFrom: params.fromDate,
        dateTo: params.toDate,
        amountFrom: params.minAmount,
        amountTo: params.maxAmount,
        sortBy: params.orderBy,
        sortOrder: params.orderDir,
      }),
    ...queryOptions.dynamic,
  });
};

// Alias para compatibilidade retroativa
export const useRequests = useRequestsList;

// Hook para obter solicitações por status
export const useRequestsByStatus = (status: RequestStatus) => {
  return useQuery({
    queryKey: queryKeys.requestsByStatus(status),
    queryFn: () => requestsService.getRequestsByStatus(status),
    enabled: !!status,
    ...queryOptions.dynamic,
  });
};

// Hook para obter solicitações por usuário
export const useRequestsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.requestsByUser(userId),
    queryFn: () => requestsService.getRequestsByUser(userId),
    enabled: !!userId,
    ...queryOptions.dynamic,
  });
};

// Hook para obter solicitações pendentes para aprovador
export const usePendingRequestsForApprover = (approverId: string) => {
  return useQuery({
    queryKey: queryKeys.requestsByApprover(approverId),
    queryFn: () => requestsService.getPendingRequestsForApprover(approverId),
    enabled: !!approverId,
    ...queryOptions.realtime,
  });
};

// Hook para obter estatísticas de solicitações
export const useRequestStats = (
  filters: {
    dateFrom?: Date;
    dateTo?: Date;
    costCenterId?: string;
    categoryId?: string;
  } = {}
) => {
  return useQuery({
    queryKey: ['requests', 'stats', filters],
    queryFn: () => requestsService.getRequestStats(filters),
    ...queryOptions.dynamic,
  });
};

// Hook para criar solicitação
export const useCreateRequest = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: requestsService.createRequest,
    onSuccess: (newRequest) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.requests });
      queryClient.invalidateQueries({ queryKey: queryKeys.requestsByUser(newRequest.requesterId) });
      
      success('Solicitação criada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar solicitação:', err);
      error('Erro ao criar solicitação', err.message || 'Tente novamente.');
    },
  });
};

// Hook para atualizar solicitação
export const useUpdateRequest = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PaymentRequest> }) =>
      requestsService.updateRequest(id, updates),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.requests });
      queryClient.invalidateQueries({ queryKey: queryKeys.request(id) });
      
      success('Solicitação atualizada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar solicitação:', err);
      error('Erro ao atualizar solicitação', err.message || 'Tente novamente.');
    },
  });
};

// Hook para submeter solicitação
export const useSubmitRequest = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, userId, userName }: { id: string; userId: string; userName: string }) =>
      requestsService.submitRequest(id, userId, userName),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.requests });
      queryClient.invalidateQueries({ queryKey: queryKeys.request(id) });
      
      success('Solicitação enviada para aprovação!');
    },
    onError: (err: any) => {
      console.error('Erro ao submeter solicitação:', err);
      error('Erro ao submeter solicitação', err.message || 'Tente novamente.');
    },
  });
};

// Hook para aprovar solicitação
export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ 
      id, 
      approverId, 
      approverName, 
      comments 
    }: { 
      id: string; 
      approverId: string; 
      approverName: string; 
      comments?: string; 
    }) => requestsService.approveRequest(id, approverId, approverName, comments),
    onSuccess: (_, { id, approverId }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.requests });
      queryClient.invalidateQueries({ queryKey: queryKeys.request(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requestsByApprover(approverId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenters });
      
      success('Solicitação aprovada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao aprovar solicitação:', err);
      error('Erro ao aprovar solicitação', err.message || 'Tente novamente.');
    },
  });
};

// Hook para rejeitar solicitação
export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ 
      id, 
      approverId, 
      approverName, 
      reason 
    }: { 
      id: string; 
      approverId: string; 
      approverName: string; 
      reason: string; 
    }) => requestsService.rejectRequest(id, approverId, approverName, reason),
    onSuccess: (_, { id, approverId }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.requests });
      queryClient.invalidateQueries({ queryKey: queryKeys.request(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requestsByApprover(approverId) });
      
      success('Solicitação rejeitada.');
    },
    onError: (err: any) => {
      console.error('Erro ao rejeitar solicitação:', err);
      error('Erro ao rejeitar solicitação', err.message || 'Tente novamente.');
    },
  });
};

// Hook para marcar como pago
export const useMarkAsPaid = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ 
      id, 
      paymentDetails 
    }: { 
      id: string; 
      paymentDetails: {
        paidBy: string;
        paidByName: string;
        paymentDate: Date;
        paymentReference?: string;
        notes?: string;
      };
    }) => requestsService.markAsPaid(id, paymentDetails),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.requests });
      queryClient.invalidateQueries({ queryKey: queryKeys.request(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenters });
      
      success('Pagamento registrado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao registrar pagamento:', err);
      error('Erro ao registrar pagamento', err.message || 'Tente novamente.');
    },
  });
};

// Hook para cancelar solicitação
export const useCancelRequest = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, reason, userId, userName }: { id: string; reason: string; userId: string; userName: string }) =>
      requestsService.cancelRequest(id, reason, userId, userName),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.requests });
      queryClient.invalidateQueries({ queryKey: queryKeys.request(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenters });
      
      success('Solicitação cancelada.');
    },
    onError: (err: any) => {
      console.error('Erro ao cancelar solicitação:', err);
      error('Erro ao cancelar solicitação', err.message || 'Tente novamente.');
    },
  });
};

