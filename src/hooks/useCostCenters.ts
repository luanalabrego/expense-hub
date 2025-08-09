// Hooks React Query para gestão de centros de custo
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '../lib/react-query';
import { useNotifications } from '../stores/ui';
import * as costCentersService from '../services/costCenters';
import type { CostCenter, PaginationParams } from '../types';

// Hook para obter centro de custo por ID
export const useCostCenter = (id: string) => {
  return useQuery({
    queryKey: queryKeys.costCenter(id),
    queryFn: () => costCentersService.getCostCenterById(id),
    enabled: !!id,
    ...queryOptions.static,
  });
};

// Hook para listar centros de custo
export const useCostCenters = (
  params: PaginationParams & {
    status?: string;
    search?: string;
    managerId?: string;
  } = { page: 1, limit: 20 }
) => {
  return useQuery({
    queryKey: ['cost-centers', 'list', params],
    queryFn: () => costCentersService.getCostCenters(params),
    ...queryOptions.dynamic,
  });
};

// Hook para obter centros de custo por gerente
export const useCostCentersByManager = (managerId: string) => {
  return useQuery({
    queryKey: queryKeys.costCentersByUser(managerId),
    queryFn: () => costCentersService.getCostCentersByManager(managerId),
    enabled: !!managerId,
    ...queryOptions.static,
  });
};

// Hook para obter centros de custo filhos
export const useChildCostCenters = (parentId: string) => {
  return useQuery({
    queryKey: ['cost-centers', 'children', parentId],
    queryFn: () => costCentersService.getChildCostCenters(parentId),
    enabled: !!parentId,
    ...queryOptions.static,
  });
};

// Hook para obter centros de custo ativos
export const useActiveCostCenters = () => {
  return useQuery({
    queryKey: ['cost-centers', 'active'],
    queryFn: costCentersService.getActiveCostCenters,
    ...queryOptions.static,
  });
};

// Hook para obter hierarquia de centros de custo
export const useCostCenterHierarchy = () => {
  return useQuery({
    queryKey: ['cost-centers', 'hierarchy'],
    queryFn: costCentersService.getCostCenterHierarchy,
    ...queryOptions.static,
  });
};

// Hook para criar centro de custo
export const useCreateCostCenter = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: costCentersService.createCostCenter,
    onSuccess: (newCostCenter) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenters });
      
      success('Centro de custo criado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar centro de custo:', err);
      error('Erro ao criar centro de custo', err.message || 'Tente novamente.');
    },
  });
};

// Hook para atualizar centro de custo
export const useUpdateCostCenter = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CostCenter> }) =>
      costCentersService.updateCostCenter(id, updates),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenters });
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenter(id) });
      
      success('Centro de custo atualizado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar centro de custo:', err);
      error('Erro ao atualizar centro de custo', err.message || 'Tente novamente.');
    },
  });
};

// Hook para desativar centro de custo
export const useDeactivateCostCenter = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: costCentersService.deactivateCostCenter,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenters });
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenter(id) });
      
      success('Centro de custo desativado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao desativar centro de custo:', err);
      error('Erro ao desativar centro de custo', err.message || 'Tente novamente.');
    },
  });
};

// Hook para reativar centro de custo
export const useReactivateCostCenter = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: costCentersService.reactivateCostCenter,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenters });
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenter(id) });
      
      success('Centro de custo reativado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao reativar centro de custo:', err);
      error('Erro ao reativar centro de custo', err.message || 'Tente novamente.');
    },
  });
};

// Hook para atualizar valores do centro de custo
export const useUpdateCostCenterAmounts = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, amounts }: { 
      id: string; 
      amounts: { spent?: number; committed?: number } 
    }) => costCentersService.updateCostCenterAmounts(id, amounts),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenters });
      queryClient.invalidateQueries({ queryKey: queryKeys.costCenter(id) });
      
      success('Valores atualizados com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar valores:', err);
      error('Erro ao atualizar valores', err.message || 'Tente novamente.');
    },
  });
};

// Hook para verificar se código existe
export const useCheckCodeExists = () => {
  return useMutation({
    mutationFn: ({ code, excludeId }: { code: string; excludeId?: string }) =>
      costCentersService.checkCodeExists(code, excludeId),
  });
};

