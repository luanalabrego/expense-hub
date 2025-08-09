// Serviços para gestão de políticas de aprovação e alçadas
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
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type { ApprovalPolicy, PaginationParams, PaginatedResponse } from '../types';

const COLLECTION_NAME = 'approval-policies';

// Obter política por ID
export const getPolicyById = async (id: string): Promise<ApprovalPolicy | null> => {
  try {
    const policyDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!policyDoc.exists()) return null;

    return {
      id: policyDoc.id,
      ...policyDoc.data(),
      createdAt: policyDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: policyDoc.data().updatedAt?.toDate() || new Date(),
    } as ApprovalPolicy;
  } catch (error) {
    console.error('Erro ao buscar política:', error);
    throw error;
  }
};

// Listar políticas com paginação
export const getPolicies = async (
  params: PaginationParams & {
    status?: 'active' | 'inactive';
    categoryId?: string;
    costCenterId?: string;
    search?: string;
  } = { page: 1, limit: 20 }
): Promise<PaginatedResponse<ApprovalPolicy>> => {
  try {
    let q = query(collection(db, COLLECTION_NAME));

    // Filtros
    if (params.status) {
      q = query(q, where('status', '==', params.status));
    }

    if (params.categoryId) {
      q = query(q, where('categoryId', '==', params.categoryId));
    }

    if (params.costCenterId) {
      q = query(q, where('costCenterId', '==', params.costCenterId));
    }

    // Ordenação
    const sortField = params.sortBy || 'priority';
    const sortOrder = params.sortOrder || 'asc';
    q = query(q, orderBy(sortField, sortOrder));

    // Paginação
    if (params.page > 1) {
      const offset = (params.page - 1) * params.limit;
      q = query(q, limit(params.limit + offset));
    } else {
      q = query(q, limit(params.limit));
    }

    const snapshot = await getDocs(q);
    let policies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ApprovalPolicy[];

    // Aplicar offset simulado
    if (params.page > 1) {
      const offset = (params.page - 1) * params.limit;
      policies = policies.slice(offset);
    }

    // Filtros adicionais no frontend
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      policies = policies.filter(policy => 
        policy.name.toLowerCase().includes(searchLower) ||
        policy.description?.toLowerCase().includes(searchLower)
      );
    }

    const total = snapshot.size;
    const totalPages = Math.ceil(total / params.limit);

    return {
      data: policies,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  } catch (error) {
    console.error('Erro ao listar políticas:', error);
    throw error;
  }
};

// Criar política
export const createPolicy = async (policyData: {
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
}): Promise<ApprovalPolicy> => {
  try {
    const policyDoc = {
      name: policyData.name,
      description: policyData.description || '',
      categoryId: policyData.categoryId || null,
      costCenterId: policyData.costCenterId || null,
      minAmount: policyData.minAmount,
      maxAmount: policyData.maxAmount,
      approvers: policyData.approvers,
      conditions: policyData.conditions,
      priority: policyData.priority,
      status: policyData.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), policyDoc);

    return {
      id: docRef.id,
      ...policyDoc
    } as ApprovalPolicy;
  } catch (error) {
    console.error('Erro ao criar política:', error);
    throw error;
  }
};

// Atualizar política
export const updatePolicy = async (
  id: string, 
  updates: Partial<Omit<ApprovalPolicy, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
  } catch (error) {
    console.error('Erro ao atualizar política:', error);
    throw error;
  }
};

// Deletar política
export const deletePolicy = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Erro ao deletar política:', error);
    throw error;
  }
};

// Ativar/desativar política
export const togglePolicyStatus = async (id: string): Promise<void> => {
  try {
    const policy = await getPolicyById(id);
    if (!policy) throw new Error('Política não encontrada');

    const newStatus = policy.status === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: newStatus,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao alterar status da política:', error);
    throw error;
  }
};

// Encontrar política aplicável para uma solicitação
export const findApplicablePolicy = async (
  amount: number,
  categoryId?: string,
  costCenterId?: string
): Promise<ApprovalPolicy | null> => {
  try {
    let q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'active'),
      where('minAmount', '<=', amount),
      where('maxAmount', '>=', amount),
      orderBy('priority', 'asc')
    );

    const snapshot = await getDocs(q);
    const policies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ApprovalPolicy[];

    // Filtrar por categoria e centro de custo
    const applicablePolicies = policies.filter(policy => {
      // Se a política especifica categoria, deve coincidir
      if (policy.categoryId && policy.categoryId !== categoryId) {
        return false;
      }

      // Se a política especifica centro de custo, deve coincidir
      if (policy.costCenterId && policy.costCenterId !== costCenterId) {
        return false;
      }

      return true;
    });

    // Retornar a política de maior prioridade (menor número)
    return applicablePolicies.length > 0 ? applicablePolicies[0] : null;
  } catch (error) {
    console.error('Erro ao encontrar política aplicável:', error);
    throw error;
  }
};

// Obter próximo aprovador para uma solicitação
export const getNextApprover = async (
  policyId: string,
  currentLevel: number = 0,
  approvalHistory: Array<{
    approverId: string;
    level: number;
    action: 'approved' | 'rejected';
  }> = []
): Promise<{
  approverId: string;
  userName: string;
  level: number;
  isRequired: boolean;
  canSkip: boolean;
} | null> => {
  try {
    const policy = await getPolicyById(policyId);
    if (!policy) return null;

    // Ordenar aprovadores por nível
    const sortedApprovers = [...policy.approvers].sort((a, b) => a.level - b.level);

    // Encontrar aprovadores que já aprovaram
    const approvedLevels = approvalHistory
      .filter(h => h.action === 'approved')
      .map(h => h.level);

    // Encontrar próximo nível que precisa de aprovação
    for (const approver of sortedApprovers) {
      // Se este nível já foi aprovado, pular
      if (approvedLevels.includes(approver.level)) {
        continue;
      }

      // Se é um aprovador obrigatório ou não há aprovação paralela
      if (approver.isRequired || !policy.conditions.allowParallelApproval) {
        // Verificar se todos os níveis anteriores obrigatórios foram aprovados
        const previousRequiredLevels = sortedApprovers
          .filter(a => a.level < approver.level && a.isRequired)
          .map(a => a.level);

        const allPreviousApproved = previousRequiredLevels.every(level => 
          approvedLevels.includes(level)
        );

        if (allPreviousApproved) {
          return {
            approverId: approver.userId,
            userName: approver.userName,
            level: approver.level,
            isRequired: approver.isRequired,
            canSkip: approver.canSkip
          };
        }
      } else {
        // Aprovação paralela permitida
        return {
          approverId: approver.userId,
          userName: approver.userName,
          level: approver.level,
          isRequired: approver.isRequired,
          canSkip: approver.canSkip
        };
      }
    }

    return null; // Todos os aprovadores necessários já aprovaram
  } catch (error) {
    console.error('Erro ao obter próximo aprovador:', error);
    throw error;
  }
};

// Verificar se solicitação está totalmente aprovada
export const isFullyApproved = async (
  policyId: string,
  approvalHistory: Array<{
    approverId: string;
    level: number;
    action: 'approved' | 'rejected';
  }> = []
): Promise<boolean> => {
  try {
    const policy = await getPolicyById(policyId);
    if (!policy) return false;

    const approvedLevels = approvalHistory
      .filter(h => h.action === 'approved')
      .map(h => h.level);

    if (policy.conditions.requiresAllApprovers) {
      // Todos os aprovadores devem aprovar
      const allLevels = policy.approvers.map(a => a.level);
      return allLevels.every(level => approvedLevels.includes(level));
    } else {
      // Apenas aprovadores obrigatórios devem aprovar
      const requiredLevels = policy.approvers
        .filter(a => a.isRequired)
        .map(a => a.level);
      
      return requiredLevels.every(level => approvedLevels.includes(level));
    }
  } catch (error) {
    console.error('Erro ao verificar aprovação completa:', error);
    throw error;
  }
};

// Obter políticas por categoria
export const getPoliciesByCategory = async (categoryId: string): Promise<ApprovalPolicy[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('categoryId', '==', categoryId),
      where('status', '==', 'active'),
      orderBy('priority', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ApprovalPolicy[];
  } catch (error) {
    console.error('Erro ao buscar políticas por categoria:', error);
    throw error;
  }
};

// Obter políticas por centro de custo
export const getPoliciesByCostCenter = async (costCenterId: string): Promise<ApprovalPolicy[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('costCenterId', '==', costCenterId),
      where('status', '==', 'active'),
      orderBy('priority', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ApprovalPolicy[];
  } catch (error) {
    console.error('Erro ao buscar políticas por centro de custo:', error);
    throw error;
  }
};

// Duplicar política
export const duplicatePolicy = async (id: string, newName: string): Promise<ApprovalPolicy> => {
  try {
    const originalPolicy = await getPolicyById(id);
    if (!originalPolicy) throw new Error('Política não encontrada');

    const duplicatedData = {
      ...originalPolicy,
      name: newName,
      status: 'inactive' as const, // Nova política inicia inativa
      priority: originalPolicy.priority + 1, // Incrementar prioridade
    };

    delete (duplicatedData as any).id;
    delete (duplicatedData as any).createdAt;
    delete (duplicatedData as any).updatedAt;

    return await createPolicy(duplicatedData);
  } catch (error) {
    console.error('Erro ao duplicar política:', error);
    throw error;
  }
};

// Reordenar prioridades
export const reorderPolicies = async (policyIds: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);

    policyIds.forEach((id, index) => {
      const policyRef = doc(db, COLLECTION_NAME, id);
      batch.update(policyRef, {
        priority: index + 1,
        updatedAt: new Date()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Erro ao reordenar políticas:', error);
    throw error;
  }
};

