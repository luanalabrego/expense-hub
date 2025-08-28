// Serviços para importação e exportação de dados
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  writeBatch,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Vendor,
  CostCenter, 
  Category, 
  PaymentRequest, 
  User,
  ImportResult,
  ImportError,
  ExportParams
} from '../types';
import { generateVendorCode } from './vendors';

// Tipos para importação/exportação
export interface ImportOptions {
  file: File;
  entityType: 'vendors' | 'cost-centers' | 'categories' | 'users' | 'requests';
  skipFirstRow?: boolean;
  updateExisting?: boolean;
  validateOnly?: boolean;
}

export interface ExportOptions {
  entityType: 'vendors' | 'cost-centers' | 'categories' | 'users' | 'requests' | 'budgets';
  format: 'csv' | 'xlsx' | 'json';
  filters?: Record<string, any>;
  columns?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ImportTemplate {
  entityType: string;
  columns: Array<{
    key: string;
    label: string;
    required: boolean;
    type: 'string' | 'number' | 'date' | 'boolean' | 'email';
    validation?: string;
    example?: string;
  }>;
  instructions: string[];
}

// Templates de importação
export const importTemplates: Record<string, ImportTemplate> = {
  vendors: {
    entityType: 'vendors',
    columns: [
      { key: 'name', label: 'Nome', required: true, type: 'string', example: 'Fornecedor ABC Ltda' },
      { key: 'taxId', label: 'CNPJ', required: true, type: 'string', validation: 'CNPJ válido', example: '12.345.678/0001-90' },
      { key: 'email', label: 'Email', required: false, type: 'email', example: 'contato@fornecedor.com' },
      { key: 'phone', label: 'Telefone', required: false, type: 'string', example: '(11) 99999-9999' },
      { key: 'tags', label: 'Tags', required: false, type: 'string', example: 'critico,preferencial' },
      { key: 'rating', label: 'Avaliação', required: false, type: 'number', example: '4.5' },
      { key: 'categories', label: 'Categorias', required: false, type: 'string', example: 'servicos,consultoria' },
    ],
    instructions: [
      'O CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
      'Tags devem ser separadas por vírgula',
      'Avaliação deve ser um número de 0 a 5',
      'Categorias devem ser separadas por vírgula',
    ],
  },
  'cost-centers': {
    entityType: 'cost-centers',
    columns: [
      { key: 'code', label: 'Código', required: true, type: 'string', example: 'CC001' },
      { key: 'name', label: 'Nome', required: true, type: 'string', example: 'Departamento de TI' },
      { key: 'ownerEmail', label: 'Email do Gerente', required: true, type: 'email', example: 'gerente@empresa.com' },
      { key: 'budget', label: 'Orçamento Anual', required: false, type: 'number', example: '100000' },
    ],
    instructions: [
      'O código deve ser único no sistema',
      'O email do gerente deve corresponder a um usuário existente',
      'O orçamento deve ser um valor numérico',
    ],
  },
  categories: {
    entityType: 'categories',
    columns: [
      { key: 'name', label: 'Nome', required: true, type: 'string', example: 'Serviços de TI' },
      { key: 'type', label: 'Tipo', required: true, type: 'string', example: 'OPEX' },
      { key: 'parentName', label: 'Categoria Pai', required: false, type: 'string', example: 'Tecnologia' },
      { key: 'icon', label: 'Ícone', required: false, type: 'string', example: 'Computer' },
      { key: 'color', label: 'Cor', required: false, type: 'string', example: '#3B82F6' },
    ],
    instructions: [
      'Tipo deve ser OPEX ou CAPEX',
      'Categoria pai deve existir no sistema (se informada)',
      'Cor deve estar no formato hexadecimal (#RRGGBB)',
    ],
  },
  users: {
    entityType: 'users',
    columns: [
      { key: 'name', label: 'Nome', required: true, type: 'string', example: 'João Silva' },
      { key: 'email', label: 'Email', required: true, type: 'email', example: 'joao@empresa.com' },
      { key: 'roles', label: 'Papéis', required: true, type: 'string', example: 'cost_center_owner,user' },
      { key: 'approvalLimit', label: 'Limite de Aprovação', required: false, type: 'number', example: '50000' },
      { key: 'costCenterCodes', label: 'Centros de Custo', required: false, type: 'string', example: 'CC001,CC002' },
    ],
    instructions: [
      'Papéis válidos: finance, cost_center_owner, user',
      'Papéis devem ser separados por vírgula',
      'Centros de custo devem ser códigos existentes, separados por vírgula',
      'Limite de aprovação deve ser um valor numérico',
    ],
  },
};

// Função para ler arquivo CSV
const readCSVFile = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const data = lines.map(line => {
          // Parse CSV simples (não lida com vírgulas dentro de aspas)
          return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        });
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};

// Função para validar dados de importação
const validateImportData = (
  data: string[][],
  template: ImportTemplate,
  skipFirstRow: boolean = true
): { isValid: boolean; errors: ImportError[]; validData: Record<string, any>[] } => {
  const errors: ImportError[] = [];
  const validData: Record<string, any>[] = [];
  
  const startRow = skipFirstRow ? 1 : 0;
  const headerRow = skipFirstRow ? data[0] : template.columns.map(col => col.key);
  
  // Validar cabeçalho
  const requiredColumns = template.columns.filter(col => col.required).map(col => col.key);
  const missingColumns = requiredColumns.filter(col => !headerRow.includes(col));
  
  if (missingColumns.length > 0) {
    errors.push({
      row: 0,
      field: 'header',
      message: `Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`,
      value: headerRow,
    });
    return { isValid: false, errors, validData: [] };
  }
  
  // Validar dados
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    const rowData: Record<string, any> = {};
    let hasErrors = false;
    
    template.columns.forEach((column, colIndex) => {
      const headerIndex = headerRow.indexOf(column.key);
      const cellValue = headerIndex >= 0 ? row[headerIndex] : '';
      
      // Validar campo obrigatório
      if (column.required && (!cellValue || cellValue.trim() === '')) {
        errors.push({
          row: i + 1,
          field: column.key,
          message: `Campo obrigatório não preenchido`,
          value: cellValue,
        });
        hasErrors = true;
        return;
      }
      
      // Validar tipo
      if (cellValue && cellValue.trim() !== '') {
        switch (column.type) {
          case 'number':
            const numValue = parseFloat(cellValue);
            if (isNaN(numValue)) {
              errors.push({
                row: i + 1,
                field: column.key,
                message: `Valor deve ser numérico`,
                value: cellValue,
              });
              hasErrors = true;
            } else {
              rowData[column.key] = numValue;
            }
            break;
            
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cellValue)) {
              errors.push({
                row: i + 1,
                field: column.key,
                message: `Email inválido`,
                value: cellValue,
              });
              hasErrors = true;
            } else {
              rowData[column.key] = cellValue.trim();
            }
            break;
            
          case 'date':
            const dateValue = new Date(cellValue);
            if (isNaN(dateValue.getTime())) {
              errors.push({
                row: i + 1,
                field: column.key,
                message: `Data inválida`,
                value: cellValue,
              });
              hasErrors = true;
            } else {
              rowData[column.key] = dateValue;
            }
            break;
            
          case 'boolean':
            const boolValue = cellValue.toLowerCase();
            if (!['true', 'false', '1', '0', 'sim', 'não'].includes(boolValue)) {
              errors.push({
                row: i + 1,
                field: column.key,
                message: `Valor booleano inválido (use: true/false, 1/0, sim/não)`,
                value: cellValue,
              });
              hasErrors = true;
            } else {
              rowData[column.key] = ['true', '1', 'sim'].includes(boolValue);
            }
            break;
            
          default:
            rowData[column.key] = cellValue.trim();
        }
      }
    });
    
    if (!hasErrors) {
      validData.push(rowData);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validData,
  };
};

// Função para importar fornecedores
const importVendors = async (data: Record<string, any>[], userId: string): Promise<ImportResult> => {
  const batch = writeBatch(db);
  const errors: ImportError[] = [];
  let successRows = 0;
  
  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i];
      
      // Verificar se CNPJ já existe
      const existingQuery = query(
        collection(db, 'vendors'),
        where('taxId', '==', row.taxId)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        errors.push({
          row: i + 1,
          field: 'taxId',
          message: 'CNPJ já existe no sistema',
          value: row.taxId,
        });
        continue;
      }
      const code = await generateVendorCode();

      const vendorData: Omit<Vendor, 'id'> = {
        code,
        name: row.name,
        taxId: row.taxId,
        email: row.email || '',
        phone: row.phone || '',
        tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
        rating: row.rating || 0,
        blocked: false,
        contacts: [],
        categories: row.categories ? row.categories.split(',').map((c: string) => c.trim()) : [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = doc(collection(db, 'vendors'));
      batch.set(docRef, {
        ...vendorData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      successRows++;
    } catch (error) {
      errors.push({
        row: i + 1,
        field: 'general',
        message: `Erro ao processar linha: ${error}`,
        value: data[i],
      });
    }
  }
  
  if (successRows > 0) {
    await batch.commit();
  }
  
  return {
    success: errors.length === 0,
    totalRows: data.length,
    successRows,
    errors,
  };
};

// Função para importar centros de custo
const importCostCenters = async (data: Record<string, any>[], userId: string): Promise<ImportResult> => {
  const batch = writeBatch(db);
  const errors: ImportError[] = [];
  let successRows = 0;
  
  // Buscar usuários por email para validação
  const usersQuery = query(collection(db, 'users'));
  const usersSnapshot = await getDocs(usersQuery);
  const usersByEmail = new Map();
  usersSnapshot.docs.forEach(doc => {
    const userData = doc.data();
    usersByEmail.set(userData.email, doc.id);
  });
  
  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i];
      
      // Verificar se código já existe
      const existingQuery = query(
        collection(db, 'cost-centers'),
        where('code', '==', row.code)
      );
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        errors.push({
          row: i + 1,
          field: 'code',
          message: 'Código já existe no sistema',
          value: row.code,
        });
        continue;
      }
      
      // Verificar se usuário existe
      const ownerId = usersByEmail.get(row.ownerEmail);
      if (!ownerId) {
        errors.push({
          row: i + 1,
          field: 'ownerEmail',
          message: 'Usuário não encontrado',
          value: row.ownerEmail,
        });
        continue;
      }
      
      const costCenterData: Omit<CostCenter, 'id'> = {
        code: row.code,
        name: row.name,
        ownerUserId: ownerId,
        budgets: row.budget ? { [new Date().getFullYear()]: row.budget } : {},
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = doc(collection(db, 'cost-centers'));
      batch.set(docRef, {
        ...costCenterData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      successRows++;
    } catch (error) {
      errors.push({
        row: i + 1,
        field: 'general',
        message: `Erro ao processar linha: ${error}`,
        value: data[i],
      });
    }
  }
  
  if (successRows > 0) {
    await batch.commit();
  }
  
  return {
    success: errors.length === 0,
    totalRows: data.length,
    successRows,
    errors,
  };
};

// Função principal de importação
export const importData = async (options: ImportOptions, userId: string): Promise<ImportResult> => {
  try {
    const { file, entityType, skipFirstRow = true, validateOnly = false } = options;
    
    // Ler arquivo CSV
    const csvData = await readCSVFile(file);
    
    if (csvData.length === 0) {
      throw new Error('Arquivo vazio');
    }
    
    // Obter template
    const template = importTemplates[entityType];
    if (!template) {
      throw new Error(`Tipo de entidade não suportado: ${entityType}`);
    }
    
    // Validar dados
    const validation = validateImportData(csvData, template, skipFirstRow);
    
    if (!validation.isValid || validateOnly) {
      return {
        success: validation.isValid,
        totalRows: validation.validData.length,
        successRows: 0,
        errors: validation.errors,
      };
    }
    
    // Importar dados baseado no tipo
    switch (entityType) {
      case 'vendors':
        return await importVendors(validation.validData, userId);
      case 'cost-centers':
        return await importCostCenters(validation.validData, userId);
      default:
        throw new Error(`Importação não implementada para: ${entityType}`);
    }
  } catch (error) {
    return {
      success: false,
      totalRows: 0,
      successRows: 0,
      errors: [{
        row: 0,
        field: 'file',
        message: `Erro ao processar arquivo: ${error}`,
        value: file.name,
      }],
    };
  }
};

// Função para gerar template CSV
export const generateImportTemplate = (entityType: string): string => {
  const template = importTemplates[entityType];
  if (!template) {
    throw new Error(`Template não encontrado para: ${entityType}`);
  }
  
  const headers = template.columns.map(col => col.label);
  const examples = template.columns.map(col => col.example || '');
  
  const csvContent = [
    headers.join(','),
    examples.join(','),
  ].join('\n');
  
  return csvContent;
};

// Função para download de template
export const downloadImportTemplate = (entityType: string) => {
  const csvContent = generateImportTemplate(entityType);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `template_${entityType}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Função para exportar dados
export const exportData = async (options: ExportOptions): Promise<void> => {
  try {
    const { entityType, format, filters = {}, columns, dateRange } = options;
    
    let collectionName = entityType;
    if (entityType === 'cost-centers') collectionName = 'cost-centers';
    
    // Construir query
    let dataQuery = query(collection(db, collectionName));
    
    // Aplicar filtros
    if (filters.status) {
      dataQuery = query(dataQuery, where('status', '==', filters.status));
    }
    
    if (dateRange) {
      dataQuery = query(
        dataQuery,
        where('createdAt', '>=', Timestamp.fromDate(dateRange.start)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.end))
      );
    }
    
    // Ordenar por data de criação
    dataQuery = query(dataQuery, orderBy('createdAt', 'desc'));
    
    // Buscar dados
    const snapshot = await getDocs(dataQuery);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));
    
    // Preparar dados para exportação
    let exportData: any[] = [];
    
    switch (entityType) {
      case 'vendors':
        exportData = data.map(vendor => ({
          'ID': vendor.id,
          'Nome': vendor.name,
          'CNPJ': vendor.taxId,
          'Email': vendor.email,
          'Telefone': vendor.phone,
          'Tags': vendor.tags?.join(', '),
          'Avaliação': vendor.rating,
          'Status': vendor.status,
          'Criado em': vendor.createdAt?.toLocaleDateString('pt-BR'),
        }));
        break;
        
      case 'cost-centers':
        exportData = data.map(cc => ({
          'ID': cc.id,
          'Código': cc.code,
          'Nome': cc.name,
          'Gerente': cc.ownerUserId,
          'Status': cc.status,
          'Criado em': cc.createdAt?.toLocaleDateString('pt-BR'),
        }));
        break;
        
      case 'requests':
        exportData = data.map(request => ({
          'ID': request.id,
          'Título': request.title,
          'Valor': request.amount,
          'Status': request.status,
          'Fornecedor': request.vendorId,
          'Centro de Custo': request.costCenterId,
          'Criado em': request.createdAt?.toLocaleDateString('pt-BR'),
        }));
        break;
    }
    
    // Filtrar colunas se especificado
    if (columns && columns.length > 0) {
      exportData = exportData.map(row => {
        const filteredRow: any = {};
        columns.forEach(col => {
          if (row.hasOwnProperty(col)) {
            filteredRow[col] = row[col];
          }
        });
        return filteredRow;
      });
    }
    
    // Gerar arquivo baseado no formato
    let content: string;
    let mimeType: string;
    let fileName: string;
    
    switch (format) {
      case 'csv':
        const headers = Object.keys(exportData[0] || {});
        const csvRows = [
          headers.join(','),
          ...exportData.map(row => 
            headers.map(header => {
              const value = row[header] || '';
              return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
            }).join(',')
          )
        ];
        content = csvRows.join('\n');
        mimeType = 'text/csv;charset=utf-8;';
        fileName = `${entityType}_export.csv`;
        break;
        
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json;charset=utf-8;';
        fileName = `${entityType}_export.json`;
        break;
        
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }
    
    // Download do arquivo
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    throw error;
  }
};

// Função para obter estatísticas de importação
export const getImportStats = async (entityType: string) => {
  try {
    let collectionName = entityType;
    if (entityType === 'cost-centers') collectionName = 'cost-centers';
    
    const snapshot = await getDocs(collection(db, collectionName));
    const total = snapshot.size;
    
    // Contar por status
    const byStatus: Record<string, number> = {};
    snapshot.docs.forEach(doc => {
      const status = doc.data().status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    
    // Contar criados nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentQuery = query(
      collection(db, collectionName),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const recentSnapshot = await getDocs(recentQuery);
    const recent = recentSnapshot.size;
    
    return {
      total,
      recent,
      byStatus,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
};

