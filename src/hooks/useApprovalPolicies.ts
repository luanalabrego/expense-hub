// Hooks React Query para gestão de políticas de aprovação
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '../lib/react-query';
import { useNotifications } from '../stores/ui';
import * as approvalPoliciesService from '../services/approvalPolicies';
import type { ApprovalPolicy, PaginationParams } from '../types';

// Hook para obter política por ID
export const useApprovalPolicy = (id: string) => {
  return useQuery({
    queryKey: queryKeys.approvalPolicy(id),
    queryFn: () => approvalPoliciesService.getPolicyById(id),
    enabled: !!id,
    ...queryOptions.dynamic,
  });
};

// Hook para listar políticas
export const useApprovalPolicies = (
  params: PaginationParams & {
    status?: 'active' | 'inactive';
    categoryId?: string;
    costCenterId?: string;
    search?: string;
  } = { page: 1, limit: 20 }
) => {
  return useQuery({
    queryKey: ['approval-policies', 'list', params],
    queryFn: () => approvalPoliciesService.getPolicies(params),
    ...queryOptions.dynamic,
  });
};

// Hook para obter políticas por categoria
export const useApprovalPoliciesByCategory = (categoryId: string) => {
  return useQuery({
    queryKey: queryKeys.approvalPoliciesByCategory(categoryId),
    queryFn: () => approvalPoliciesService.getPoliciesByCategory(categoryId),
    enabled: !!categoryId,
    ...queryOptions.dynamic,
  });
};

// Hook para obter políticas por centro de custo
export const useApprovalPoliciesByCostCenter = (costCenterId: string) => {
  return useQuery({
    queryKey: queryKeys.approvalPoliciesByCostCenter(costCenterId),
    queryFn: () => approvalPoliciesService.getPoliciesByCostCenter(costCenterId),
    enabled: !!costCenterId,
    ...queryOptions.dynamic,
  });
};

// Hook para encontrar política aplicável
export const useApplicablePolicy = (
  amount: number,
  categoryId?: string,
  costCenterId?: string
) => {
  return useQuery({
    queryKey: ['approval-policies', 'applicable', { amount, categoryId, costCenterId }],
    queryFn: () => approvalPoliciesService.findApplicablePolicy(amount, categoryId, costCenterId),
    enabled: amount > 0,
    ...queryOptions.dynamic,
  });
};

// Hook para obter próximo aprovador
export const useNextApprover = (
  policyId: string,
  currentLevel: number = 0,
  approvalHistory: Array<{
    approverId: string;
    level: number;
    action: 'approved' | 'rejected';
  }> = []
) => {
  return useQuery({
    queryKey: ['approval-policies', 'next-approver', { policyId, currentLevel, approvalHistory }],
    queryFn: () => approvalPoliciesService.getNextApprover(policyId, currentLevel, approvalHistory),
    enabled: !!policyId,
    ...queryOptions.dynamic,
  });
};

// Hook para verificar se está totalmente aprovado
export const useIsFullyApproved = (
  policyId: string,
  approvalHistory: Array<{
    approverId: string;
    level: number;
    action: 'approved' | 'rejected';
  }> = []
) => {
  return useQuery({
    queryKey: ['approval-policies', 'fully-approved', { policyId, approvalHistory }],
    queryFn: () => approvalPoliciesService.isFullyApproved(policyId, approvalHistory),
    enabled: !!policyId,
    ...queryOptions.dynamic,
  });
};

// Hook para criar política
export const useCreateApprovalPolicy = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: approvalPoliciesService.createPolicy,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalPolicies });
      
      success('Política de aprovação criada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar política:', err);
      error('Erro ao criar política', err.message || 'Tente novamente.');
    },
  });
};

// Hook para atualizar política
export const useUpdateApprovalPolicy = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ApprovalPolicy> }) =>
      approvalPoliciesService.updatePolicy(id, updates),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalPolicies });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalPolicy(id) });
      
      success('Política atualizada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar política:', err);
      error('Erro ao atualizar política', err.message || 'Tente novamente.');
    },
  });
};

// Hook para deletar política
export const useDeleteApprovalPolicy = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: approvalPoliciesService.deletePolicy,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalPolicies });
      
      success('Política deletada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao deletar política:', err);
      error('Erro ao deletar política', err.message || 'Tente novamente.');
    },
  });
};

// Hook para alternar status da política
export const useToggleApprovalPolicyStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: approvalPoliciesService.togglePolicyStatus,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalPolicies });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalPolicy(id) });
      
      success('Status da política alterado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao alterar status:', err);
      error('Erro ao alterar status', err.message || 'Tente novamente.');
    },
  });
};

// Hook para duplicar política
export const useDuplicateApprovalPolicy = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      approvalPoliciesService.duplicatePolicy(id, newName),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalPolicies });
      
      success('Política duplicada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao duplicar política:', err);
      error('Erro ao duplicar política', err.message || 'Tente novamente.');
    },
  });
};

// Hook para reordenar políticas
export const useReorderApprovalPolicies = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: approvalPoliciesService.reorderPolicies,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.approvalPolicies });
      
      success('Ordem das políticas atualizada!');
    },
    onError: (err: any) => {
      console.error('Erro ao reordenar políticas:', err);
      error('Erro ao reordenar políticas', err.message || 'Tente novamente.');
    },
  });
};

