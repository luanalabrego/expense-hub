// Serviços para sistema de auditoria
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc,
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { AuditLog } from '../types';

// Tipos para auditoria
export interface AuditLogData {
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  entityName?: string;
  before?: any;
  after?: any;
  changes?: Record<string, { from: any; to: any }>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface AuditFilters {
  actorId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  ipAddress?: string;
}

export interface AuditListOptions extends AuditFilters {
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'action' | 'entity';
  sortOrder?: 'asc' | 'desc';
}

// Ações de auditoria padronizadas
export const AUDIT_ACTIONS = {
  // Autenticação
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_RESET: 'password_reset',

  // CRUD genérico
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  BULK_CREATE: 'bulk_create',
  BULK_UPDATE: 'bulk_update',
  BULK_DELETE: 'bulk_delete',

  // Solicitações
  REQUEST_SUBMIT: 'request_submit',
  REQUEST_APPROVE: 'request_approve',
  REQUEST_REJECT: 'request_reject',
  REQUEST_CANCEL: 'request_cancel',
  REQUEST_PAY: 'request_pay',

  // Aprovações
  APPROVAL_DELEGATE: 'approval_delegate',
  APPROVAL_ESCALATE: 'approval_escalate',
  APPROVAL_POLICY_APPLY: 'approval_policy_apply',

  // Orçamentos
  BUDGET_COMMIT: 'budget_commit',
  BUDGET_SPEND: 'budget_spend',
  BUDGET_RELEASE: 'budget_release',
  BUDGET_APPROVE: 'budget_approve',
  BUDGET_ACTIVATE: 'budget_activate',

  // Documentos
  DOCUMENT_UPLOAD: 'document_upload',
  DOCUMENT_DOWNLOAD: 'document_download',
  DOCUMENT_VERSION: 'document_version',

  // Importação/Exportação
  DATA_IMPORT: 'data_import',
  DATA_EXPORT: 'data_export',
  TEMPLATE_DOWNLOAD: 'template_download',

  // Sistema
  SYSTEM_CONFIG: 'system_config',
  PERMISSION_GRANT: 'permission_grant',
  PERMISSION_REVOKE: 'permission_revoke',
} as const;

// Entidades auditáveis
export const AUDIT_ENTITIES = {
  USER: 'user',
  VENDOR: 'vendor',
  COST_CENTER: 'cost_center',
  CATEGORY: 'category',
  REQUEST: 'request',
  APPROVAL_POLICY: 'approval_policy',
  BUDGET: 'budget',
  DOCUMENT: 'document',
  NOTIFICATION: 'notification',
  SYSTEM: 'system',
} as const;

// Criar log de auditoria
export const createAuditLog = async (auditData: AuditLogData): Promise<AuditLog> => {
  try {
    const data = {
      ...auditData,
      timestamp: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'audit-logs'), data);
    
    return {
      id: docRef.id,
      ...data,
      timestamp: data.timestamp.toDate(),
    } as AuditLog;
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
    throw error;
  }
};

// Obter logs de auditoria com filtros
export const getAuditLogs = async (options: AuditListOptions = {}) => {
  try {
    const {
      page = 1,
      limit: pageLimit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      actorId,
      action,
      entity,
      entityId,
      dateFrom,
      dateTo,
      ipAddress
    } = options;

    let auditQuery = query(collection(db, 'audit-logs'));

    // Aplicar filtros
    if (actorId) {
      auditQuery = query(auditQuery, where('actorId', '==', actorId));
    }

    if (action) {
      auditQuery = query(auditQuery, where('action', '==', action));
    }

    if (entity) {
      auditQuery = query(auditQuery, where('entity', '==', entity));
    }

    if (entityId) {
      auditQuery = query(auditQuery, where('entityId', '==', entityId));
    }

    if (dateFrom) {
      auditQuery = query(auditQuery, where('timestamp', '>=', Timestamp.fromDate(dateFrom)));
    }

    if (dateTo) {
      auditQuery = query(auditQuery, where('timestamp', '<=', Timestamp.fromDate(dateTo)));
    }

    if (ipAddress) {
      auditQuery = query(auditQuery, where('ipAddress', '==', ipAddress));
    }

    // Ordenação
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    auditQuery = query(auditQuery, orderBy(sortBy, orderDirection));

    // Paginação
    if (page > 1) {
      const offset = (page - 1) * pageLimit;
      const offsetQuery = query(auditQuery, limit(offset));
      const offsetSnapshot = await getDocs(offsetQuery);
      const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      if (lastDoc) {
        auditQuery = query(auditQuery, startAfter(lastDoc));
      }
    }

    auditQuery = query(auditQuery, limit(pageLimit));

    const snapshot = await getDocs(auditQuery);
    const auditLogs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as AuditLog[];

    // Contar total (aproximado)
    const totalQuery = query(collection(db, 'audit-logs'));
    const totalSnapshot = await getDocs(totalQuery);
    const total = totalSnapshot.size;

    return {
      data: auditLogs,
      total,
      page,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit),
    };
  } catch (error) {
    console.error('Erro ao obter logs de auditoria:', error);
    throw error;
  }
};

// Obter log de auditoria por ID
export const getAuditLog = async (id: string): Promise<AuditLog> => {
  try {
    const docRef = doc(db, 'audit-logs', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Log de auditoria não encontrado');
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
    } as AuditLog;
  } catch (error) {
    console.error('Erro ao obter log de auditoria:', error);
    throw error;
  }
};

// Obter logs de auditoria por entidade
export const getAuditLogsByEntity = async (
  entity: string,
  entityId: string,
  limit: number = 20
): Promise<AuditLog[]> => {
  try {
    const auditQuery = query(
      collection(db, 'audit-logs'),
      where('entity', '==', entity),
      where('entityId', '==', entityId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(auditQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as AuditLog[];
  } catch (error) {
    console.error('Erro ao obter logs por entidade:', error);
    throw error;
  }
};

// Obter logs de auditoria por usuário
export const getAuditLogsByUser = async (
  userId: string,
  limit: number = 50
): Promise<AuditLog[]> => {
  try {
    const auditQuery = query(
      collection(db, 'audit-logs'),
      where('actorId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(auditQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as AuditLog[];
  } catch (error) {
    console.error('Erro ao obter logs por usuário:', error);
    throw error;
  }
};

// Funções específicas para diferentes tipos de auditoria

// Auditar login
export const auditLogin = async (
  userId: string,
  userName: string,
  userEmail: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  await createAuditLog({
    actorId: userId,
    actorName: userName,
    actorEmail: userEmail,
    action: success ? AUDIT_ACTIONS.LOGIN : AUDIT_ACTIONS.LOGIN_FAILED,
    entity: AUDIT_ENTITIES.USER,
    entityId: userId,
    entityName: userName,
    ipAddress,
    userAgent,
    metadata: {
      success,
      loginTime: new Date().toISOString(),
    },
  });
};

// Auditar logout
export const auditLogout = async (
  userId: string,
  userName: string,
  userEmail: string,
  sessionDuration?: number,
  ipAddress?: string
): Promise<void> => {
  await createAuditLog({
    actorId: userId,
    actorName: userName,
    actorEmail: userEmail,
    action: AUDIT_ACTIONS.LOGOUT,
    entity: AUDIT_ENTITIES.USER,
    entityId: userId,
    entityName: userName,
    ipAddress,
    metadata: {
      sessionDuration,
      logoutTime: new Date().toISOString(),
    },
  });
};

// Auditar criação de entidade
export const auditCreate = async (
  actorId: string,
  actorName: string,
  actorEmail: string,
  entity: string,
  entityId: string,
  entityName: string,
  data: any,
  ipAddress?: string
): Promise<void> => {
  await createAuditLog({
    actorId,
    actorName,
    actorEmail,
    action: AUDIT_ACTIONS.CREATE,
    entity,
    entityId,
    entityName,
    after: data,
    ipAddress,
  });
};

// Auditar atualização de entidade
export const auditUpdate = async (
  actorId: string,
  actorName: string,
  actorEmail: string,
  entity: string,
  entityId: string,
  entityName: string,
  before: any,
  after: any,
  ipAddress?: string
): Promise<void> => {
  // Calcular mudanças específicas
  const changes: Record<string, { from: any; to: any }> = {};
  
  Object.keys(after).forEach(key => {
    if (before[key] !== after[key]) {
      changes[key] = {
        from: before[key],
        to: after[key],
      };
    }
  });

  await createAuditLog({
    actorId,
    actorName,
    actorEmail,
    action: AUDIT_ACTIONS.UPDATE,
    entity,
    entityId,
    entityName,
    before,
    after,
    changes,
    ipAddress,
  });
};

// Auditar exclusão de entidade
export const auditDelete = async (
  actorId: string,
  actorName: string,
  actorEmail: string,
  entity: string,
  entityId: string,
  entityName: string,
  data: any,
  ipAddress?: string
): Promise<void> => {
  await createAuditLog({
    actorId,
    actorName,
    actorEmail,
    action: AUDIT_ACTIONS.DELETE,
    entity,
    entityId,
    entityName,
    before: data,
    ipAddress,
  });
};

// Auditar aprovação de solicitação
export const auditRequestApproval = async (
  actorId: string,
  actorName: string,
  actorEmail: string,
  requestId: string,
  requestTitle: string,
  action: 'approve' | 'reject',
  comment?: string,
  ipAddress?: string
): Promise<void> => {
  await createAuditLog({
    actorId,
    actorName,
    actorEmail,
    action: action === 'approve' ? AUDIT_ACTIONS.REQUEST_APPROVE : AUDIT_ACTIONS.REQUEST_REJECT,
    entity: AUDIT_ENTITIES.REQUEST,
    entityId: requestId,
    entityName: requestTitle,
    ipAddress,
    metadata: {
      comment,
      approvalTime: new Date().toISOString(),
    },
  });
};

// Auditar operação orçamentária
export const auditBudgetOperation = async (
  actorId: string,
  actorName: string,
  actorEmail: string,
  budgetId: string,
  budgetName: string,
  operation: 'commit' | 'spend' | 'release',
  amount: number,
  relatedRequestId?: string,
  ipAddress?: string
): Promise<void> => {
  const actionMap = {
    commit: AUDIT_ACTIONS.BUDGET_COMMIT,
    spend: AUDIT_ACTIONS.BUDGET_SPEND,
    release: AUDIT_ACTIONS.BUDGET_RELEASE,
  };

  await createAuditLog({
    actorId,
    actorName,
    actorEmail,
    action: actionMap[operation],
    entity: AUDIT_ENTITIES.BUDGET,
    entityId: budgetId,
    entityName: budgetName,
    ipAddress,
    metadata: {
      amount,
      relatedRequestId,
      operationTime: new Date().toISOString(),
    },
  });
};

// Auditar upload de documento
export const auditDocumentUpload = async (
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
): Promise<void> => {
  await createAuditLog({
    actorId,
    actorName,
    actorEmail,
    action: AUDIT_ACTIONS.DOCUMENT_UPLOAD,
    entity: AUDIT_ENTITIES.DOCUMENT,
    entityId: documentId,
    entityName: documentName,
    ipAddress,
    metadata: {
      fileSize,
      fileType,
      relatedEntityType,
      relatedEntityId,
      uploadTime: new Date().toISOString(),
    },
  });
};

// Auditar download de documento
export const auditDocumentDownload = async (
  actorId: string,
  actorName: string,
  actorEmail: string,
  documentId: string,
  documentName: string,
  ipAddress?: string
): Promise<void> => {
  await createAuditLog({
    actorId,
    actorName,
    actorEmail,
    action: AUDIT_ACTIONS.DOCUMENT_DOWNLOAD,
    entity: AUDIT_ENTITIES.DOCUMENT,
    entityId: documentId,
    entityName: documentName,
    ipAddress,
    metadata: {
      downloadTime: new Date().toISOString(),
    },
  });
};

// Auditar importação de dados
export const auditDataImport = async (
  actorId: string,
  actorName: string,
  actorEmail: string,
  entityType: string,
  fileName: string,
  totalRows: number,
  successRows: number,
  errorRows: number,
  ipAddress?: string
): Promise<void> => {
  await createAuditLog({
    actorId,
    actorName,
    actorEmail,
    action: AUDIT_ACTIONS.DATA_IMPORT,
    entity: entityType,
    entityId: `import_${Date.now()}`,
    entityName: fileName,
    ipAddress,
    metadata: {
      fileName,
      totalRows,
      successRows,
      errorRows,
      successRate: totalRows > 0 ? (successRows / totalRows) * 100 : 0,
      importTime: new Date().toISOString(),
    },
  });
};

// Auditar exportação de dados
export const auditDataExport = async (
  actorId: string,
  actorName: string,
  actorEmail: string,
  entityType: string,
  format: string,
  recordCount: number,
  filters?: any,
  ipAddress?: string
): Promise<void> => {
  await createAuditLog({
    actorId,
    actorName,
    actorEmail,
    action: AUDIT_ACTIONS.DATA_EXPORT,
    entity: entityType,
    entityId: `export_${Date.now()}`,
    entityName: `${entityType}_export.${format}`,
    ipAddress,
    metadata: {
      format,
      recordCount,
      filters,
      exportTime: new Date().toISOString(),
    },
  });
};

// Obter estatísticas de auditoria
export const getAuditStats = async (filters: AuditFilters = {}) => {
  try {
    let auditQuery = query(collection(db, 'audit-logs'));

    // Aplicar filtros básicos
    if (filters.actorId) {
      auditQuery = query(auditQuery, where('actorId', '==', filters.actorId));
    }
    if (filters.entity) {
      auditQuery = query(auditQuery, where('entity', '==', filters.entity));
    }
    if (filters.dateFrom) {
      auditQuery = query(auditQuery, where('timestamp', '>=', Timestamp.fromDate(filters.dateFrom)));
    }
    if (filters.dateTo) {
      auditQuery = query(auditQuery, where('timestamp', '<=', Timestamp.fromDate(filters.dateTo)));
    }

    const snapshot = await getDocs(auditQuery);
    const logs = snapshot.docs.map(doc => doc.data());

    const total = logs.length;

    // Agrupar por ação
    const byAction = logs.reduce((acc, log) => {
      const action = log.action || 'unknown';
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por entidade
    const byEntity = logs.reduce((acc, log) => {
      const entity = log.entity || 'unknown';
      acc[entity] = (acc[entity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por usuário
    const byUser = logs.reduce((acc, log) => {
      const user = log.actorName || 'unknown';
      acc[user] = (acc[user] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Logs recentes (últimas 24 horas)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const recent = logs.filter(log => 
      log.timestamp && new Date(log.timestamp.toDate()) > twentyFourHoursAgo
    ).length;

    // Top 5 ações mais comuns
    const topActions = Object.entries(byAction)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    // Top 5 usuários mais ativos
    const topUsers = Object.entries(byUser)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([user, count]) => ({ user, count }));

    return {
      total,
      recent,
      byAction,
      byEntity,
      byUser,
      topActions,
      topUsers,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de auditoria:', error);
    throw error;
  }
};

// Obter atividade recente de um usuário
export const getUserRecentActivity = async (
  userId: string,
  limit: number = 10
): Promise<AuditLog[]> => {
  try {
    const auditQuery = query(
      collection(db, 'audit-logs'),
      where('actorId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(auditQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as AuditLog[];
  } catch (error) {
    console.error('Erro ao obter atividade recente do usuário:', error);
    throw error;
  }
};

// Obter timeline de uma entidade
export const getEntityTimeline = async (
  entity: string,
  entityId: string,
  limit: number = 20
): Promise<AuditLog[]> => {
  try {
    const auditQuery = query(
      collection(db, 'audit-logs'),
      where('entity', '==', entity),
      where('entityId', '==', entityId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );

    const snapshot = await getDocs(auditQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as AuditLog[];
  } catch (error) {
    console.error('Erro ao obter timeline da entidade:', error);
    throw error;
  }
};

