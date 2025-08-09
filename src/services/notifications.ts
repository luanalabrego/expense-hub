// Serviços para sistema de notificações
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import type { Notification } from '../types';

// Tipos para notificações
export interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error' | 'approval_request' | 'approval_response' | 'budget_alert' | 'system';
  title: string;
  message: string;
  recipientId: string;
  senderId?: string;
  relatedEntityType?: 'request' | 'vendor' | 'cost-center' | 'budget' | 'user';
  relatedEntityId?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  recipientId?: string;
  type?: string;
  priority?: string;
  read?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface NotificationListOptions extends NotificationFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priority' | 'type';
  sortOrder?: 'asc' | 'desc';
}

// Criar notificação
export const createNotification = async (
  notificationData: NotificationData
): Promise<Notification> => {
  try {
    const data = {
      ...notificationData,
      read: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'notifications'), data);
    
    return {
      id: docRef.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt).toDate() : undefined,
    } as Notification;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};

// Obter notificações com filtros
export const getNotifications = async (options: NotificationListOptions = {}) => {
  try {
    const {
      page = 1,
      limit: pageLimit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      recipientId,
      type,
      priority,
      read,
      relatedEntityType,
      relatedEntityId,
      dateFrom,
      dateTo
    } = options;

    let notificationsQuery = query(collection(db, 'notifications'));

    // Aplicar filtros
    if (recipientId) {
      notificationsQuery = query(notificationsQuery, where('recipientId', '==', recipientId));
    }

    if (type) {
      notificationsQuery = query(notificationsQuery, where('type', '==', type));
    }

    if (priority) {
      notificationsQuery = query(notificationsQuery, where('priority', '==', priority));
    }

    if (typeof read === 'boolean') {
      notificationsQuery = query(notificationsQuery, where('read', '==', read));
    }

    if (relatedEntityType) {
      notificationsQuery = query(notificationsQuery, where('relatedEntityType', '==', relatedEntityType));
    }

    if (relatedEntityId) {
      notificationsQuery = query(notificationsQuery, where('relatedEntityId', '==', relatedEntityId));
    }

    if (dateFrom) {
      notificationsQuery = query(notificationsQuery, where('createdAt', '>=', Timestamp.fromDate(dateFrom)));
    }

    if (dateTo) {
      notificationsQuery = query(notificationsQuery, where('createdAt', '<=', Timestamp.fromDate(dateTo)));
    }

    // Ordenação
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    notificationsQuery = query(notificationsQuery, orderBy(sortBy, orderDirection));

    // Paginação
    if (page > 1) {
      const offset = (page - 1) * pageLimit;
      const offsetQuery = query(notificationsQuery, limit(offset));
      const offsetSnapshot = await getDocs(offsetQuery);
      const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      if (lastDoc) {
        notificationsQuery = query(notificationsQuery, startAfter(lastDoc));
      }
    }

    notificationsQuery = query(notificationsQuery, limit(pageLimit));

    const snapshot = await getDocs(notificationsQuery);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate() || null,
    })) as Notification[];

    // Contar total
    const totalQuery = query(
      collection(db, 'notifications'),
      ...(recipientId ? [where('recipientId', '==', recipientId)] : [])
    );
    const totalSnapshot = await getDocs(totalQuery);
    const total = totalSnapshot.size;

    return {
      data: notifications,
      total,
      page,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit),
    };
  } catch (error) {
    console.error('Erro ao obter notificações:', error);
    throw error;
  }
};

// Obter notificação por ID
export const getNotification = async (id: string): Promise<Notification> => {
  try {
    const docRef = doc(db, 'notifications', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Notificação não encontrada');
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || null,
    } as Notification;
  } catch (error) {
    console.error('Erro ao obter notificação:', error);
    throw error;
  }
};

// Marcar notificação como lida
export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, {
      read: true,
      readAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
};

// Marcar múltiplas notificações como lidas
export const markMultipleNotificationsAsRead = async (ids: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    ids.forEach(id => {
      const docRef = doc(db, 'notifications', id);
      batch.update(docRef, {
        read: true,
        readAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    throw error;
  }
};

// Marcar todas as notificações de um usuário como lidas
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(unreadQuery);
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    throw error;
  }
};

// Deletar notificação
export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'notifications', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    throw error;
  }
};

// Obter contagem de notificações não lidas
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  try {
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(unreadQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Erro ao obter contagem de notificações não lidas:', error);
    return 0;
  }
};

// Listener em tempo real para notificações de um usuário
export const subscribeToUserNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
  options: { limit?: number; unreadOnly?: boolean } = {}
): Unsubscribe => {
  const { limit: queryLimit = 50, unreadOnly = false } = options;

  let notificationsQuery = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId)
  );

  if (unreadOnly) {
    notificationsQuery = query(notificationsQuery, where('read', '==', false));
  }

  notificationsQuery = query(
    notificationsQuery,
    orderBy('createdAt', 'desc'),
    limit(queryLimit)
  );

  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate() || null,
    })) as Notification[];

    callback(notifications);
  });
};

// Funções específicas para tipos de notificação

// Notificação de solicitação de aprovação
export const createApprovalRequestNotification = async (
  requestId: string,
  requestTitle: string,
  requestAmount: number,
  approverId: string,
  requesterId: string
): Promise<void> => {
  await createNotification({
    type: 'approval_request',
    title: 'Nova solicitação para aprovação',
    message: `Solicitação "${requestTitle}" no valor de R$ ${requestAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} aguarda sua aprovação.`,
    recipientId: approverId,
    senderId: requesterId,
    relatedEntityType: 'request',
    relatedEntityId: requestId,
    actionUrl: `/requests/${requestId}`,
    priority: requestAmount > 10000 ? 'high' : 'medium',
  });
};

// Notificação de resposta de aprovação
export const createApprovalResponseNotification = async (
  requestId: string,
  requestTitle: string,
  action: 'approved' | 'rejected',
  requesterId: string,
  approverId: string,
  comment?: string
): Promise<void> => {
  const actionText = action === 'approved' ? 'aprovada' : 'rejeitada';
  const message = `Sua solicitação "${requestTitle}" foi ${actionText}.${comment ? ` Comentário: ${comment}` : ''}`;

  await createNotification({
    type: 'approval_response',
    title: `Solicitação ${actionText}`,
    message,
    recipientId: requesterId,
    senderId: approverId,
    relatedEntityType: 'request',
    relatedEntityId: requestId,
    actionUrl: `/requests/${requestId}`,
    priority: action === 'rejected' ? 'high' : 'medium',
  });
};

// Notificação de alerta orçamentário
export const createBudgetAlertNotification = async (
  budgetId: string,
  budgetName: string,
  utilizationPercent: number,
  managerId: string,
  alertType: 'warning' | 'critical'
): Promise<void> => {
  const title = alertType === 'critical' ? 'Orçamento estourado!' : 'Alerta de orçamento';
  const message = `O orçamento "${budgetName}" está com ${utilizationPercent}% de utilização.`;

  await createNotification({
    type: 'budget_alert',
    title,
    message,
    recipientId: managerId,
    relatedEntityType: 'budget',
    relatedEntityId: budgetId,
    actionUrl: `/budgets/${budgetId}`,
    priority: alertType === 'critical' ? 'urgent' : 'high',
  });
};

// Notificação de vencimento de solicitação
export const createRequestDueNotification = async (
  requestId: string,
  requestTitle: string,
  dueDate: Date,
  approverId: string
): Promise<void> => {
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const message = daysUntilDue <= 0 
    ? `A solicitação "${requestTitle}" está vencida.`
    : `A solicitação "${requestTitle}" vence em ${daysUntilDue} dia(s).`;

  await createNotification({
    type: 'warning',
    title: 'Solicitação próxima do vencimento',
    message,
    recipientId: approverId,
    relatedEntityType: 'request',
    relatedEntityId: requestId,
    actionUrl: `/requests/${requestId}`,
    priority: daysUntilDue <= 0 ? 'urgent' : 'high',
  });
};

// Notificação de sistema
export const createSystemNotification = async (
  title: string,
  message: string,
  recipientIds: string[],
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
): Promise<void> => {
  const batch = writeBatch(db);

  recipientIds.forEach(recipientId => {
    const docRef = doc(collection(db, 'notifications'));
    batch.set(docRef, {
      type: 'system',
      title,
      message,
      recipientId,
      priority,
      read: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  await batch.commit();
};

// Limpar notificações expiradas
export const cleanupExpiredNotifications = async (): Promise<number> => {
  try {
    const now = Timestamp.now();
    const expiredQuery = query(
      collection(db, 'notifications'),
      where('expiresAt', '<=', now)
    );

    const snapshot = await getDocs(expiredQuery);
    
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  } catch (error) {
    console.error('Erro ao limpar notificações expiradas:', error);
    return 0;
  }
};

// Obter estatísticas de notificações
export const getNotificationStats = async (userId?: string) => {
  try {
    let baseQuery = collection(db, 'notifications');
    
    if (userId) {
      baseQuery = query(baseQuery, where('recipientId', '==', userId)) as any;
    }

    const snapshot = await getDocs(baseQuery);
    const notifications = snapshot.docs.map(doc => doc.data());

    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const read = total - unread;

    // Agrupar por tipo
    const byType = notifications.reduce((acc, notification) => {
      const type = notification.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por prioridade
    const byPriority = notifications.reduce((acc, notification) => {
      const priority = notification.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Notificações recentes (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = notifications.filter(n => 
      n.createdAt && new Date(n.createdAt.toDate()) > sevenDaysAgo
    ).length;

    return {
      total,
      unread,
      read,
      recent,
      byType,
      byPriority,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de notificações:', error);
    throw error;
  }
};

