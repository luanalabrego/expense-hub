// Hooks React Query para gestão de usuários
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '../lib/react-query';
import { useNotifications } from '../stores/ui';
import * as usersService from '../services/users';
import type { User, PaginationParams } from '../types';

// Hook para obter usuário atual
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: usersService.getCurrentUser,
    ...queryOptions.dynamic,
  });
};

// Hook para obter usuário por ID
export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => usersService.getUserById(id),
    enabled: !!id,
    ...queryOptions.static,
  });
};

// Hook para listar usuários
export const useUsers = (
  params: PaginationParams & {
    role?: string;
    status?: string;
    search?: string;
  } = { page: 1, limit: 20 }
) => {
  return useQuery({
    queryKey: ['users', 'list', params],
    queryFn: () => usersService.getUsers(params),
    ...queryOptions.dynamic,
  });
};

// Hook para obter usuários por papel
export const useUsersByRole = (role: string) => {
  return useQuery({
    queryKey: ['users', 'by-role', role],
    queryFn: () => usersService.getUsersByRole(role),
    enabled: !!role,
    ...queryOptions.static,
  });
};

// Hook para obter usuários por centro de custo
export const useUsersByCostCenter = (costCenterId: string) => {
  return useQuery({
    queryKey: ['users', 'by-cost-center', costCenterId],
    queryFn: () => usersService.getUsersByCostCenter(costCenterId),
    enabled: !!costCenterId,
    ...queryOptions.static,
  });
};

// Hook para criar usuário
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: usersService.createUser,
    onSuccess: (newUser) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      
      success('Usuário criado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao criar usuário:', err);
      error('Erro ao criar usuário', err.message || 'Tente novamente.');
    },
  });
};

// Hook para atualizar usuário
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      usersService.updateUser(id, updates),
    onSuccess: (_, { id }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
      
      success('Usuário atualizado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar usuário:', err);
      error('Erro ao atualizar usuário', err.message || 'Tente novamente.');
    },
  });
};

// Hook para desativar usuário
export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: usersService.deactivateUser,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
      
      success('Usuário desativado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao desativar usuário:', err);
      error('Erro ao desativar usuário', err.message || 'Tente novamente.');
    },
  });
};

// Hook para reativar usuário
export const useReactivateUser = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: usersService.reactivateUser,
    onSuccess: (_, id) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
      
      success('Usuário reativado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao reativar usuário:', err);
      error('Erro ao reativar usuário', err.message || 'Tente novamente.');
    },
  });
};

// Hook para atualizar perfil do usuário atual
export const useUpdateCurrentUserProfile = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: usersService.updateCurrentUserProfile,
    onSuccess: () => {
      // Invalidar query do usuário atual
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      
      success('Perfil atualizado com sucesso!');
    },
    onError: (err: any) => {
      console.error('Erro ao atualizar perfil:', err);
      error('Erro ao atualizar perfil', err.message || 'Tente novamente.');
    },
  });
};

// Hook para verificar se email existe
export const useCheckEmailExists = () => {
  return useMutation({
    mutationFn: usersService.checkEmailExists,
  });
};

