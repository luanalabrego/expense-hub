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
import { getCostCenterById } from './costCenters';
import { getQuotationsByRequest } from './quotations';
import { getVendorById } from './vendors';
import * as erpService from './erp';
import * as bankService from './bank';
import * as emailService from './email';
import { createAuditLog, AUDIT_ACTIONS, AUDIT_ENTITIES } from './audit';
import { validateNF, TaxValidationResult } from './taxValidation';
import { findApplicableBudget, commitBudgetAmount, spendBudgetAmount } from './budgets';
import type { PaymentRequest, PaginationParams, PaginatedResponse, RequestStatus, PurchaseType } from '../types';
import * as notificationsService from './notifications';

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
    contractStatus?: 'pending' | 'approved' | 'adjustments_requested';
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

    if (params.contractStatus) {
      q = query(q, where('contractStatus', '==', params.contractStatus));
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
  invoiceNumber?: string;
  vendorId: string;
  vendorName: string;
  costCenterId: string;
  categoryId: string;
  costType?: 'CAPEX' | 'OPEX' | 'CPO';
  purchaseType?: PurchaseType;
  serviceType?: string;
  scope?: string;
  justification?: string;
  inBudget?: boolean;
  invoiceDate?: Date;
  competenceDate?: Date;
  dueDate?: Date;
  notes?: string;
  isExtraordinary?: boolean;
  isRecurring?: boolean;
  extraordinaryReason?: string;
  requesterId: string;
  requesterName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  paymentMethod: 'transfer' | 'check' | 'cash' | 'card';
  attachments?: string[];
  fiscalStatus?: 'pending' | 'approved' | 'pending_adjustment';
  fiscalNotes?: string;
  taxInfo?: { expected: number; calculated: number; difference: number };
  contractDocumentId?: string;
  contractStatus?: 'pending' | 'approved' | 'adjustments_requested';
  contractRequesterId?: string;
}): Promise<PaymentRequest> => {
  try {
    const requiresBudget = requestData.inBudget ?? false;
    if (requiresBudget) {
      // Verificar disponibilidade no orçamento
      const refDate = requestData.competenceDate || requestData.invoiceDate || requestData.dueDate || new Date();
      const year = refDate.getFullYear();
      const month = refDate.getMonth() + 1;
      const budget = await findApplicableBudget(
        requestData.costCenterId,
        requestData.categoryId || null,
        year,
        month
      );
      if (!budget) {
        throw new Error('Nenhum orçamento disponível para este centro de custo/período.');
      }
      if (budget.availableAmount < requestData.amount) {
        throw new Error('Orçamento insuficiente para esta solicitação.');
      }
    }

    // Gerar número da solicitação
    const requestNumber = await generateRequestNumber();
    const currentApproverId = null;

    const requestDoc = {
        requestNumber,
        description: requestData.description,
        amount: requestData.amount,
        invoiceNumber: requestData.invoiceNumber || null,
        vendorId: requestData.vendorId,
        vendorName: requestData.vendorName,
        costCenterId: requestData.costCenterId,
        categoryId: requestData.categoryId,
        costType: requestData.costType || null,
        purchaseType: requestData.purchaseType || null,
        serviceType: requestData.serviceType || '',
        scope: requestData.scope || '',
        justification: requestData.justification || '',
        inBudget: requiresBudget,
        invoiceDate: requestData.invoiceDate || null,
        competenceDate: requestData.competenceDate || null,
        dueDate: requestData.dueDate || null,
        notes: requestData.notes || '',
        isExtraordinary: requestData.isExtraordinary || false,
        isRecurring: requestData.isRecurring || false,
        extraordinaryReason: requestData.extraordinaryReason || '',
        requesterId: requestData.requesterId,
        requesterName: requestData.requesterName,
        priority: requestData.priority,
        paymentMethod: requestData.paymentMethod,
        attachments: requestData.attachments || [],
        fiscalStatus: 'pending',
        fiscalNotes: requestData.fiscalNotes || '',
        taxInfo: requestData.taxInfo || null,
        contractDocumentId: requestData.contractDocumentId || null,
        contractStatus: requestData.contractStatus || null,
        contractRequesterId: requestData.contractRequesterId || null,
        contractNotes: '',
        status: 'pending_validation' as RequestStatus,
        currentApproverId,
        approvalLevel: 0,
        approvalHistory: [],
        statusHistory: [
          {
            status: 'pending_validation',
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
      if (!request) throw new Error('Solicitação não encontrada');

      // Verificar disponibilidade no orçamento apenas quando marcado como dentro do orçamento
      if (request.inBudget && request.costCenterId) {
        const refDate = request.competenceDate || request.invoiceDate || request.dueDate || new Date();
        const year = refDate.getFullYear();
        const month = refDate.getMonth() + 1;
        const budget = await findApplicableBudget(request.costCenterId, request.categoryId || null, year, month);
        if (!budget) {
          throw new Error('Nenhum orçamento disponível para este centro de custo/período.');
        }
        if (budget.availableAmount < request.amount) {
          throw new Error('Orçamento insuficiente para esta solicitação.');
        }
      }

      const now = new Date();
      const costCenter = request?.costCenterId
        ? await getCostCenterById(request.costCenterId)
        : null;
      const currentApproverId = costCenter?.managerId || null;
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        status: 'pending_owner_approval',
        currentApproverId,
        statusHistory: [...(request?.statusHistory || []), {
          status: 'pending_owner_approval',
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

// Validar solicitação e encaminhar para aprovação do owner
export const validateRequest = async (
  id: string,
  validatorId: string,
  validatorName: string,
  comments?: string
): Promise<TaxValidationResult> => {
  try {
    const request = await getRequestById(id);
    if (!request) throw new Error('Solicitação não encontrada');

    // Verificar disponibilidade no orçamento apenas quando marcado como dentro do orçamento
    if (request.inBudget && request.costCenterId) {
      const refDate = request.competenceDate || request.invoiceDate || request.dueDate || new Date();
      const year = refDate.getFullYear();
      const month = refDate.getMonth() + 1;
      const budget = await findApplicableBudget(request.costCenterId, request.categoryId || null, year, month);
      if (!budget) {
        throw new Error('Nenhum orçamento disponível para este centro de custo/período.');
      }
      if (budget.availableAmount < request.amount) {
        throw new Error('Orçamento insuficiente para esta solicitação.');
      }
    }

    const now = new Date();
    const costCenter = request.costCenterId
      ? await getCostCenterById(request.costCenterId)
      : null;
    const currentApproverId = costCenter?.managerId || null;

    const taxResult = await validateNF({
      amount: request.amount,
      reportedTax: request.taxInfo?.calculated,
    });

    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'pending_owner_approval',
      currentApproverId,
      statusHistory: [
        ...(request.statusHistory || []),
        {
          status: 'pending_owner_approval',
          changedBy: validatorId,
          changedByName: validatorName,
          timestamp: now,
          reason: comments || '',
        },
      ],
      updatedAt: now,
      fiscalStatus: taxResult.status,
      taxInfo: taxResult.taxes,
    });

    return taxResult;
  } catch (error) {
    console.error('Erro ao validar solicitação:', error);
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

    const quotations = await getQuotationsByRequest(id);
    const required = request.amount > 10000 ? 3 : 1;
    if (quotations.length < required) {
      throw new Error(`Solicitação requer pelo menos ${required} orçamento(s).`);
    }

    const now = new Date();

    let nextStatus: RequestStatus = 'pending_payment_approval';
    const amount = request.amount || 0;

    switch (request.status) {
      case 'pending_owner_approval':
        nextStatus = amount <= 10000 ? 'pending_payment_approval' : 'pending_fpa_approval';
        break;
      case 'pending_fpa_approval':
        nextStatus = 'pending_director_approval';
        break;
      case 'pending_director_approval':
        nextStatus = amount <= 50000 ? 'pending_payment_approval' : 'pending_cfo_approval';
        break;
      case 'pending_cfo_approval':
        nextStatus = amount <= 200000 ? 'pending_payment_approval' : 'pending_ceo_approval';
        break;
      case 'pending_ceo_approval':
        nextStatus = 'pending_payment_approval';
        break;
    }

    const approvalEntry = {
      approverId,
      approverName,
      action: 'approved' as const,
      comments: comments || '',
      timestamp: now,
      level: request.approvalLevel + 1
    };

    const statusEntry = {
      status: nextStatus as RequestStatus,
      changedBy: approverId,
      changedByName: approverName,
      timestamp: now,
    };

    const batch = writeBatch(db);
    const requestRef = doc(db, COLLECTION_NAME, id);

    const updateData: any = {
      status: nextStatus,
      approvalLevel: increment(1),
      approvalHistory: [...request.approvalHistory, approvalEntry],
      statusHistory: [...(request.statusHistory || []), statusEntry],
      updatedAt: now,
      currentApproverId: null,
    };

    if (nextStatus === 'pending_payment_approval') {
      updateData.approvedAt = now;
    }

    batch.update(requestRef, updateData);

    if (nextStatus === 'pending_payment_approval' && request.costCenterId) {
      const costCenterRef = doc(db, 'cost-centers', request.costCenterId);
      batch.update(costCenterRef, {
        committed: increment(request.amount),
        updatedAt: now
      });
    }

    await batch.commit();

    if (nextStatus === 'pending_payment_approval' && request.costCenterId && request.inBudget) {
      const refDate = request.competenceDate || request.invoiceDate || request.dueDate || new Date();
      const year = refDate.getFullYear();
      const month = refDate.getMonth() + 1;
      await commitBudgetAmount(request.costCenterId, request.categoryId || null, request.amount, year, month);
    }
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

    // 1. Gerar documento MIRO no ERP e atualizar status
    const miro = await erpService.generateMiroDocument(id);
    await erpService.updateERPStatus(id, 'paid');

    // 2. Processar pagamento via módulo bancário
    const bankPayment = await bankService.processBankPayment({
      requestId: id,
      amount: request.amount,
      vendorId: request.vendorId,
    });

    // 3. Anexar comprovante ao request (apenas URL)
    const updatedAttachments = [...(request.attachments || [])];
    if (bankPayment.receiptUrl) {
      updatedAttachments.push(bankPayment.receiptUrl);
    }

    // 4. Enviar e-mail ao fornecedor com comprovante
    const vendor = await getVendorById(request.vendorId);
    if (vendor?.email) {
      await emailService.sendPaymentReceiptEmail(
        vendor.email,
        `Comprovante de pagamento - ${request.description}`,
        'Segue comprovante referente ao pagamento realizado.',
        bankPayment.receiptUrl
      );
    }

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
      updatedAt: now,
      paymentProtocol: bankPayment.protocol,
      paymentReceiptUrl: bankPayment.receiptUrl,
      erpMiroId: miro.documentNumber,
      attachments: updatedAttachments,
      attachmentsCount: updatedAttachments.length,
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

    // Registrar log de auditoria
    await createAuditLog({
      actorId: paymentDetails.paidBy,
      actorName: paymentDetails.paidByName,
      actorEmail: '',
      action: AUDIT_ACTIONS.REQUEST_PAY,
      entity: AUDIT_ENTITIES.REQUEST,
      entityId: id,
      entityName: request.description,
      metadata: {
        paymentProtocol: bankPayment.protocol,
        miroDocument: miro.documentNumber,
      },
    });
    if (request.costCenterId) {
      const refDate = request.competenceDate || request.invoiceDate || request.dueDate || new Date();
      const year = refDate.getFullYear();
      const month = refDate.getMonth() + 1;
      await spendBudgetAmount(request.costCenterId, request.categoryId || null, request.amount, year, month);
    }
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
    if (request.status === 'pending_payment_approval' && request.costCenterId) {
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

// Aprovar contrato da solicitação
export const approveRequestContract = async (id: string): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(ref);
    await updateDoc(ref, {
      contractStatus: 'approved',
      contractNotes: '',
      updatedAt: new Date(),
    });

    const requesterId = snap.data()?.contractRequesterId;
    if (requesterId) {
      await notificationsService.createNotification({
        type: 'success',
        title: 'Contrato aprovado',
        message: 'O contrato da solicitação foi aprovado.',
        recipientId: requesterId,
        relatedEntityType: 'request',
        relatedEntityId: id,
        priority: 'medium',
      });
    }
  } catch (error) {
    console.error('Erro ao aprovar contrato da solicitação:', error);
    throw error;
  }
};

// Solicitar ajustes no contrato da solicitação
export const requestRequestContractAdjustments = async (
  id: string,
  notes: string,
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(ref);
    await updateDoc(ref, {
      contractStatus: 'adjustments_requested',
      contractNotes: notes,
      updatedAt: new Date(),
    });

    const requesterId = snap.data()?.contractRequesterId;
    if (requesterId) {
      await notificationsService.createNotification({
        type: 'warning',
        title: 'Contrato requer ajustes',
        message: notes || 'O contrato da solicitação necessita ajustes.',
        recipientId: requesterId,
        relatedEntityType: 'request',
        relatedEntityId: id,
        priority: 'medium',
      });
    }
  } catch (error) {
    console.error('Erro ao solicitar ajustes do contrato da solicitação:', error);
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
      where('status', '==', 'pending_owner_approval'),
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

