// Funções utilitárias do sistema
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LOCALE, CURRENCY, FORMAT } from '../constants';

// Formatação de moeda
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat(LOCALE, FORMAT.CURRENCY_OPTIONS).format(value);
};

// Formatação de número
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat(LOCALE, FORMAT.NUMBER_OPTIONS).format(value);
};

// Formatação de porcentagem
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat(LOCALE, FORMAT.PERCENTAGE_OPTIONS).format(value);
};

// Formatação de data
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, FORMAT.DATE, { locale: ptBR });
};

// Formatação de data e hora
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, FORMAT.DATETIME, { locale: ptBR });
};

// Formatação de hora
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, FORMAT.TIME, { locale: ptBR });
};

// Validação de CNPJ
export const validateCNPJ = (cnpj: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let weight = 5;
  
  // Primeiro dígito verificador
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCNPJ[12]) !== digit1) return false;
  
  // Segundo dígito verificador
  sum = 0;
  weight = 6;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanCNPJ[13]) === digit2;
};

// Formatação de CNPJ
export const formatCNPJ = (cnpj: string): string => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

// Validação de email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Formatação de telefone
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

// Geração de ID único
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Capitalização de texto
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Truncar texto
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Remover acentos
export const removeAccents = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Busca fuzzy simples
export const fuzzySearch = (query: string, text: string): boolean => {
  const normalizedQuery = removeAccents(query.toLowerCase());
  const normalizedText = removeAccents(text.toLowerCase());
  return normalizedText.includes(normalizedQuery);
};

// Ordenação de array por propriedade
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// Agrupamento de array por propriedade
export const groupBy = <T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

// Cálculo de diferença em dias
export const daysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Verificação se data está vencida
export const isOverdue = (date: Date): boolean => {
  return date < new Date();
};

// Cálculo de aging (dias desde uma data)
export const calculateAging = (date: Date): number => {
  return daysDifference(new Date(), date);
};

// Formatação de tamanho de arquivo
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validação de extensão de arquivo
export const isValidFileExtension = (fileName: string, allowedExtensions: string[]): boolean => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return allowedExtensions.includes(extension);
};

// Geração de cores para gráficos
export const generateColors = (count: number): string[] => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  
  return result;
};

// Cálculo de porcentagem
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

// Cálculo de variação percentual
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Formatação de período (YYYY-MM)
export const formatPeriod = (period: string): string => {
  const [year, month] = period.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

// Geração de período atual (YYYY-MM)
export const getCurrentPeriod = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Validação de período
export const isValidPeriod = (period: string): boolean => {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(period)) return false;
  
  const [year, month] = period.split('-').map(Number);
  return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
};

// Cópia para clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error);
    return false;
  }
};

// Download de arquivo
export const downloadFile = (data: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};


// Formatação de tempo relativo
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'agora mesmo';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} dia${days > 1 ? 's' : ''} atrás`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} mês${months > 1 ? 'es' : ''} atrás`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} ano${years > 1 ? 's' : ''} atrás`;
  }
};

