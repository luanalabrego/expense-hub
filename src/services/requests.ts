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

    return {
      id: requestDoc.id,
      ...requestDoc.data(),
      createdAt: requestDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: requestDoc.data().updatedAt?.toDate() || new Date(),
      dueDate: requestDoc.data().dueDate?.toDate() || null,
      invoiceDate: requestDoc.data().invoiceDate?.toDate() || null,
      competenceDate: requestDoc.data().competenceDate?.toDate() || null,
      approvedAt: requestDoc.data().approvedAt?.toDate() || null,
      rejectedAt: requestDoc.data().rejectedAt?.toDate() || null,
      paidAt: requestDoc.data().paidAt?.toDate() || null,
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
    let requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      dueDate: doc.data().dueDate?.toDate() || null,
      invoiceDate: doc.data().invoiceDate?.toDate() || null,
      competenceDate: doc.data().competenceDate?.toDate() || null,
      approvedAt: doc.data().approvedAt?.toDate() || null,
      rejectedAt: doc.data().rejectedAt?.toDate() || null,
      paidAt: doc.data().paidAt?.toDate() || null,
    })) as PaymentRequest[];

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
      status: 'draft' as RequestStatus,
      currentApproverId: null,
      approvalLevel: 0,
      approvalHistory: [],
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
export const submitRequest = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'pending_approval',
      updatedAt: new Date()
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

    const approvalEntry = {
      approverId,
      approverName,
      action: 'approved' as const,
      comments: comments || '',
      timestamp: new Date(),
      level: request.approvalLevel + 1
    };

    const batch = writeBatch(db);
    const requestRef = doc(db, COLLECTION_NAME, id);

    // Atualizar solicitação
    batch.update(requestRef, {
      status: 'approved',
      approvalLevel: increment(1),
      approvalHistory: [...request.approvalHistory, approvalEntry],
      approvedAt: new Date(),
      updatedAt: new Date()
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

    const approvalEntry = {
      approverId,
      approverName,
      action: 'rejected' as const,
      comments: reason,
      timestamp: new Date(),
      level: request.approvalLevel + 1
    };

    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'rejected',
      approvalHistory: [...request.approvalHistory, approvalEntry],
      rejectedAt: new Date(),
      updatedAt: new Date()
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

    // Atualizar solicitação
    batch.update(requestRef, {
      status: 'paid',
      paidAt: paymentDetails.paymentDate,
      paymentReference: paymentDetails.paymentReference || '',
      paymentNotes: paymentDetails.notes || '',
      paidBy: paymentDetails.paidBy,
      paidByName: paymentDetails.paidByName,
      updatedAt: new Date()
    });

    // Atualizar centro de custo (mover de comprometido para gasto)
    if (request.costCenterId) {
      const costCenterRef = doc(db, 'cost-centers', request.costCenterId);
      batch.update(costCenterRef, {
        spent: increment(request.amount),
        committed: increment(-request.amount),
        updatedAt: new Date()
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Erro ao marcar como pago:', error);
    throw error;
  }
};

// Cancelar solicitação
export const cancelRequest = async (id: string, reason: string): Promise<void> => {
  try {
    const request = await getRequestById(id);
    if (!request) throw new Error('Solicitação não encontrada');

    const batch = writeBatch(db);
    const requestRef = doc(db, COLLECTION_NAME, id);

    // Atualizar solicitação
    batch.update(requestRef, {
      status: 'cancelled',
      cancellationReason: reason,
      updatedAt: new Date()
    });

    // Se estava aprovada, liberar valor comprometido
    if (request.status === 'approved' && request.costCenterId) {
      const costCenterRef = doc(db, 'cost-centers', request.costCenterId);
      batch.update(costCenterRef, {
        committed: increment(-request.amount),
        updatedAt: new Date()
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
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      dueDate: doc.data().dueDate?.toDate() || null,
      invoiceDate: doc.data().invoiceDate?.toDate() || null,
      competenceDate: doc.data().competenceDate?.toDate() || null,
      approvedAt: doc.data().approvedAt?.toDate() || null,
      rejectedAt: doc.data().rejectedAt?.toDate() || null,
      paidAt: doc.data().paidAt?.toDate() || null,
    })) as PaymentRequest[];
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
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      dueDate: doc.data().dueDate?.toDate() || null,
      invoiceDate: doc.data().invoiceDate?.toDate() || null,
      competenceDate: doc.data().competenceDate?.toDate() || null,
      approvedAt: doc.data().approvedAt?.toDate() || null,
      rejectedAt: doc.data().rejectedAt?.toDate() || null,
      paidAt: doc.data().paidAt?.toDate() || null,
    })) as PaymentRequest[];
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
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      dueDate: doc.data().dueDate?.toDate() || null,
      invoiceDate: doc.data().invoiceDate?.toDate() || null,
      competenceDate: doc.data().competenceDate?.toDate() || null,
      approvedAt: doc.data().approvedAt?.toDate() || null,
      rejectedAt: doc.data().rejectedAt?.toDate() || null,
      paidAt: doc.data().paidAt?.toDate() || null,
    })) as PaymentRequest[];
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

