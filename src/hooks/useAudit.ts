// Hooks React Query para auditoria
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryOptions } from '../lib/react-query';
import * as auditService from '../services/audit';
import type { AuditListOptions, AuditLogData, AuditFilters } from '../types';
import { useUIStore } from '../stores/ui';
import { useAuthStore } from '../stores/auth';

// Hook para obter logs de auditoria
export const useAuditLogs = (options: AuditListOptions = {}) => {
  return useQuery({
    queryKey: ['audit-logs', options],
    queryFn: () => auditService.getAuditLogs(options),
    ...queryOptions.dynamic,
  });
};

// Hook para obter log de auditoria por ID
export const useAuditLog = (id: string) => {
  return useQuery({
    queryKey: ['audit-logs', id],
    queryFn: () => auditService.getAuditLog(id),
    ...queryOptions.dynamic,
    enabled: !!id,
  });
};

// Hook para obter logs de auditoria por entidade
export const useAuditLogsByEntity = (entity: string, entityId: string, limit: number = 20) => {
  return useQuery({
    queryKey: ['audit-logs', 'entity', entity, entityId, limit],
    queryFn: () => auditService.getAuditLogsByEntity(entity, entityId, limit),
    ...queryOptions.dynamic,
    enabled: !!entity && !!entityId,
  });
};

// Hook para obter logs de auditoria por usuário
export const useAuditLogsByUser = (userId: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['audit-logs', 'user', userId, limit],
    queryFn: () => auditService.getAuditLogsByUser(userId, limit),
    ...queryOptions.dynamic,
    enabled: !!userId,
  });
};

// Hook para criar log de auditoria
export const useCreateAuditLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (auditData: AuditLogData) => auditService.createAuditLog(auditData),
    onSuccess: () => {
      // Invalidar queries de auditoria
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['audit-stats'] });
    },
  });
};

// Hook para obter estatísticas de auditoria
export const useAuditStats = (filters: AuditFilters = {}) => {
  return useQuery({
    queryKey: ['audit-stats', filters],
    queryFn: () => auditService.getAuditStats(filters),
    ...queryOptions.dynamic,
  });
};

// Hook para obter atividade recente de um usuário
export const useUserRecentActivity = (userId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['audit-logs', 'recent-activity', userId, limit],
    queryFn: () => auditService.getUserRecentActivity(userId, limit),
    ...queryOptions.dynamic,
    enabled: !!userId,
  });
};

// Hook para obter timeline de uma entidade
export const useEntityTimeline = (entity: string, entityId: string, limit: number = 20) => {
  return useQuery({
    queryKey: ['audit-logs', 'timeline', entity, entityId, limit],
    queryFn: () => auditService.getEntityTimeline(entity, entityId, limit),
    ...queryOptions.dynamic,
    enabled: !!entity && !!entityId,
  });
};

// Hook para atividade recente do usuário atual
export const useCurrentUserRecentActivity = (limit: number = 10) => {
  const { user } = useAuthStore();
  
  return useUserRecentActivity(user?.id || '', limit);
};

// Hook para logs de auditoria do usuário atual
export const useCurrentUserAuditLogs = (limit: number = 50) => {
  const { user } = useAuthStore();
  
  return useAuditLogsByUser(user?.id || '', limit);
};

// Hooks para funções específicas de auditoria

// Hook para auditar login
export const useAuditLogin = () => {
  const createAuditLog = useCreateAuditLog();

  return {
    auditLogin: async (
      userId: string,
      userName: string,
      userEmail: string,
      success: boolean,
      ipAddress?: string,
      userAgent?: string
    ) => {
      return auditService.auditLogin(userId, userName, userEmail, success, ipAddress, userAgent);
    },
  };
};

// Hook para auditar logout
export const useAuditLogout = () => {
  return {
    auditLogout: async (
      userId: string,
      userName: string,
      userEmail: string,
      sessionDuration?: number,
      ipAddress?: string
    ) => {
      return auditService.auditLogout(userId, userName, userEmail, sessionDuration, ipAddress);
    },
  };
};

// Hook para auditar criação
export const useAuditCreate = () => {
  return {
    auditCreate: async (
      actorId: string,
      actorName: string,
      actorEmail: string,
      entity: string,
      entityId: string,
      entityName: string,
      data: any,
      ipAddress?: string
    ) => {
      return auditService.auditCreate(
        actorId,
        actorName,
        actorEmail,
        entity,
        entityId,
        entityName,
        data,
        ipAddress
      );
    },
  };
};

// Hook para auditar atualização
export const useAuditUpdate = () => {
  return {
    auditUpdate: async (
      actorId: string,
      actorName: string,
      actorEmail: string,
      entity: string,
      entityId: string,
      entityName: string,
      before: any,
      after: any,
      ipAddress?: string
    ) => {
      return auditService.auditUpdate(
        actorId,
        actorName,
        actorEmail,
        entity,
        entityId,
        entityName,
        before,
        after,
        ipAddress
      );
    },
  };
};

// Hook para auditar exclusão
export const useAuditDelete = () => {
  return {
    auditDelete: async (
      actorId: string,
      actorName: string,
      actorEmail: string,
      entity: string,
      entityId: string,
      entityName: string,
      data: any,
      ipAddress?: string
    ) => {
      return auditService.auditDelete(
        actorId,
        actorName,
        actorEmail,
        entity,
        entityId,
        entityName,
        data,
        ipAddress
      );
    },
  };
};

// Hook para auditar aprovação de solicitação
export const useAuditRequestApproval = () => {
  return {
    auditRequestApproval: async (
      actorId: string,
      actorName: string,
      actorEmail: string,
      requestId: string,
      requestTitle: string,
      action: 'approve' | 'reject',
      comment?: string,
      ipAddress?: string
    ) => {
      return auditService.auditRequestApproval(
        actorId,
        actorName,
        actorEmail,
        requestId,
        requestTitle,
        action,
        comment,
        ipAddress
      );
    },
  };
};

// Hook para auditar operação orçamentária
export const useAuditBudgetOperation = () => {
  return {
    auditBudgetOperation: async (
      actorId: string,
      actorName: string,
      actorEmail: string,
      budgetId: string,
      budgetName: string,
      operation: 'commit' | 'spend' | 'release',
      amount: number,
      relatedRequestId?: string,
      ipAddress?: string
    ) => {
      return auditService.auditBudgetOperation(
        actorId,
        actorName,
        actorEmail,
        budgetId,
        budgetName,
        operation,
        amount,
        relatedRequestId,
        ipAddress
      );
    },
  };
};

// Hook para auditar upload de documento
export const useAuditDocumentUpload = () => {
  return {
    auditDocumentUpload: async (
      actorId: string,
      actorName: string,
      actorEmail: string,
      documentId: string,
      documentName: string,
      fileSize: number,
      fileType: string,
      relatedEntityType?: string,
      relatedEntityId?: string,
      ipAddress?: string
    ) => {
      return auditService.auditDocumentUpload(
        actorId,
        actorName,
        actorEmail,
        documentId,
        documentName,
        fileSize,
        fileType,
        relatedEntityType,
        relatedEntityId,
        ipAddress
      );
    },
  };
};

// Hook para auditar download de documento
export const useAuditDocumentDownload = () => {
  return {
    auditDocumentDownload: async (
      actorId: string,
      actorName: string,
      actorEmail: string,
      documentId: string,
      documentName: string,
      ipAddress?: string
    ) => {
      return auditService.auditDocumentDownload(
        actorId,
        actorName,
        actorEmail,
        documentId,
        documentName,
        ipAddress
      );
    },
  };
};

// Hook para auditar importação de dados
export const useAuditDataImport = () => {
  return {
    auditDataImport: async (
      actorId: string,
      actorName: string,
      actorEmail: string,
      entityType: string,
      fileName: string,
      totalRows: number,
      successRows: number,
      errorRows: number,
      ipAddress?: string
    ) => {
      return auditService.auditDataImport(
        actorId,
        actorName,
        actorEmail,
        entityType,
        fileName,
        totalRows,
        successRows,
        errorRows,
        ipAddress
      );
    },
  };
};

// Hook para auditar exportação de dados
export const useAuditDataExport = () => {
  return {
    auditDataExport: async (
      actorId: string,
      actorName: string,
      actorEmail: string,
      entityType: string,
      format: string,
      recordCount: number,
      filters?: any,
      ipAddress?: string
    ) => {
      return auditService.auditDataExport(
        actorId,
        actorName,
        actorEmail,
        entityType,
        format,
        recordCount,
        filters,
        ipAddress
      );
    },
  };
};

// Hook para obter IP do usuário (simulado)
export const useUserIP = () => {
  return useQuery({
    queryKey: ['user-ip'],
    queryFn: async () => {
      try {
        // Em produção, você pode usar um serviço como ipapi.co
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      } catch (error) {
        // Fallback para desenvolvimento
        return '127.0.0.1';
      }
    },
    ...queryOptions.static,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};

// Hook para obter User Agent
export const useUserAgent = () => {
  return navigator.userAgent;
};

// Hook para auditoria automática com contexto do usuário
export const useAutoAudit = () => {
  const { user } = useAuthStore();
  const { data: userIP } = useUserIP();
  const userAgent = useUserAgent();

  const auditCreate = useAuditCreate();
  const auditUpdate = useAuditUpdate();
  const auditDelete = useAuditDelete();

  return {
    auditCreate: (
      entity: string,
      entityId: string,
      entityName: string,
      data: any
    ) => {
      if (!user) return Promise.resolve();
      
      return auditCreate.auditCreate(
        user.id,
        user.name,
        user.email,
        entity,
        entityId,
        entityName,
        data,
        userIP
      );
    },
    
    auditUpdate: (
      entity: string,
      entityId: string,
      entityName: string,
      before: any,
      after: any
    ) => {
      if (!user) return Promise.resolve();
      
      return auditUpdate.auditUpdate(
        user.id,
        user.name,
        user.email,
        entity,
        entityId,
        entityName,
        before,
        after,
        userIP
      );
    },
    
    auditDelete: (
      entity: string,
      entityId: string,
      entityName: string,
      data: any
    ) => {
      if (!user) return Promise.resolve();
      
      return auditDelete.auditDelete(
        user.id,
        user.name,
        user.email,
        entity,
        entityId,
        entityName,
        data,
        userIP
      );
    },
  };
};

// Hook para configurações de auditoria
export const useAuditSettings = () => {
  return useQuery({
    queryKey: ['audit-settings'],
    queryFn: () => {
      // Configurações padrão (podem vir do Firestore no futuro)
      const settings = {
        retentionPeriod: 365, // dias
        enabledActions: {
          login: true,
          logout: true,
          create: true,
          update: true,
          delete: true,
          approve: true,
          reject: true,
          upload: true,
          download: true,
          import: true,
          export: true,
        },
        enabledEntities: {
          user: true,
          vendor: true,
          cost_center: true,
          category: true,
          request: true,
          approval_policy: true,
          budget: true,
          document: true,
          notification: false,
          system: true,
        },
        sensitiveFields: [
          'password',
          'token',
          'secret',
          'key',
          'ssn',
          'taxId',
        ],
        ipTracking: true,
        userAgentTracking: true,
        sessionTracking: true,
        changeTracking: true,
        bulkOperationTracking: true,
      };
      
      return Promise.resolve(settings);
    },
    ...queryOptions.static,
  });
};

// Hook para relatório de auditoria
export const useAuditReport = (filters: AuditFilters & { 
  groupBy?: 'action' | 'entity' | 'user' | 'date';
  period?: 'day' | 'week' | 'month' | 'year';
} = {}) => {
  return useQuery({
    queryKey: ['audit-report', filters],
    queryFn: async () => {
      const stats = await auditService.getAuditStats(filters);
      
      // Processar dados para relatório
      const report = {
        summary: {
          totalActions: stats.total,
          recentActions: stats.recent,
          topActions: stats.topActions,
          topUsers: stats.topUsers,
        },
        breakdown: {
          byAction: stats.byAction,
          byEntity: stats.byEntity,
          byUser: stats.byUser,
        },
        trends: {
          // Aqui você pode adicionar lógica para calcular tendências
          // baseado no período selecionado
        },
        compliance: {
          // Métricas de compliance
          auditCoverage: Object.keys(stats.byEntity).length,
          userActivity: Object.keys(stats.byUser).length,
        },
      };
      
      return report;
    },
    ...queryOptions.dynamic,
  });
};

