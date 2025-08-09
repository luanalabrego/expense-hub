// Hooks React Query para gestão de categorias
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '../lib/react-query';
import { useNotifications } from '../stores/ui';
import * as categoriesService from '../services/categories';
import type { Category, PaginationParams } from '../types';

// Hook para obter categoria por ID
export const useCategory = (id: string) => {
  return useQuery({
    queryKey: queryKeys.category(id),
    queryFn: () => categoriesService.getCategoryById(id),
    enabled: !!id,
    ...queryOptions.static,
  });
};

// Hook para listar categorias
export const useCategories = (
  params: PaginationParams & {
    type?: string;
    status?: string;
    search?: string;
    parentId?: string;
  } = { page: 1, limit: 20 }
) => {
  return useQuery({
    queryKey: ['categories', 'list', params],
    queryFn: () => categoriesService.getCategories(params),
    ...queryOptions.dynamic,
  });
};

// Hook para obter categorias por tipo
export const useCategoriesByType = (type: string) => {
  return useQuery({
    queryKey: queryKeys.categoriesByType(type),
    queryFn: () => categoriesService.getCategoriesByType(type),
    enabled: !!type,
    ...queryOptions.static,
  });
};

// Hook para obter categorias filhas
export const useChildCategories = (parentId: string) => {
  return useQuery({
    queryKey: ['categories', 'children', parentId],
    queryFn: () => categoriesService.getChildCategories(parentId),
    enabled: !!parentId,
    ...queryOptions.static,
  });
};

// Hook para obter categorias ativas
export const useActiveCategories = () => {
  return useQuery({
    queryKey: ['categories', 'active'],
    queryFn: categoriesService.getActiveCategories,
    ...queryOptions.static,
  });
};

// Hook para obter hierarquia de categorias
export const useCategoryHierarchy = (type?: string) => {
  return useQuery({
    queryKey: ['categories', 'hierarchy', type],
    queryFn: () => categoriesService.getCategoryHierarchy(type),
    ...queryOptions.static,
  });
};

// Hook para obter categorias que requerem aprovação
export const useApprovalCategories = () => {
  return useQuery({
    queryKey: ['categories', 'approval'],
    queryFn: categoriesService.getApprovalCategories,
    ...queryOptions.static,
  });
};

// Hook para criar categoria
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: categoriesService.createCategory,
    onSuccess: (newCategory) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      
      success('Categoria criada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar categoria:', err);
      error('Erro ao criar categoria', err.message || 'Tente novamente.');
    },
  });
};

// Hook para atualizar categoria
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Category> }) =>
      categoriesService.updateCategory(id, updates),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.category(id) });
      
      success('Categoria atualizada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar categoria:', err);
      error('Erro ao atualizar categoria', err.message || 'Tente novamente.');
    },
  });
};

// Hook para desativar categoria
export const useDeactivateCategory = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: categoriesService.deactivateCategory,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.category(id) });
      
      success('Categoria desativada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao desativar categoria:', err);
      error('Erro ao desativar categoria', err.message || 'Tente novamente.');
    },
  });
};

// Hook para reativar categoria
export const useReactivateCategory = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: categoriesService.reactivateCategory,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.category(id) });
      
      success('Categoria reativada com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao reativar categoria:', err);
      error('Erro ao reativar categoria', err.message || 'Tente novamente.');
    },
  });
};

// Hook para verificar se código existe
export const useCheckCategoryCodeExists = () => {
  return useMutation({
    mutationFn: ({ code, excludeId }: { code: string; excludeId?: string }) =>
      categoriesService.checkCodeExists(code, excludeId),
  });
};

