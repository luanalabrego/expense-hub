// Hooks React Query para gestão de fornecedores
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '../lib/react-query';
import { useNotifications } from '../stores/ui';
import * as vendorsService from '../services/vendors';
import type { Vendor, PaginationParams } from '../types';

// Hook para obter fornecedor por ID
export const useVendor = (id: string) => {
  return useQuery({
    queryKey: queryKeys.vendor(id),
    queryFn: () => vendorsService.getVendorById(id),
    enabled: !!id,
    ...queryOptions.static,
  });
};

// Hook para listar fornecedores
export const useVendors = (
  params: PaginationParams & {
    status?: string;
    search?: string;
    tags?: string[];
  } = { page: 1, limit: 20 }
) => {
  return useQuery({
    queryKey: [
      'vendors',
      'list',
      params.page,
      params.limit,
      params.status ?? '',
      params.search ?? '',
      params.tags ? [...params.tags].sort().join(',') : '',
    ],
    queryFn: () => vendorsService.getVendors(params),
    ...queryOptions.dynamic,
  });
};

// Hook para obter fornecedores por tag
export const useVendorsByTag = (tag: string) => {
  return useQuery({
    queryKey: queryKeys.vendorsByTag(tag),
    queryFn: () => vendorsService.getVendorsByTag(tag),
    enabled: !!tag,
    ...queryOptions.static,
  });
};

// Hook para obter fornecedores ativos
export const useActiveVendors = () => {
  return useQuery<Vendor[]>({
    queryKey: ['vendors', 'active'],
    queryFn: vendorsService.getActiveVendors,
    // Não fornecemos `initialData` para garantir que o React Query
    // realize a busca no Firebase em vez de considerar a query já
    // resolvida com um array vazio.
    ...queryOptions.static,
  });
};

// Hook para criar fornecedor
export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: vendorsService.createVendor,
    onSuccess: (newVendor) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      
      success('Fornecedor criado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar fornecedor:', err);
      error('Erro ao criar fornecedor', err.message || 'Tente novamente.');
    },
  });
};

// Hook para atualizar fornecedor
export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Vendor> }) =>
      vendorsService.updateVendor(id, updates),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor(id) });
      
      success('Fornecedor atualizado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar fornecedor:', err);
      error('Erro ao atualizar fornecedor', err.message || 'Tente novamente.');
    },
  });
};

// Hook para desativar fornecedor
export const useDeactivateVendor = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: vendorsService.deactivateVendor,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor(id) });
      
      success('Fornecedor desativado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao desativar fornecedor:', err);
      error('Erro ao desativar fornecedor', err.message || 'Tente novamente.');
    },
  });
};

// Hook para reativar fornecedor
export const useReactivateVendor = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: vendorsService.reactivateVendor,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor(id) });
      
      success('Fornecedor reativado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao reativar fornecedor:', err);
      error('Erro ao reativar fornecedor', err.message || 'Tente novamente.');
    },
  });
};

// Hook para bloquear fornecedor
export const useBlockVendor = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: vendorsService.blockVendor,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor(id) });
      
      success('Fornecedor bloqueado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao bloquear fornecedor:', err);
      error('Erro ao bloquear fornecedor', err.message || 'Tente novamente.');
    },
  });
};

// Hook para desbloquear fornecedor
export const useUnblockVendor = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: vendorsService.unblockVendor,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor(id) });
      
      success('Fornecedor desbloqueado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao desbloquear fornecedor:', err);
      error('Erro ao desbloquear fornecedor', err.message || 'Tente novamente.');
    },
  });
};

// Hook para aprovar fornecedor
export const useApproveVendor = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: vendorsService.approveVendor,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor(id) });
      success('Fornecedor aprovado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao aprovar fornecedor:', err);
      error('Erro ao aprovar fornecedor', err.message || 'Tente novamente.');
    },
  });
};

// Hook para reprovar fornecedor
export const useRejectVendor = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      vendorsService.rejectVendor(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor(id) });
      success('Fornecedor reprovado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao reprovar fornecedor:', err);
      error('Erro ao reprovar fornecedor', err.message || 'Tente novamente.');
    },
  });
};

// Hook para solicitar mais informações do fornecedor
export const useRequestMoreInfoVendor = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, info }: { id: string; info: string }) =>
      vendorsService.requestMoreInfoVendor(id, info),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor(id) });
      success('Solicitação de informações enviada!');
    },
    onError: (err: any) => {
      console.error('Erro ao solicitar informações:', err);
      error('Erro ao solicitar informações', err.message || 'Tente novamente.');
    },
  });
};

// Hook para atualizar rating
export const useUpdateVendorRating = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      vendorsService.updateVendorRating(id, rating),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendor(id) });
      
      success('Rating atualizado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar rating:', err);
      error('Erro ao atualizar rating', err.message || 'Tente novamente.');
    },
  });
};

// Hook para verificar se CNPJ existe
export const useCheckTaxIdExists = () => {
  return useMutation({
    mutationFn: ({ taxId, excludeId }: { taxId: string; excludeId?: string }) =>
      vendorsService.checkTaxIdExists(taxId, excludeId),
  });
};

