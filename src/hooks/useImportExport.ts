// Hooks React Query para importação e exportação
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryOptions } from '../lib/react-query';
import * as importExportService from '../services/importExport';
import type { ImportOptions, ExportOptions, ImportResult } from '../types';
import { useUIStore } from '../stores/ui';

// Hook para importar dados
export const useImportData = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: async ({
      options,
      userId,
    }: {
      options: ImportOptions;
      userId: string;
    }): Promise<ImportResult> => {
      return importExportService.importData(options, userId);
    },
    onSuccess: (result, variables) => {
      // Invalidar queries relacionadas baseado no tipo de entidade
      const entityType = variables.options.entityType;
      
      switch (entityType) {
        case 'vendors':
          queryClient.invalidateQueries({ queryKey: ['vendors'] });
          break;
        case 'cost-centers':
          queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
          break;
        case 'categories':
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          break;
        case 'users':
          queryClient.invalidateQueries({ queryKey: ['users'] });
          break;
        case 'requests':
          queryClient.invalidateQueries({ queryKey: ['requests'] });
          break;
      }

      // Mostrar notificação baseada no resultado
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Importação concluída',
          message: `${result.successRows} de ${result.totalRows} registros importados com sucesso.`,
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Importação com erros',
          message: `${result.successRows} de ${result.totalRows} registros importados. ${result.errors.length} erros encontrados.`,
        });
      }
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro na importação',
        message: error.message || 'Erro ao importar dados.',
      });
    },
  });
};

// Hook para validar dados de importação (sem salvar)
export const useValidateImportData = () => {
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: async ({
      options,
      userId,
    }: {
      options: ImportOptions;
      userId: string;
    }): Promise<ImportResult> => {
      return importExportService.importData(
        { ...options, validateOnly: true },
        userId
      );
    },
    onSuccess: (result) => {
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Validação concluída',
          message: `${result.totalRows} registros válidos encontrados.`,
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Erros de validação',
          message: `${result.errors.length} erros encontrados nos dados.`,
        });
      }
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro na validação',
        message: error.message || 'Erro ao validar dados.',
      });
    },
  });
};

// Hook para exportar dados
export const useExportData = () => {
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: async (options: ExportOptions) => {
      return importExportService.exportData(options);
    },
    onSuccess: (_, variables) => {
      addNotification({
        type: 'success',
        title: 'Exportação concluída',
        message: `Dados de ${variables.entityType} exportados em formato ${variables.format.toUpperCase()}.`,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro na exportação',
        message: error.message || 'Erro ao exportar dados.',
      });
    },
  });
};

// Hook para obter estatísticas de importação
export const useImportStats = (entityType: string) => {
  return useQuery({
    queryKey: ['import-stats', entityType],
    queryFn: () => importExportService.getImportStats(entityType),
    ...queryOptions.dynamic,
    enabled: !!entityType,
  });
};

// Hook para download de template
export const useDownloadTemplate = () => {
  const { addNotification } = useUIStore();

  return {
    downloadTemplate: (entityType: string) => {
      try {
        importExportService.downloadImportTemplate(entityType);
        addNotification({
          type: 'success',
          title: 'Template baixado',
          message: `Template para ${entityType} foi baixado com sucesso.`,
        });
      } catch (error: any) {
        addNotification({
          type: 'error',
          title: 'Erro no download',
          message: error.message || 'Erro ao baixar template.',
        });
      }
    },
  };
};

// Hook para obter templates disponíveis
export const useImportTemplates = () => {
  return useQuery({
    queryKey: ['import-templates'],
    queryFn: () => {
      // Retornar templates estáticos
      return Promise.resolve(importExportService.importTemplates);
    },
    ...queryOptions.static,
  });
};

// Hook para validar arquivo antes da importação
export const useValidateFile = () => {
  const validateFile = (file: File, entityType: string) => {
    const errors: string[] = [];

    // Validar extensão
    const allowedExtensions = ['.csv', '.txt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push('Apenas arquivos CSV são suportados');
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('Arquivo muito grande. Tamanho máximo: 10MB');
    }

    // Validar se template existe
    if (!importExportService.importTemplates[entityType]) {
      errors.push(`Tipo de entidade não suportado: ${entityType}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return { validateFile };
};

// Hook para processar arquivo CSV e mostrar preview
export const usePreviewImportData = () => {
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: async ({
      file,
      entityType,
      skipFirstRow = true,
    }: {
      file: File;
      entityType: string;
      skipFirstRow?: boolean;
    }) => {
      // Ler arquivo CSV
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());
            const data = lines.map(line => {
              return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
            });

            const template = importExportService.importTemplates[entityType];
            if (!template) {
              reject(new Error(`Template não encontrado para: ${entityType}`));
              return;
            }

            const startRow = skipFirstRow ? 1 : 0;
            const headerRow = skipFirstRow ? data[0] : template.columns.map(col => col.key);
            const previewData = data.slice(startRow, startRow + 5); // Mostrar apenas 5 linhas

            resolve({
              headers: headerRow,
              data: previewData,
              totalRows: data.length - (skipFirstRow ? 1 : 0),
              template,
            });
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsText(file);
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Erro ao processar arquivo',
        message: error.message || 'Erro ao ler arquivo CSV.',
      });
    },
  });
};

// Hook para obter histórico de importações (simulado)
export const useImportHistory = () => {
  return useQuery({
    queryKey: ['import-history'],
    queryFn: () => {
      // Simular histórico de importações
      const history = [
        {
          id: '1',
          entityType: 'vendors',
          fileName: 'fornecedores_2024.csv',
          totalRows: 150,
          successRows: 145,
          errors: 5,
          importedAt: new Date('2024-01-15'),
          importedBy: 'admin@empresa.com',
        },
        {
          id: '2',
          entityType: 'cost-centers',
          fileName: 'centros_custo.csv',
          totalRows: 25,
          successRows: 25,
          errors: 0,
          importedAt: new Date('2024-01-10'),
          importedBy: 'finance@empresa.com',
        },
      ];
      
      return Promise.resolve(history);
    },
    ...queryOptions.static,
  });
};

// Hook para obter estatísticas de exportação
export const useExportStats = () => {
  return useQuery({
    queryKey: ['export-stats'],
    queryFn: async () => {
      // Obter estatísticas de todas as entidades
      const entities = ['vendors', 'cost-centers', 'categories', 'users', 'requests'];
      const stats = await Promise.all(
        entities.map(async (entity) => {
          try {
            const entityStats = await importExportService.getImportStats(entity);
            return {
              entityType: entity,
              ...entityStats,
            };
          } catch (error) {
            return {
              entityType: entity,
              total: 0,
              recent: 0,
              byStatus: {},
            };
          }
        })
      );

      return stats;
    },
    ...queryOptions.dynamic,
  });
};

// Hook para configurações de importação/exportação
export const useImportExportSettings = () => {
  return useQuery({
    queryKey: ['import-export-settings'],
    queryFn: () => {
      // Configurações padrão
      const settings = {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['csv', 'txt'],
        exportFormats: ['csv', 'xlsx', 'json'],
        batchSize: 1000,
        validationRules: {
          vendors: {
            requiredFields: ['name', 'taxId'],
            uniqueFields: ['taxId'],
          },
          'cost-centers': {
            requiredFields: ['code', 'name', 'ownerEmail'],
            uniqueFields: ['code'],
          },
        },
      };
      
      return Promise.resolve(settings);
    },
    ...queryOptions.static,
  });
};

