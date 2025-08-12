// Constantes do sistema de aprovação de pagamentos

// Configurações regionais
export const LOCALE = 'pt-BR';
export const TIMEZONE = 'America/Sao_Paulo';
export const CURRENCY = 'BRL';

// Papéis do sistema
export const ROLES = {
  USER: 'user',
  COST_CENTER_OWNER: 'cost_center_owner',
  FINANCE: 'finance'
} as const;

// Status das solicitações
export const REQUEST_STATUS = {
  PENDING_OWNER_APPROVAL: 'pending_owner_approval',
  PENDING_PAYMENT_APPROVAL: 'pending_payment_approval',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  PAID: 'paid'
} as const;

// Status das etapas de aprovação
export const STEP_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

// Tipos de categoria
export const CATEGORY_TYPES = {
  OPEX: 'OPEX',
  CAPEX: 'CAPEX'
} as const;

// Tipos de documento
export const DOCUMENT_TYPES = {
  INVOICE: 'invoice',
  RECEIPT: 'receipt',
  CONTRACT: 'contract',
  OTHER: 'other'
} as const;

// Labels para exibição
export const ROLE_LABELS = {
  [ROLES.USER]: 'Usuário',
  [ROLES.COST_CENTER_OWNER]: 'Dono de Centro de Custos',
  [ROLES.FINANCE]: 'Financeiro'
} as const;

export const STATUS_LABELS = {
  [REQUEST_STATUS.PENDING_OWNER_APPROVAL]: 'Ag. aprovação do owner',
  [REQUEST_STATUS.PENDING_PAYMENT_APPROVAL]: 'Ag. aprovação de pagamento',
  [REQUEST_STATUS.REJECTED]: 'Rejeitada',
  [REQUEST_STATUS.CANCELLED]: 'Cancelada',
  [REQUEST_STATUS.PAID]: 'Pagamento realizado'
} as const;

export const STEP_STATUS_LABELS = {
  [STEP_STATUS.PENDING]: 'Pendente',
  [STEP_STATUS.APPROVED]: 'Aprovada',
  [STEP_STATUS.REJECTED]: 'Rejeitada'
} as const;

export const CATEGORY_TYPE_LABELS = {
  [CATEGORY_TYPES.OPEX]: 'OPEX (Operacional)',
  [CATEGORY_TYPES.CAPEX]: 'CAPEX (Capital)'
} as const;

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.INVOICE]: 'Nota Fiscal',
  [DOCUMENT_TYPES.RECEIPT]: 'Recibo',
  [DOCUMENT_TYPES.CONTRACT]: 'Contrato',
  [DOCUMENT_TYPES.OTHER]: 'Outro'
} as const;

// Cores para status
export const STATUS_COLORS = {
  [REQUEST_STATUS.PENDING_OWNER_APPROVAL]: 'yellow',
  [REQUEST_STATUS.PENDING_PAYMENT_APPROVAL]: 'blue',
  [REQUEST_STATUS.REJECTED]: 'red',
  [REQUEST_STATUS.CANCELLED]: 'gray',
  [REQUEST_STATUS.PAID]: 'green'
} as const;

export const STEP_STATUS_COLORS = {
  [STEP_STATUS.PENDING]: 'yellow',
  [STEP_STATUS.APPROVED]: 'green',
  [STEP_STATUS.REJECTED]: 'red'
} as const;

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const;

// Configurações de upload
export const UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.xls', '.xlsx', '.csv']
} as const;

// Configurações de validação
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_COMMENT_LENGTH: 500,
  CNPJ_LENGTH: 14,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999999.99
} as const;

// Configurações de SLA (em horas)
export const SLA = {
  DEFAULT_APPROVAL_HOURS: 24,
  ESCALATION_HOURS: 48,
  REMINDER_HOURS: 12
} as const;

// Configurações de orçamento
export const BUDGET = {
  WARNING_THRESHOLD: 0.8, // 80%
  CRITICAL_THRESHOLD: 1.0, // 100%
  FISCAL_YEAR_START_MONTH: 1 // Janeiro
} as const;

// Configurações de notificação
export const NOTIFICATION = {
  TYPES: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  },
  AUTO_DISMISS_DELAY: 5000 // 5 segundos
} as const;

// Configurações de exportação
export const EXPORT = {
  FORMATS: {
    CSV: 'csv',
    XLSX: 'xlsx',
    PDF: 'pdf'
  },
  MAX_ROWS: 10000
} as const;

// Configurações de importação
export const IMPORT = {
  MAX_ROWS: 1000,
  BATCH_SIZE: 100,
  REQUIRED_COLUMNS: {
    VENDORS: ['name', 'taxId'],
    COST_CENTERS: ['code', 'name', 'ownerEmail'],
    BUDGETS: ['ccCode', 'category', 'period', 'amount'],
    REQUESTS: ['title', 'description', 'amount', 'costCenterCode', 'category', 'vendorTaxId', 'dueDate']
  }
} as const;

// Configurações de cache
export const CACHE = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutos
  CACHE_TIME: 10 * 60 * 1000, // 10 minutos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 segundo
} as const;

// Rotas da aplicação
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  REQUESTS: '/requests',
  NEW_REQUEST: '/requests/new',
  REQUEST_DETAIL: '/requests/:id',
  VENDORS: '/vendors',
  VENDOR_APPROVALS: '/vendor-approvals',
  COST_CENTERS: '/cost-centers',
  CATEGORIES: '/categories',
  BUDGETS: '/budgets',
  POLICIES: '/policies',
  DOCUMENTS: '/documents',
  REPORTS: '/reports',
  ADMIN: '/admin',
  AUDIT: '/admin/audit',
  PROFILE: '/profile',
  SETTINGS: '/settings'
} as const;

// Configurações de formatação
export const FORMAT = {
  DATE: 'dd/MM/yyyy',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm',
  CURRENCY_OPTIONS: {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  },
  NUMBER_OPTIONS: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  },
  PERCENTAGE_OPTIONS: {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }
} as const;

