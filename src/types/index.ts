// Tipos principais do sistema de aprovação de pagamentos

export type Role =
  | 'finance'
  | 'cost_center_owner'
  | 'user'
  | 'fpa'
  | 'director'
  | 'cfo'
  | 'ceo';

export type RequestStatus =
  | 'pending_accounting_monitor'
  | 'pending_validation'
  | 'returned'
  | 'pending_owner_approval'
  | 'pending_fpa_approval'
  | 'pending_director_approval'
  | 'pending_cfo_approval'
  | 'pending_ceo_approval'
  | 'pending_payment_approval'
  | 'pending_adjustment'
  | 'rejected'
  | 'cancelled'
  | 'paid';

export interface StatusHistoryEntry {
  status: RequestStatus;
  changedBy: string;
  changedByName: string;
  timestamp: Date;
  reason?: string;
}

export type StepStatus = 'pending' | 'approved' | 'rejected';

export type CategoryType = 'OPEX' | 'CAPEX';

export type CostType = 'CAPEX' | 'OPEX' | 'CPO';

export type PurchaseType = 'uso' | 'consumo' | 'insumos' | 'imobilizado';

export type DocumentType = 'invoice' | 'receipt' | 'contract' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  ccScope: string[]; // centros de custo atribuídos
  approvalLimit: number; // limite delegado
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  name: string;
  taxId: string; // CNPJ
  email?: string;
  phone?: string;
  tags: string[]; // ex: ['critico']
  rating?: number;
  blocked: boolean;
  contacts: Contact[];
  categories: string[];
  paymentTerms?: string;
  serviceType?: string;
  scope?: string;
  hasContract: boolean;
  contractUrl?: string;
  observations?: string;
  approvalNotes?: string;
  legalNotes?: string;
  contractRequesterId?: string;
  status: 'pending' | 'needsInfo' | 'rejected' | 'contract_review' | 'active' | 'inactive';
  compliance?: {
    sefazActive: boolean;
    serasaScore?: number;
    serasaBlocked?: boolean;
    checkedAt: Date;
  };
  status: 'pending' | 'needsInfo' | 'rejected' | 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  sapVendorId?: string;
  pipefyCardId?: string;
}

export interface Contact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  ownerUserId: string; // gerente responsável
  budgets: Record<string, number>; // YYYY-MM: amount
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId?: string; // subcategorias
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRequest {
  id: string;
  // Dados principais
  title: string;
  description: string;
  amount: number;
  currency: 'BRL';
  costCenterId: string;
  categoryId: string;
  vendorId: string;
  vendorName?: string;
  sapVendorId?: string;
  sapEmployeeId?: string;
  invoiceNumber?: string;
  requestNumber?: string;
  dueDate: Date;
  costType?: CostType;
  invoiceDate?: Date | null;
  competenceDate?: Date | null;
  isExtraordinary?: boolean;
  isRecurring?: boolean;
  extraordinaryReason?: string;
  purchaseType?: PurchaseType;
  serviceType?: string;
  scope?: string;
  justification?: string;
  inBudget?: boolean;

  // Dados fiscais
  fiscalStatus?: 'pending' | 'approved' | 'pending_adjustment';
  fiscalNotes?: string;
  taxInfo?: {
    expected: number;
    calculated: number;
    difference: number;
  };
  
  // Workflow
  status: RequestStatus;
  steps: ApprovalStep[];
  statusHistory: StatusHistoryEntry[];
  
  // Metadados
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Anexos e pagamento
  attachments?: string[];
  attachmentsCount: number;
  hasInvoice: boolean;
  paymentDate?: Date;
  paidAt?: Date | null;
  paymentReference?: string;
  paymentNotes?: string;
  paidBy?: string;
  paidByName?: string;
  paymentProtocol?: string;
  paymentReceiptUrl?: string;
  erpMiroId?: string;
  contractDocumentId?: string;
  contractStatus?: 'pending' | 'approved' | 'adjustments_requested';
  contractNotes?: string;
  contractRequesterId?: string;
}

export interface ApprovalStep {
  levelId: string;
  roleRequired: Role;
  assignees: string[];
  status: StepStatus;
  decidedBy?: string;
  decidedAt?: Date;
  comment?: string;
  slaDeadline: Date;
}

export interface Document {
  id: string;
  storagePath: string;
  requestId?: string;
  vendorId?: string;
  type: DocumentType;
  meta: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    invoiceNumber?: string;
    issueDate?: Date;
  };
  uploadedBy: string;
  uploadedAt: Date;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  ipAddress?: string;
  timestamp: Date;
}

export interface ApprovalMatrix {
  currency: 'BRL';
  levels: ApprovalLevel[];
  overrides: Override[];
  delegations: Delegation[];
}

export interface ApprovalLevel {
  id: string;
  name: string;
  appliesWhen: {
    amountLt?: number;
    amountGte?: number;
    costCenterInUserScope?: boolean;
  };
  approvers: {
    role: Role;
    minRole?: string;
  };
  slaHours: number;
}

export interface Override {
  category?: string;
  vendorTag?: string;
  enforceExtraLevelRole: Role;
}

export interface Delegation {
  fromRole: Role;
  toUserIds: string[];
  maxAmount: number;
  expiresAt?: Date;
}

// Tipos para formulários
export interface CreateRequestForm {
  title: string;
  description: string;
  amount: number;
  costCenterId: string;
  categoryId: string;
  vendorId: string;
  vendorName?: string;
  invoiceNumber?: string;
  costType?: CostType;
  invoiceDate?: string;
  competenceDate?: string;
  dueDate: string;
  isExtraordinary?: boolean;
  isRecurring?: boolean;
  extraordinaryReason?: string;
  serviceType?: string;
  scope?: string;
  justification?: string;
}

export interface CreateVendorForm {
  name: string;
  taxId: string;
  email?: string;
  phone?: string;
  serviceType?: string;
  scope?: string;
  tags: string[];
}

export interface CreateCostCenterForm {
  name: string;
  managerId: string;
}

export interface CreateCategoryForm {
  name: string;
  type: CategoryType;
  parentId?: string;
}

// Tipos para KPIs e Dashboard
export interface KPICard {
  title: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  format: 'currency' | 'number' | 'percentage';
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Tipos para filtros
export interface RequestFilters {
  status?: RequestStatus[];
  costCenterIds?: string[];
  categoryIds?: string[];
  vendorIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

// Tipos para paginação
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para notificações
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// Tipos para importação/exportação
export interface ImportResult {
  success: boolean;
  totalRows: number;
  successRows: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ExportParams {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: RequestFilters;
  columns?: string[];
}


// Política de aprovação
export interface ApprovalPolicy {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  costCenterId?: string;
  minAmount: number;
  maxAmount: number;
  approvers: Array<{
    level: number;
    userId: string;
    userName: string;
    role: string;
    isRequired: boolean;
    canSkip: boolean;
  }>;
  conditions: {
    requiresAllApprovers: boolean;
    allowParallelApproval: boolean;
    escalationTimeHours: number;
    requiresDocuments: boolean;
    allowSelfApproval: boolean;
  };
  priority: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para workflow de aprovação
export interface ApprovalWorkflow {
  id: string;
  requestId: string;
  policyId: string;
  currentLevel: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  history: ApprovalHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalHistoryEntry {
  level: number;
  approverId: string;
  approverName: string;
  action: 'approved' | 'rejected' | 'escalated' | 'delegated';
  comments?: string;
  timestamp: Date;
  delegatedTo?: string;
  escalatedReason?: string;
}

// Tipos para delegação de aprovação
export interface ApprovalDelegation {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  maxAmount?: number;
  categoryIds?: string[];
  costCenterIds?: string[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para escalação
export interface ApprovalEscalation {
  id: string;
  requestId: string;
  originalApproverId: string;
  escalatedToId: string;
  reason: 'timeout' | 'manual' | 'unavailable';
  escalatedAt: Date;
  resolvedAt?: Date;
  resolution?: 'approved' | 'rejected' | 'returned';
}


// Tipos para orçamentos e forecast
export type BudgetPeriod = 'monthly' | 'quarterly' | 'annual';

export interface Budget {
  id: string;
  name: string;
  description?: string;
  costCenterId: string;
  categoryId?: string;
  year: number;
  period: BudgetPeriod;
  plannedAmount: number;
  spentAmount: number;
  committedAmount: number;
  availableAmount: number;
  currency: string;
  status: 'draft' | 'approved' | 'active' | 'closed';
  breakdown?: {
    month: number;
    amount: number;
  }[];
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  activatedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForecastData {
  id: string;
  name: string;
  description?: string;
  costCenterId: string;
  categoryId?: string;
  year: number;
  projections: {
    month: number;
    projected: number;
    confidence: number; // 0-100%
  }[];
  methodology: string;
  assumptions: string[];
  totalProjected: number;
  averageConfidence: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetVariance {
  budgetId: string;
  period: string;
  planned: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'under' | 'over' | 'on-track';
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'overspend' | 'underspend' | 'forecast_variance' | 'approval_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  triggeredAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}



// Tipos para sistema de documentos
export interface DocumentFile {
  id: string;
  name: string;
  originalName: string;
  fileName: string;
  storagePath: string;
  downloadURL: string;
  fileType: string;
  fileSize: number;
  category: string;
  description?: string;
  tags: string[];
  relatedEntityType?: 'request' | 'vendor' | 'cost-center' | 'budget' | null;
  relatedEntityId?: string | null;
  isPublic: boolean;
  uploadedBy: string;
  uploadedAt: Date;
  updatedAt: Date;
  updatedBy?: string;
  expiresAt?: Date | null;
  downloadCount: number;
  lastDownloadAt?: Date;
  version: number;
  isActive: boolean;
  metadata?: {
    contentType?: string;
    size?: number;
    timeCreated?: string;
    updated?: string;
  };
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  storagePath: string;
  downloadURL: string;
  fileSize: number;
  fileType: string;
  comment?: string;
  createdBy: string;
  createdAt: Date;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface DocumentSearchFilters {
  category?: string;
  tags?: string[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  uploadedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  fileType?: string;
  isPublic?: boolean;
  search?: string;
}

export interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  totalDownloads: number;
  recentDocuments: number;
  byCategory: Record<string, number>;
  byFileType: Record<string, number>;
  averageSize: number;
  averageDownloads: number;
}


export interface Quotation {
  id: string;
  requestId: string;
  documentId: string;
  createdBy: string;
  createdAt: Date;
}


export interface PurchaseOrderItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  requestId: string;
  vendorId: string;
  items: PurchaseOrderItem[];
  total: number;
  status: 'generated' | 'sent' | 'reconciled';
  createdAt: Date;
  sentAt?: Date;
  reconciledAt?: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  key: string;
  items: InvoiceItem[];
  total: number;
}

export interface Discrepancy {
  type: 'missing_item' | 'quantity_mismatch' | 'price_mismatch' | 'total_mismatch';
  itemDescription?: string;
  expected?: number;
  found?: number;
}
