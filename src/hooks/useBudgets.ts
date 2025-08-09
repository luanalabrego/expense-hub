// Hooks React Query para gestão de orçamentos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '../lib/react-query';
import { useNotifications } from '../stores/ui';
import * as budgetsService from '../services/budgets';
import type { Budget, BudgetPeriod, ForecastData, PaginationParams } from '../types';

// Hook para obter orçamento por ID
export const useBudget = (id: string) => {
  return useQuery({
    queryKey: queryKeys.budget(id),
    queryFn: () => budgetsService.getBudgetById(id),
    enabled: !!id,
    ...queryOptions.dynamic,
  });
};

// Hook para listar orçamentos
export const useBudgets = (
  params: PaginationParams & {
    costCenterId?: string;
    categoryId?: string;
    period?: string;
    year?: number;
    status?: 'draft' | 'approved' | 'active' | 'closed';
    search?: string;
  } = { page: 1, limit: 20 }
) => {
  return useQuery({
    queryKey: ['budgets', 'list', params],
    queryFn: () => budgetsService.getBudgets(params),
    ...queryOptions.dynamic,
  });
};

// Hook para obter orçamentos por centro de custo
export const useBudgetsByCostCenter = (costCenterId: string, year?: number) => {
  return useQuery({
    queryKey: queryKeys.budgetsByCostCenter(costCenterId, year),
    queryFn: () => budgetsService.getBudgetsByCostCenter(costCenterId, year),
    enabled: !!costCenterId,
    ...queryOptions.dynamic,
  });
};

// Hook para obter orçamentos por ano
export const useBudgetsByYear = (year: number) => {
  return useQuery({
    queryKey: queryKeys.budgetsByYear(year),
    queryFn: () => budgetsService.getBudgetsByYear(year),
    enabled: !!year,
    ...queryOptions.dynamic,
  });
};

// Hook para encontrar orçamento aplicável
export const useApplicableBudget = (
  costCenterId: string,
  categoryId: string | null,
  year: number,
  month: number
) => {
  return useQuery({
    queryKey: ['budgets', 'applicable', { costCenterId, categoryId, year, month }],
    queryFn: () => budgetsService.findApplicableBudget(costCenterId, categoryId, year, month),
    enabled: !!costCenterId && !!year && !!month,
    ...queryOptions.dynamic,
  });
};

// Hook para estatísticas de orçamento
export const useBudgetStats = (
  filters: {
    costCenterId?: string;
    year?: number;
    period?: BudgetPeriod;
  } = {}
) => {
  return useQuery({
    queryKey: ['budgets', 'stats', filters],
    queryFn: () => budgetsService.getBudgetStats(filters),
    ...queryOptions.dynamic,
  });
};

// Hook para obter forecasts
export const useForecasts = (costCenterId?: string, year?: number) => {
  return useQuery({
    queryKey: ['forecasts', 'list', { costCenterId, year }],
    queryFn: () => budgetsService.getForecasts(costCenterId, year),
    ...queryOptions.dynamic,
  });
};

// Hook para criar orçamento
export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: budgetsService.createBudget,
    onSuccess: (newBudget) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetsByCostCenter(newBudget.costCenterId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetsByYear(newBudget.year) });
      
      success('Orçamento criado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar orçamento:', err);
      error('Erro ao criar orçamento', err.message || 'Tente novamente.');
    },
  });
};

// Hook para atualizar orçamento
export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Budget> }) =>
      budgetsService.updateBudget(id, updates),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) });
      
      success('Orçamento atualizado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar orçamento:', err);
      error('Erro ao atualizar orçamento', err.message || 'Tente novamente.');
    },
  });
};

// Hook para deletar orçamento
export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: budgetsService.deleteBudget,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      
      success('Orçamento deletado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao deletar orçamento:', err);
      error('Erro ao deletar orçamento', err.message || 'Tente novamente.');
    },
  });
};

// Hook para aprovar orçamento
export const useApproveBudget = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) =>
      budgetsService.approveBudget(id, approvedBy),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) });
      
      success('Orçamento aprovado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao aprovar orçamento:', err);
      error('Erro ao aprovar orçamento', err.message || 'Tente novamente.');
    },
  });
};

// Hook para ativar orçamento
export const useActivateBudget = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: budgetsService.activateBudget,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) });
      
      success('Orçamento ativado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao ativar orçamento:', err);
      error('Erro ao ativar orçamento', err.message || 'Tente novamente.');
    },
  });
};

// Hook para fechar orçamento
export const useCloseBudget = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: budgetsService.closeBudget,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) });
      
      success('Orçamento fechado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao fechar orçamento:', err);
      error('Erro ao fechar orçamento', err.message || 'Tente novamente.');
    },
  });
};

// Hook para duplicar orçamento
export const useDuplicateBudget = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ 
      id, 
      newYear, 
      newPeriod 
    }: { 
      id: string; 
      newYear: number; 
      newPeriod?: BudgetPeriod; 
    }) => budgetsService.duplicateBudget(id, newYear, newPeriod),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
      
      success('Orçamento duplicado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao duplicar orçamento:', err);
      error('Erro ao duplicar orçamento', err.message || 'Tente novamente.');
    },
  });
};

// Hook para comprometer valor
export const useCommitBudgetAmount = () => {
  const queryClient = useQueryClient();
  const { error } = useNotifications();

  return useMutation({
    mutationFn: ({ 
      costCenterId, 
      categoryId, 
      amount, 
      year, 
      month 
    }: { 
      costCenterId: string; 
      categoryId: string | null; 
      amount: number; 
      year: number; 
      month: number; 
    }) => budgetsService.commitBudgetAmount(costCenterId, categoryId, amount, year, month),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
    },
    onError: (err: any) => {
      console.error('Erro ao comprometer valor:', err);
      error('Erro ao comprometer valor no orçamento', err.message || 'Tente novamente.');
    },
  });
};

// Hook para gastar valor
export const useSpendBudgetAmount = () => {
  const queryClient = useQueryClient();
  const { error } = useNotifications();

  return useMutation({
    mutationFn: ({ 
      costCenterId, 
      categoryId, 
      amount, 
      year, 
      month 
    }: { 
      costCenterId: string; 
      categoryId: string | null; 
      amount: number; 
      year: number; 
      month: number; 
    }) => budgetsService.spendBudgetAmount(costCenterId, categoryId, amount, year, month),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
    },
    onError: (err: any) => {
      console.error('Erro ao gastar valor:', err);
      error('Erro ao gastar valor do orçamento', err.message || 'Tente novamente.');
    },
  });
};

// Hook para liberar valor comprometido
export const useReleaseBudgetAmount = () => {
  const queryClient = useQueryClient();
  const { error } = useNotifications();

  return useMutation({
    mutationFn: ({ 
      costCenterId, 
      categoryId, 
      amount, 
      year, 
      month 
    }: { 
      costCenterId: string; 
      categoryId: string | null; 
      amount: number; 
      year: number; 
      month: number; 
    }) => budgetsService.releaseBudgetAmount(costCenterId, categoryId, amount, year, month),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets });
    },
    onError: (err: any) => {
      console.error('Erro ao liberar valor:', err);
      error('Erro ao liberar valor comprometido', err.message || 'Tente novamente.');
    },
  });
};

// Hook para criar forecast
export const useCreateForecast = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: budgetsService.createForecast,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['forecasts'] });
      
      success('Forecast criado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar forecast:', err);
      error('Erro ao criar forecast', err.message || 'Tente novamente.');
    },
  });
};

