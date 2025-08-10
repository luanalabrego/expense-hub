// Serviços para gestão de solicitações de pagamento
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
  DocumentSnapshot,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import type { PaymentRequest, PaginationParams, PaginatedResponse, RequestStatus } from '../types';

const COLLECTION_NAME = 'payment-requests';

// Obter solicitação por ID
export const getRequestById = async (id: string): Promise<PaymentRequest | null> => {
  try {
    const requestDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!requestDoc.exists()) return null;

    const data = requestDoc.data();
    return {
      id: requestDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      dueDate: data.dueDate?.toDate() || null,
      invoiceDate: data.invoiceDate?.toDate() || null,
      competenceDate: data.competenceDate?.toDate() || null,
      approvedAt: data.approvedAt?.toDate() || null,
      rejectedAt: data.rejectedAt?.toDate() || null,
      paidAt: data.paidAt?.toDate() || null,
      statusHistory: (data.statusHistory || []).map((h: any) => ({
        ...h,
        timestamp: h.timestamp?.toDate ? h.timestamp.toDate() : new Date(h.timestamp),
      })),
    } as PaymentRequest;
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error);
    throw error;
  }
};

// Listar solicitações com paginação
export const getRequests = async (
  params: PaginationParams & {
    status?: RequestStatus;
    requesterId?: string;
    approverId?: string;
    vendorId?: string;
    costCenterId?: string;
    categoryId?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    amountFrom?: number;
    amountTo?: number;
  } = { page: 1, limit: 20 }
): Promise<PaginatedResponse<PaymentRequest>> => {
  try {
    let q = query(collection(db, COLLECTION_NAME));

    // Filtros
    if (params.status) {
      q = query(q, where('status', '==', params.status));
    }

    if (params.requesterId) {
      q = query(q, where('requesterId', '==', params.requesterId));
    }

    if (params.approverId) {
      q = query(q, where('currentApproverId', '==', params.approverId));
    }

    if (params.vendorId) {
      q = query(q, where('vendorId', '==', params.vendorId));
    }

    if (params.costCenterId) {
      q = query(q, where('costCenterId', '==', params.costCenterId));
    }

    if (params.categoryId) {
      q = query(q, where('categoryId', '==', params.categoryId));
    }

    // Ordenação
    const sortField = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    q = query(q, orderBy(sortField, sortOrder));

    // Paginação
    if (params.page > 1) {
      const offset = (params.page - 1) * params.limit;
      q = query(q, limit(params.limit + offset));
    } else {
      q = query(q, limit(params.limit));
    }

    const snapshot = await getDocs(q);
    let requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate() || null,
        invoiceDate: data.invoiceDate?.toDate() || null,
        competenceDate: data.competenceDate?.toDate() || null,
        approvedAt: data.approvedAt?.toDate() || null,
        rejectedAt: data.rejectedAt?.toDate() || null,
        paidAt: data.paidAt?.toDate() || null,
        statusHistory: (data.statusHistory || []).map((h: any) => ({
          ...h,
          timestamp: h.timestamp?.toDate ? h.timestamp.toDate() : new Date(h.timestamp),
        })),
      } as PaymentRequest;
    });

    // Aplicar offset simulado
    if (params.page > 1) {
      const offset = (params.page - 1) * params.limit;
      requests = requests.slice(offset);
    }

    // Filtros adicionais no frontend
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      requests = requests.filter(request => 
        request.description.toLowerCase().includes(searchLower) ||
        request.requestNumber?.toLowerCase().includes(searchLower) ||
        request.vendorName?.toLowerCase().includes(searchLower)
      );
    }

    if (params.dateFrom) {
      requests = requests.filter(request => 
        request.createdAt >= params.dateFrom!
      );
    }

    if (params.dateTo) {
      requests = requests.filter(request => 
        request.createdAt <= params.dateTo!
      );
    }

    if (params.amountFrom) {
      requests = requests.filter(request => 
        request.amount >= params.amountFrom!
      );
    }

    if (params.amountTo) {
      requests = requests.filter(request => 
        request.amount <= params.amountTo!
      );
    }

    const total = snapshot.size;
    const totalPages = Math.ceil(total / params.limit);

    return {
      data: requests,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    throw error;
  }
};

// Criar solicitação
export const createRequest = async (requestData: {
  description: string;
  amount: number;
  vendorId: string;
  vendorName: string;
  costCenterId: string;
  categoryId: string;
  costType?: 'CAPEX' | 'OPEX' | 'CPO';
  invoiceDate?: Date;
  competenceDate?: Date;
  dueDate?: Date;
  notes?: string;
  isExtraordinary?: boolean;
  extraordinaryReason?: string;
  requesterId: string;
  requesterName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  paymentMethod: 'transfer' | 'check' | 'cash' | 'card';
  attachments?: string[];
}): Promise<PaymentRequest> => {
  try {
    // Gerar número da solicitação
    const requestNumber = await generateRequestNumber();

    const requestDoc = {
      requestNumber,
      description: requestData.description,
      amount: requestData.amount,
      vendorId: requestData.vendorId,
      vendorName: requestData.vendorName,
      costCenterId: requestData.costCenterId,
      categoryId: requestData.categoryId,
      costType: requestData.costType || null,
      invoiceDate: requestData.invoiceDate || null,
      competenceDate: requestData.competenceDate || null,
      dueDate: requestData.dueDate || null,
      notes: requestData.notes || '',
      isExtraordinary: requestData.isExtraordinary || false,
      extraordinaryReason: requestData.extraordinaryReason || '',
      requesterId: requestData.requesterId,
      requesterName: requestData.requesterName,
      priority: requestData.priority,
      paymentMethod: requestData.paymentMethod,
      attachments: requestData.attachments || [],
      status: 'pending_approval' as RequestStatus,
      currentApproverId: null,
      approvalLevel: 0,
      approvalHistory: [],
      statusHistory: [
        {
          status: 'pending_approval',
          changedBy: requestData.requesterId,
          changedByName: requestData.requesterName,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedAt: null,
      rejectedAt: null,
      paidAt: null,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), requestDoc);

    return {
      id: docRef.id,
      ...requestDoc
    } as PaymentRequest;
  } catch (error) {
    console.error('Erro ao criar solicitação:', error);
    throw error;
  }
};

// Atualizar solicitação
export const updateRequest = async (
  id: string, 
  updates: Partial<Omit<PaymentRequest, 'id' | 'createdAt' | 'requestNumber'>>
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
  } catch (error) {
    console.error('Erro ao atualizar solicitação:', error);
    throw error;
  }
};

// Submeter solicitação para aprovação
export const submitRequest = async (
  id: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const request = await getRequestById(id);
    const now = new Date();
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'pending_approval',
      statusHistory: [...(request?.statusHistory || []), {
        status: 'pending_approval',
        changedBy: userId,
        changedByName: userName,
        timestamp: now,
      }],
      updatedAt: now
    });
  } catch (error) {
    console.error('Erro ao submeter solicitação:', error);
    throw error;
  }
};

// Aprovar solicitação
export const approveRequest = async (
  id: string, 
  approverId: string, 
  approverName: string,
  comments?: string
): Promise<void> => {
  try {
    const request = await getRequestById(id);
    if (!request) throw new Error('Solicitação não encontrada');

    const now = new Date();
    const approvalEntry = {
      approverId,
      approverName,
      action: 'approved' as const,
      comments: comments || '',
      timestamp: now,
      level: request.approvalLevel + 1
    };

    const statusEntry = {
      status: 'pending_payment' as RequestStatus,
      changedBy: approverId,
      changedByName: approverName,
      timestamp: now,
    };

    const batch = writeBatch(db);
    const requestRef = doc(db, COLLECTION_NAME, id);

    // Atualizar solicitação
    batch.update(requestRef, {
      status: 'pending_payment',
      approvalLevel: increment(1),
      approvalHistory: [...request.approvalHistory, approvalEntry],
      statusHistory: [...(request.statusHistory || []), statusEntry],
      approvedAt: now,
      updatedAt: now
    });

    // Atualizar centro de custo (comprometer valor)
    if (request.costCenterId) {
      const costCenterRef = doc(db, 'cost-centers', request.costCenterId);
      batch.update(costCenterRef, {
        committed: increment(request.amount),
        updatedAt: new Date()
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    throw error;
  }
};

// Rejeitar solicitação
export const rejectRequest = async (
  id: string, 
  approverId: string, 
  approverName: string,
  reason: string
): Promise<void> => {
  try {
    const request = await getRequestById(id);
    if (!request) throw new Error('Solicitação não encontrada');

    const now = new Date();
    const approvalEntry = {
      approverId,
      approverName,
      action: 'rejected' as const,
      comments: reason,
      timestamp: now,
      level: request.approvalLevel + 1
    };

    const statusEntry = {
      status: 'rejected' as RequestStatus,
      changedBy: approverId,
      changedByName: approverName,
      timestamp: now,
      reason,
    };

    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'rejected',
      approvalHistory: [...request.approvalHistory, approvalEntry],
      statusHistory: [...(request.statusHistory || []), statusEntry],
      rejectedAt: now,
      updatedAt: now
    });
  } catch (error) {
    console.error('Erro ao rejeitar solicitação:', error);
    throw error;
  }
};

// Marcar como pago
export const markAsPaid = async (
  id: string, 
  paymentDetails: {
    paidBy: string;
    paidByName: string;
    paymentDate: Date;
    paymentReference?: string;
    notes?: string;
  }
): Promise<void> => {
  try {
    const request = await getRequestById(id);
    if (!request) throw new Error('Solicitação não encontrada');

    const batch = writeBatch(db);
    const requestRef = doc(db, COLLECTION_NAME, id);

    const now = new Date();
    const statusEntry = {
      status: 'paid' as RequestStatus,
      changedBy: paymentDetails.paidBy,
      changedByName: paymentDetails.paidByName,
      timestamp: now,
    };

    // Atualizar solicitação
    batch.update(requestRef, {
      status: 'paid',
      paidAt: paymentDetails.paymentDate,
      paymentReference: paymentDetails.paymentReference || '',
      paymentNotes: paymentDetails.notes || '',
      paidBy: paymentDetails.paidBy,
      paidByName: paymentDetails.paidByName,
      statusHistory: [...(request.statusHistory || []), statusEntry],
      updatedAt: now
    });

    // Atualizar centro de custo (mover de comprometido para gasto)
    if (request.costCenterId) {
      const costCenterRef = doc(db, 'cost-centers', request.costCenterId);
      batch.update(costCenterRef, {
        spent: increment(request.amount),
        committed: increment(-request.amount),
        updatedAt: now
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Erro ao marcar como pago:', error);
    throw error;
  }
};

// Cancelar solicitação
export const cancelRequest = async (
  id: string,
  reason: string,
  cancelledBy: string,
  cancelledByName: string
): Promise<void> => {
  try {
    const request = await getRequestById(id);
    if (!request) throw new Error('Solicitação não encontrada');

    const batch = writeBatch(db);
    const requestRef = doc(db, COLLECTION_NAME, id);

    const now = new Date();
    const statusEntry = {
      status: 'cancelled' as RequestStatus,
      changedBy: cancelledBy,
      changedByName: cancelledByName,
      timestamp: now,
      reason,
    };

    // Atualizar solicitação
    batch.update(requestRef, {
      status: 'cancelled',
      cancellationReason: reason,
      statusHistory: [...(request.statusHistory || []), statusEntry],
      updatedAt: now
    });

    // Se estava pendente de pagamento, liberar valor comprometido
    if (request.status === 'pending_payment' && request.costCenterId) {
      const costCenterRef = doc(db, 'cost-centers', request.costCenterId);
      batch.update(costCenterRef, {
        committed: increment(-request.amount),
        updatedAt: now
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Erro ao cancelar solicitação:', error);
    throw error;
  }
};

// Obter solicitações por status
export const getRequestsByStatus = async (status: RequestStatus): Promise<PaymentRequest[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate() || null,
        invoiceDate: data.invoiceDate?.toDate() || null,
        competenceDate: data.competenceDate?.toDate() || null,
        approvedAt: data.approvedAt?.toDate() || null,
        rejectedAt: data.rejectedAt?.toDate() || null,
        paidAt: data.paidAt?.toDate() || null,
        statusHistory: (data.statusHistory || []).map((h: any) => ({
          ...h,
          timestamp: h.timestamp?.toDate ? h.timestamp.toDate() : new Date(h.timestamp),
        })),
      } as PaymentRequest;
    }) as PaymentRequest[];
  } catch (error) {
    console.error('Erro ao buscar solicitações por status:', error);
    throw error;
  }
};

// Obter solicitações por usuário
export const getRequestsByUser = async (userId: string): Promise<PaymentRequest[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('requesterId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate() || null,
        invoiceDate: data.invoiceDate?.toDate() || null,
        competenceDate: data.competenceDate?.toDate() || null,
        approvedAt: data.approvedAt?.toDate() || null,
        rejectedAt: data.rejectedAt?.toDate() || null,
        paidAt: data.paidAt?.toDate() || null,
        statusHistory: (data.statusHistory || []).map((h: any) => ({
          ...h,
          timestamp: h.timestamp?.toDate ? h.timestamp.toDate() : new Date(h.timestamp),
        })),
      } as PaymentRequest;
    }) as PaymentRequest[];
  } catch (error) {
    console.error('Erro ao buscar solicitações por usuário:', error);
    throw error;
  }
};

// Obter solicitações pendentes para aprovador
export const getPendingRequestsForApprover = async (approverId: string): Promise<PaymentRequest[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('currentApproverId', '==', approverId),
      where('status', '==', 'pending_approval'),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate() || null,
        invoiceDate: data.invoiceDate?.toDate() || null,
        competenceDate: data.competenceDate?.toDate() || null,
        approvedAt: data.approvedAt?.toDate() || null,
        rejectedAt: data.rejectedAt?.toDate() || null,
        paidAt: data.paidAt?.toDate() || null,
        statusHistory: (data.statusHistory || []).map((h: any) => ({
          ...h,
          timestamp: h.timestamp?.toDate ? h.timestamp.toDate() : new Date(h.timestamp),
        })),
      } as PaymentRequest;
    }) as PaymentRequest[];
  } catch (error) {
    console.error('Erro ao buscar solicitações pendentes:', error);
    throw error;
  }
};

// Gerar número da solicitação
const generateRequestNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Buscar último número do mês
  const q = query(
    collection(db, COLLECTION_NAME),
    where('requestNumber', '>=', `RD${year}${month}`),
    where('requestNumber', '<', `RD${year}${month}Z`),
    orderBy('requestNumber', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  let nextNumber = 1;

  if (!snapshot.empty) {
    const lastRequest = snapshot.docs[0].data();
    const lastNumber = parseInt(lastRequest.requestNumber.slice(-4));
    nextNumber = lastNumber + 1;
  }

  return `RD${year}${month}${String(nextNumber).padStart(4, '0')}`;
};

// Estatísticas de solicitações
export const getRequestStats = async (
  filters: {
    dateFrom?: Date;
    dateTo?: Date;
    costCenterId?: string;
    categoryId?: string;
  } = {}
): Promise<{
  total: number;
  byStatus: Record<RequestStatus, number>;
  totalAmount: number;
  averageAmount: number;
  byPriority: Record<string, number>;
  byPaymentMethod: Record<string, number>;
}> => {
  try {
    let q = query(collection(db, COLLECTION_NAME));

    if (filters.costCenterId) {
      q = query(q, where('costCenterId', '==', filters.costCenterId));
    }

    if (filters.categoryId) {
      q = query(q, where('categoryId', '==', filters.categoryId));
    }

    const snapshot = await getDocs(q);
    let requests = snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as PaymentRequest[];

    // Filtros de data
    if (filters.dateFrom) {
      requests = requests.filter(r => r.createdAt >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      requests = requests.filter(r => r.createdAt <= filters.dateTo!);
    }

    const total = requests.length;
    const totalAmount = requests.reduce((sum, r) => sum + r.amount, 0);
    const averageAmount = total > 0 ? totalAmount / total : 0;

    const byStatus = requests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<RequestStatus, number>);

    const byPriority = requests.reduce((acc, r) => {
      acc[r.priority] = (acc[r.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPaymentMethod = requests.reduce((acc, r) => {
      acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byStatus,
      totalAmount,
      averageAmount,
      byPriority,
      byPaymentMethod,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
};

