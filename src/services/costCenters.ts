// Serviços para gestão de centros de custo
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { CostCenter, PaginationParams, PaginatedResponse } from '../types';

const COLLECTION_NAME = 'cost-centers';

// Obter centro de custo por ID
export const getCostCenterById = async (id: string): Promise<CostCenter | null> => {
  try {
    const ccDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!ccDoc.exists()) return null;

    return {
      id: ccDoc.id,
      ...ccDoc.data(),
      createdAt: ccDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: ccDoc.data().updatedAt?.toDate() || new Date(),
    } as CostCenter;
  } catch (error) {
    console.error('Erro ao buscar centro de custo:', error);
    throw error;
  }
};

// Listar centros de custo com paginação
export const getCostCenters = async (
  params: PaginationParams & {
    status?: string;
    search?: string;
    managerId?: string;
  } = { page: 1, limit: 20 }
): Promise<PaginatedResponse<CostCenter>> => {
  try {
    let q = query(collection(db, COLLECTION_NAME));

    // Filtros
    if (params.status) {
      q = query(q, where('status', '==', params.status));
    }

    if (params.managerId) {
      q = query(q, where('managerId', '==', params.managerId));
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
    let costCenters = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as CostCenter[];

    // Aplicar offset simulado
    if (params.page > 1) {
      const offset = (params.page - 1) * params.limit;
      costCenters = costCenters.slice(offset);
    }

    // Filtro de busca no frontend
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      costCenters = costCenters.filter(cc => 
        cc.name.toLowerCase().includes(searchLower) ||
        cc.code.toLowerCase().includes(searchLower) ||
        cc.description?.toLowerCase().includes(searchLower)
      );
    }

    const total = snapshot.size;
    const totalPages = Math.ceil(total / params.limit);

    return {
      data: costCenters,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  } catch (error) {
    console.error('Erro ao listar centros de custo:', error);
    throw error;
  }
};

// Gerar código sequencial do centro de custo com prefixo CC
const generateCostCenterCode = async (): Promise<string> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('code', '>=', 'CC'),
    where('code', '<', 'CD'),
    orderBy('code', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  let nextNumber = 1;

  if (!snapshot.empty) {
    const lastCode = snapshot.docs[0].data().code as string;
    const match = lastCode.match(/CC(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `CC${String(nextNumber).padStart(3, '0')}`;
};

// Criar centro de custo
export const createCostCenter = async (ccData: {
  name: string;
  description?: string;
  managerId: string;
  parentId?: string;
  budget?: number;
}): Promise<CostCenter> => {
  try {
    const code = await generateCostCenterCode();
    const ccDoc = {
      name: ccData.name,
      code,
      description: ccData.description || '',
      managerId: ccData.managerId,
      parentId: ccData.parentId || null,
      budget: ccData.budget || 0,
      spent: 0,
      committed: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), ccDoc);

    return {
      id: docRef.id,
      ...ccDoc
    } as CostCenter;
  } catch (error) {
    console.error('Erro ao criar centro de custo:', error);
    throw error;
  }
};

// Atualizar centro de custo
export const updateCostCenter = async (
  id: string, 
  updates: Partial<Omit<CostCenter, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
  } catch (error) {
    console.error('Erro ao atualizar centro de custo:', error);
    throw error;
  }
};

// Desativar centro de custo (soft delete)
export const deactivateCostCenter = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'inactive',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao desativar centro de custo:', error);
    throw error;
  }
};

// Reativar centro de custo
export const reactivateCostCenter = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'active',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao reativar centro de custo:', error);
    throw error;
  }
};

// Obter centros de custo por gerente
export const getCostCentersByManager = async (managerId: string): Promise<CostCenter[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('managerId', '==', managerId),
      where('status', '==', 'active'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as CostCenter[];
  } catch (error) {
    console.error('Erro ao buscar centros de custo por gerente:', error);
    throw error;
  }
};

// Obter centros de custo filhos
export const getChildCostCenters = async (parentId: string): Promise<CostCenter[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('parentId', '==', parentId),
      where('status', '==', 'active'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as CostCenter[];
  } catch (error) {
    console.error('Erro ao buscar centros de custo filhos:', error);
    throw error;
  }
};

// Verificar se código já existe
export const checkCodeExists = async (code: string, excludeId?: string): Promise<boolean> => {
  try {
    let q = query(
      collection(db, COLLECTION_NAME),
      where('code', '==', code),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (excludeId) {
      // Se estamos editando, excluir o próprio registro da verificação
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    throw error;
  }
};

// Obter centros de custo ativos
export const getActiveCostCenters = async (): Promise<CostCenter[]> => {
  try {
    // Buscar centros de custo ativos no Firestore. A ordenação é realizada
    // em memória para evitar necessidade de índices compostos.
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)) as CostCenter[];
  } catch (error) {
    console.error('Erro ao buscar centros de custo ativos:', error);
    throw error;
  }
};

// Atualizar valores gastos/comprometidos
export const updateCostCenterAmounts = async (
  id: string, 
  amounts: { spent?: number; committed?: number }
): Promise<void> => {
  try {
    const updateData = {
      ...amounts,
      updatedAt: new Date()
    };

    await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
  } catch (error) {
    console.error('Erro ao atualizar valores do centro de custo:', error);
    throw error;
  }
};

// Obter hierarquia de centros de custo
export const getCostCenterHierarchy = async (): Promise<CostCenter[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'active'),
      orderBy('code')
    );

    const snapshot = await getDocs(q);
    const costCenters = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as CostCenter[];

    // Organizar em hierarquia (pais primeiro, depois filhos)
    const parents = costCenters.filter(cc => !cc.parentId);
    const children = costCenters.filter(cc => cc.parentId);

    const hierarchy: CostCenter[] = [];
    
    parents.forEach(parent => {
      hierarchy.push(parent);
      const parentChildren = children.filter(child => child.parentId === parent.id);
      hierarchy.push(...parentChildren);
    });

    return hierarchy;
  } catch (error) {
    console.error('Erro ao buscar hierarquia de centros de custo:', error);
    throw error;
  }
};

// Calcular utilização do orçamento
export const calculateBudgetUtilization = (costCenter: CostCenter): {
  spentPercentage: number;
  committedPercentage: number;
  availablePercentage: number;
  totalUsedPercentage: number;
} => {
  if (!costCenter.budget || costCenter.budget === 0) {
    return {
      spentPercentage: 0,
      committedPercentage: 0,
      availablePercentage: 0,
      totalUsedPercentage: 0,
    };
  }

  const spent = costCenter.spent || 0;
  const committed = costCenter.committed || 0;
  const budget = costCenter.budget;

  const spentPercentage = (spent / budget) * 100;
  const committedPercentage = (committed / budget) * 100;
  const totalUsedPercentage = spentPercentage + committedPercentage;
  const availablePercentage = Math.max(0, 100 - totalUsedPercentage);

  return {
    spentPercentage: Math.round(spentPercentage * 100) / 100,
    committedPercentage: Math.round(committedPercentage * 100) / 100,
    availablePercentage: Math.round(availablePercentage * 100) / 100,
    totalUsedPercentage: Math.round(totalUsedPercentage * 100) / 100,
  };
};

