// Hooks React Query para documentos
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryOptions } from '../lib/react-query';
import * as documentsService from '../services/documents';
import type { 
  DocumentFile, 
  DocumentCategory, 
  DocumentSearchFilters, 
  DocumentUploadProgress 
} from '../types';
import { useUIStore } from '../stores/ui';

// Hook para obter lista de documentos
export const useDocuments = (
  options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } & DocumentSearchFilters = {}
) => {
  return useQuery({
    queryKey: ['documents', 'list', options],
    queryFn: () => documentsService.getDocuments(options),
    ...queryOptions.dynamic,
  });
};

// Hook para obter documento específico
export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ['documents', 'detail', id],
    queryFn: () => documentsService.getDocument(id),
    ...queryOptions.static,
    enabled: !!id,
  });
};

// Hook para obter documentos por entidade
export const useDocumentsByEntity = (
  entityType: string,
  entityId: string
) => {
  return useQuery({
    queryKey: ['documents', 'by-entity', entityType, entityId],
    queryFn: () => documentsService.getDocumentsByEntity(entityType, entityId),
    ...queryOptions.dynamic,
    enabled: !!entityType && !!entityId,
  });
};

// Hook para obter categorias de documentos
export const useDocumentCategories = () => {
  return useQuery({
    queryKey: ['document-categories', 'list'],
    queryFn: () => documentsService.getDocumentCategories(),
    ...queryOptions.static,
  });
};

// Hook para obter estatísticas de documentos
export const useDocumentStats = (filters: DocumentSearchFilters = {}) => {
  return useQuery({
    queryKey: ['documents', 'stats', filters],
    queryFn: () => documentsService.getDocumentStats(filters),
    ...queryOptions.dynamic,
  });
};

// Hook para buscar documentos
export const useSearchDocuments = (
  searchTerm: string,
  filters: DocumentSearchFilters = {},
  limit: number = 20
) => {
  return useQuery({
    queryKey: ['documents', 'search', searchTerm, filters, limit],
    queryFn: () => documentsService.searchDocuments(searchTerm, filters, limit),
    ...queryOptions.dynamic,
    enabled: searchTerm.length >= 2, // Só buscar com pelo menos 2 caracteres
  });
};

// Hook para obter versões de documento
export const useDocumentVersions = (documentId: string) => {
  return useQuery({
    queryKey: ['documents', 'versions', documentId],
    queryFn: () => documentsService.getDocumentVersions(documentId),
    ...queryOptions.static,
    enabled: !!documentId,
  });
};

// Hook para upload de documento
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: async ({
      file,
      category = 'general',
      description,
      tags = [],
      relatedEntityType,
      relatedEntityId,
      isPublic = false,
      expiresAt,
      userId,
      onProgress,
    }: {
      file: File;
      category?: string;
      description?: string;
      tags?: string[];
      relatedEntityType?: string;
      relatedEntityId?: string;
      isPublic?: boolean;
      expiresAt?: Date;
      userId: string;
      onProgress?: (progress: DocumentUploadProgress) => void;
    }) => {
      return documentsService.uploadDocument(
        {
          file,
          category,
          description,
          tags,
          relatedEntityType: relatedEntityType as any,
          relatedEntityId,
          isPublic,
          expiresAt,
          onProgress,
        },
        userId
      );
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      if (variables.relatedEntityType && variables.relatedEntityId) {
        queryClient.invalidateQueries({ 
          queryKey: ['documents', 'by-entity', variables.relatedEntityType, variables.relatedEntityId] 
        });
      }

      addNotification({
        type: 'success',
        title: 'Upload realizado com sucesso',
        message: `Documento "${data.name}" foi enviado com sucesso.`,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro no upload',
        message: error.message || 'Erro ao fazer upload do documento.',
      });
    },
  });
};

// Hook para atualizar documento
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      userId,
    }: {
      id: string;
      updates: Partial<DocumentFile>;
      userId: string;
    }) => {
      return documentsService.updateDocument(id, updates, userId);
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', variables.id] });

      addNotification({
        type: 'success',
        title: 'Documento atualizado',
        message: 'Documento foi atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro ao atualizar',
        message: error.message || 'Erro ao atualizar documento.',
      });
    },
  });
};

// Hook para deletar documento
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => documentsService.deleteDocument(id),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['documents'] });

      addNotification({
        type: 'success',
        title: 'Documento deletado',
        message: 'Documento foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro ao deletar',
        message: error.message || 'Erro ao deletar documento.',
      });
    },
  });
};

// Hook para incrementar contador de download
export const useIncrementDownloadCount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsService.incrementDownloadCount(id),
    onSuccess: (_, id) => {
      // Atualizar cache do documento específico
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'stats'] });
    },
    // Não mostrar notificação para esta ação
  });
};

// Hook para criar categoria de documento
export const useCreateDocumentCategory = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: async ({
      categoryData,
      userId,
    }: {
      categoryData: Omit<DocumentCategory, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
      userId: string;
    }) => {
      return documentsService.createDocumentCategory(categoryData, userId);
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['document-categories'] });

      addNotification({
        type: 'success',
        title: 'Categoria criada',
        message: 'Nova categoria de documento foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro ao criar categoria',
        message: error.message || 'Erro ao criar categoria de documento.',
      });
    },
  });
};

// Hook para criar nova versão de documento
export const useCreateDocumentVersion = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: async ({
      documentId,
      file,
      userId,
      comment,
    }: {
      documentId: string;
      file: File;
      userId: string;
      comment?: string;
    }) => {
      return documentsService.createDocumentVersion(documentId, file, userId, comment);
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'detail', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'versions', variables.documentId] });

      addNotification({
        type: 'success',
        title: 'Nova versão criada',
        message: 'Nova versão do documento foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro ao criar versão',
        message: error.message || 'Erro ao criar nova versão do documento.',
      });
    },
  });
};

// Hook para download de documento (com tracking)
export const useDownloadDocument = () => {
  const incrementDownload = useIncrementDownloadCount();

  return {
    downloadDocument: async (document: DocumentFile) => {
      try {
        // Incrementar contador
        incrementDownload.mutate(document.id);

        // Abrir URL de download
        window.open(document.downloadURL, '_blank');
      } catch (error) {
        console.error('Erro ao fazer download:', error);
      }
    },
    isLoading: incrementDownload.isPending,
  };
};

// Hook para obter documentos recentes
export const useRecentDocuments = (limit: number = 10) => {
  return useQuery({
    queryKey: ['documents', 'recent', limit],
    queryFn: () => documentsService.getDocuments({
      limit,
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
    }),
    ...queryOptions.dynamic,
  });
};

// Hook para obter documentos por usuário
export const useDocumentsByUser = (userId: string, limit: number = 20) => {
  return useQuery({
    queryKey: ['documents', 'by-user', userId, limit],
    queryFn: () => documentsService.getDocuments({
      uploadedBy: userId,
      limit,
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
    }),
    ...queryOptions.dynamic,
    enabled: !!userId,
  });
};

// Hook para obter documentos públicos
export const usePublicDocuments = (limit: number = 20) => {
  return useQuery({
    queryKey: ['documents', 'public', limit],
    queryFn: () => documentsService.getDocuments({
      isPublic: true,
      limit,
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
    }),
    ...queryOptions.dynamic,
  });
};

// Hook para obter documentos por categoria
export const useDocumentsByCategory = (category: string, limit: number = 20) => {
  return useQuery({
    queryKey: ['documents', 'by-category', category, limit],
    queryFn: () => documentsService.getDocuments({
      category,
      limit,
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
    }),
    ...queryOptions.dynamic,
    enabled: !!category,
  });
};

// Hook para validar arquivo antes do upload
export const useValidateFile = () => {
  const validateFile = (file: File) => {
    const errors: string[] = [];

    // Validar tamanho (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('Arquivo muito grande. Tamanho máximo: 50MB');
    }

    // Validar tipo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push('Tipo de arquivo não permitido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return { validateFile };
};

