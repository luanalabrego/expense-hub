// Hooks React Query para notificações
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { queryOptions } from '../lib/react-query';
import * as notificationService from '../services/notifications';
import type { NotificationListOptions, NotificationData } from '../types';
import { useUIStore } from '../stores/ui';
import { useAuthStore } from '../stores/auth';

// Hook para obter notificações
export const useNotifications = (options: NotificationListOptions = {}) => {
  return useQuery({
    queryKey: ['notifications', options],
    queryFn: () => notificationService.getNotifications(options),
    ...queryOptions.dynamic,
  });
};

// Hook para obter notificação por ID
export const useNotification = (id: string) => {
  return useQuery({
    queryKey: ['notifications', id],
    queryFn: () => notificationService.getNotification(id),
    ...queryOptions.dynamic,
    enabled: !!id,
  });
};

// Hook para obter contagem de notificações não lidas
export const useUnreadNotificationsCount = (userId: string) => {
  return useQuery({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: () => notificationService.getUnreadNotificationsCount(userId),
    ...queryOptions.realtime,
    enabled: !!userId,
  });
};

// Hook para criar notificação
export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (notificationData: NotificationData) => 
      notificationService.createNotification(notificationData),
    onSuccess: () => {
      // Invalidar queries de notificações
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      addNotification({
        type: 'success',
        title: 'Notificação enviada',
        message: 'A notificação foi enviada com sucesso.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro ao enviar notificação',
        message: error.message || 'Erro ao enviar notificação.',
      });
    },
  });
};

// Hook para marcar notificação como lida
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markNotificationAsRead(id),
    onSuccess: () => {
      // Invalidar queries de notificações
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Hook para marcar múltiplas notificações como lidas
export const useMarkMultipleNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (ids: string[]) => 
      notificationService.markMultipleNotificationsAsRead(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      addNotification({
        type: 'success',
        title: 'Notificações marcadas como lidas',
        message: `${ids.length} notificação(ões) marcada(s) como lida(s).`,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro ao marcar notificações',
        message: error.message || 'Erro ao marcar notificações como lidas.',
      });
    },
  });
};

// Hook para marcar todas as notificações como lidas
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (userId: string) => 
      notificationService.markAllNotificationsAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      addNotification({
        type: 'success',
        title: 'Todas as notificações marcadas como lidas',
        message: 'Todas as suas notificações foram marcadas como lidas.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro ao marcar notificações',
        message: error.message || 'Erro ao marcar todas as notificações como lidas.',
      });
    },
  });
};

// Hook para deletar notificação
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      addNotification({
        type: 'success',
        title: 'Notificação removida',
        message: 'A notificação foi removida com sucesso.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro ao remover notificação',
        message: error.message || 'Erro ao remover notificação.',
      });
    },
  });
};

// Hook para obter estatísticas de notificações
export const useNotificationStats = (userId?: string) => {
  return useQuery({
    queryKey: ['notifications', 'stats', userId],
    queryFn: () => notificationService.getNotificationStats(userId),
    ...queryOptions.dynamic,
  });
};

// Hook para limpar notificações expiradas
export const useCleanupExpiredNotifications = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: () => notificationService.cleanupExpiredNotifications(),
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      if (deletedCount > 0) {
        addNotification({
          type: 'info',
          title: 'Limpeza concluída',
          message: `${deletedCount} notificação(ões) expirada(s) removida(s).`,
        });
      }
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro na limpeza',
        message: error.message || 'Erro ao limpar notificações expiradas.',
      });
    },
  });
};

// Hook para notificações em tempo real
export const useRealtimeNotifications = (userId: string, options: { 
  limit?: number; 
  unreadOnly?: boolean 
} = {}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    setIsConnected(true);
    
    const unsubscribe = notificationService.subscribeToUserNotifications(
      userId,
      (newNotifications) => {
        setNotifications(newNotifications);
        
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
      options
    );

    return () => {
      setIsConnected(false);
      unsubscribe();
    };
  }, [userId, queryClient, options.limit, options.unreadOnly]);

  return {
    notifications,
    isConnected,
  };
};

// Hook para notificações do usuário atual
export const useUserNotifications = (options: NotificationListOptions = {}) => {
  const { user } = useAuthStore();
  
  return useNotifications({
    ...options,
    recipientId: user?.id,
  });
};

// Hook para notificações não lidas do usuário atual
export const useUserUnreadNotifications = () => {
  const { user } = useAuthStore();
  
  return useNotifications({
    recipientId: user?.id,
    read: false,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
};

// Hook para contagem de notificações não lidas do usuário atual
export const useUserUnreadCount = () => {
  const { user } = useAuthStore();
  
  return useUnreadNotificationsCount(user?.id || '');
};

// Hook para notificações em tempo real do usuário atual
export const useUserRealtimeNotifications = (options: { 
  limit?: number; 
  unreadOnly?: boolean 
} = {}) => {
  const { user } = useAuthStore();
  
  return useRealtimeNotifications(user?.id || '', options);
};

// Hook para funções específicas de notificação

// Notificação de aprovação de solicitação
export const useCreateApprovalRequestNotification = () => {
  const createNotification = useCreateNotification();

  return {
    createApprovalRequestNotification: async (
      requestId: string,
      requestTitle: string,
      requestAmount: number,
      approverId: string,
      requesterId: string
    ) => {
      return notificationService.createApprovalRequestNotification(
        requestId,
        requestTitle,
        requestAmount,
        approverId,
        requesterId
      );
    },
  };
};

// Notificação de resposta de aprovação
export const useCreateApprovalResponseNotification = () => {
  return {
    createApprovalResponseNotification: async (
      requestId: string,
      requestTitle: string,
      action: 'approved' | 'rejected',
      requesterId: string,
      approverId: string,
      comment?: string
    ) => {
      return notificationService.createApprovalResponseNotification(
        requestId,
        requestTitle,
        action,
        requesterId,
        approverId,
        comment
      );
    },
  };
};

// Notificação de alerta orçamentário
export const useCreateBudgetAlertNotification = () => {
  return {
    createBudgetAlertNotification: async (
      budgetId: string,
      budgetName: string,
      utilizationPercent: number,
      managerId: string,
      alertType: 'warning' | 'critical'
    ) => {
      return notificationService.createBudgetAlertNotification(
        budgetId,
        budgetName,
        utilizationPercent,
        managerId,
        alertType
      );
    },
  };
};

// Notificação de vencimento de solicitação
export const useCreateRequestDueNotification = () => {
  return {
    createRequestDueNotification: async (
      requestId: string,
      requestTitle: string,
      dueDate: Date,
      approverId: string
    ) => {
      return notificationService.createRequestDueNotification(
        requestId,
        requestTitle,
        dueDate,
        approverId
      );
    },
  };
};

// Notificação de sistema
export const useCreateSystemNotification = () => {
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: ({
      title,
      message,
      recipientIds,
      priority = 'medium'
    }: {
      title: string;
      message: string;
      recipientIds: string[];
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }) => notificationService.createSystemNotification(title, message, recipientIds, priority),
    onSuccess: (_, variables) => {
      addNotification({
        type: 'success',
        title: 'Notificação de sistema enviada',
        message: `Notificação enviada para ${variables.recipientIds.length} usuário(s).`,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro ao enviar notificação de sistema',
        message: error.message || 'Erro ao enviar notificação de sistema.',
      });
    },
  });
};

// Hook para configurações de notificação
export const useNotificationSettings = () => {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => {
      // Configurações padrão (podem vir do Firestore no futuro)
      const settings = {
        emailNotifications: true,
        pushNotifications: true,
        approvalRequests: true,
        approvalResponses: true,
        budgetAlerts: true,
        systemNotifications: true,
        marketingEmails: false,
        weeklyDigest: true,
        instantNotifications: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
        notificationTypes: {
          approval_request: { enabled: true, email: true, push: true },
          approval_response: { enabled: true, email: true, push: true },
          budget_alert: { enabled: true, email: true, push: false },
          system: { enabled: true, email: false, push: true },
          info: { enabled: true, email: false, push: false },
          warning: { enabled: true, email: true, push: true },
          error: { enabled: true, email: true, push: true },
        },
      };
      
      return Promise.resolve(settings);
    },
    ...queryOptions.static,
  });
};

