// Serviços para gestão de orçamentos e forecast
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
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import type { Budget, BudgetPeriod, ForecastData, PaginationParams, PaginatedResponse } from '../types';

const BUDGETS_COLLECTION = 'budgets';
const FORECASTS_COLLECTION = 'forecasts';

// Obter orçamento por ID
export const getBudgetById = async (id: string): Promise<Budget | null> => {
  try {
    const budgetDoc = await getDoc(doc(db, BUDGETS_COLLECTION, id));
    if (!budgetDoc.exists()) return null;

    return {
      id: budgetDoc.id,
      ...budgetDoc.data(),
      createdAt: budgetDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: budgetDoc.data().updatedAt?.toDate() || new Date(),
    } as Budget;
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    throw error;
  }
};

// Listar orçamentos com paginação
export const getBudgets = async (
  params: PaginationParams & {
    costCenterId?: string;
    categoryId?: string;
    period?: string;
    year?: number;
    status?: 'draft' | 'approved' | 'active' | 'closed';
    search?: string;
  } = { page: 1, limit: 20 }
): Promise<PaginatedResponse<Budget>> => {
  try {
    let q = query(collection(db, BUDGETS_COLLECTION));

    // Filtros
    if (params.costCenterId) {
      q = query(q, where('costCenterId', '==', params.costCenterId));
    }

    if (params.categoryId) {
      q = query(q, where('categoryId', '==', params.categoryId));
    }

    if (params.period) {
      q = query(q, where('period', '==', params.period));
    }

    if (params.year) {
      q = query(q, where('year', '==', params.year));
    }

    if (params.status) {
      q = query(q, where('status', '==', params.status));
    }

    // Ordenação
    const sortField = params.sortBy || 'year';
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
    let budgets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Budget[];

    // Aplicar offset simulado
    if (params.page > 1) {
      const offset = (params.page - 1) * params.limit;
      budgets = budgets.slice(offset);
    }

    // Filtros adicionais no frontend
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      budgets = budgets.filter(budget => 
        budget.name?.toLowerCase().includes(searchLower) ||
        budget.description?.toLowerCase().includes(searchLower)
      );
    }

    const total = snapshot.size;
    const totalPages = Math.ceil(total / params.limit);

    return {
      data: budgets,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  } catch (error) {
    console.error('Erro ao listar orçamentos:', error);
    throw error;
  }
};

// Criar orçamento
export const createBudget = async (budgetData: {
  name: string;
  description?: string;
  costCenterId: string;
  categoryId?: string;
  year: number;
  period: BudgetPeriod;
  plannedAmount: number;
  currency: string;
  status: 'draft' | 'approved' | 'active' | 'closed';
  breakdown?: {
    month: number;
    amount: number;
  }[];
  createdBy: string;
}): Promise<Budget> => {
  try {
    const budgetDoc = {
      name: budgetData.name,
      description: budgetData.description || '',
      costCenterId: budgetData.costCenterId,
      categoryId: budgetData.categoryId || null,
      year: budgetData.year,
      period: budgetData.period,
      plannedAmount: budgetData.plannedAmount,
      spentAmount: 0,
      committedAmount: 0,
      availableAmount: budgetData.plannedAmount,
      currency: budgetData.currency,
      status: budgetData.status,
      breakdown: budgetData.breakdown || [],
      createdBy: budgetData.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, BUDGETS_COLLECTION), budgetDoc);

    return {
      id: docRef.id,
      ...budgetDoc
    } as Budget;
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    throw error;
  }
};

// Atualizar orçamento
export const updateBudget = async (
  id: string, 
  updates: Partial<Omit<Budget, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    // Recalcular valor disponível se necessário
    if (updates.plannedAmount !== undefined || updates.spentAmount !== undefined || updates.committedAmount !== undefined) {
      const budget = await getBudgetById(id);
      if (budget) {
        const plannedAmount = updates.plannedAmount ?? budget.plannedAmount;
        const spentAmount = updates.spentAmount ?? budget.spentAmount;
        const committedAmount = updates.committedAmount ?? budget.committedAmount;
        
        updateData.availableAmount = plannedAmount - spentAmount - committedAmount;
      }
    }

    await updateDoc(doc(db, BUDGETS_COLLECTION, id), updateData);
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    throw error;
  }
};

// Deletar orçamento
export const deleteBudget = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, BUDGETS_COLLECTION, id));
  } catch (error) {
    console.error('Erro ao deletar orçamento:', error);
    throw error;
  }
};

// Comprometer valor no orçamento
export const commitBudgetAmount = async (
  costCenterId: string,
  categoryId: string | null,
  amount: number,
  year: number,
  month: number
): Promise<void> => {
  try {
    // Buscar orçamento aplicável
    const budget = await findApplicableBudget(costCenterId, categoryId, year, month);
    
    if (budget) {
      await updateDoc(doc(db, BUDGETS_COLLECTION, budget.id), {
        committedAmount: increment(amount),
        availableAmount: increment(-amount),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Erro ao comprometer valor:', error);
    throw error;
  }
};

// Gastar valor do orçamento (mover de comprometido para gasto)
export const spendBudgetAmount = async (
  costCenterId: string,
  categoryId: string | null,
  amount: number,
  year: number,
  month: number
): Promise<void> => {
  try {
    // Buscar orçamento aplicável
    const budget = await findApplicableBudget(costCenterId, categoryId, year, month);
    
    if (budget) {
      await updateDoc(doc(db, BUDGETS_COLLECTION, budget.id), {
        spentAmount: increment(amount),
        committedAmount: increment(-amount),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Erro ao gastar valor:', error);
    throw error;
  }
};

// Liberar valor comprometido
export const releaseBudgetAmount = async (
  costCenterId: string,
  categoryId: string | null,
  amount: number,
  year: number,
  month: number
): Promise<void> => {
  try {
    // Buscar orçamento aplicável
    const budget = await findApplicableBudget(costCenterId, categoryId, year, month);
    
    if (budget) {
      await updateDoc(doc(db, BUDGETS_COLLECTION, budget.id), {
        committedAmount: increment(-amount),
        availableAmount: increment(amount),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Erro ao liberar valor:', error);
    throw error;
  }
};

// Encontrar orçamento aplicável
export const findApplicableBudget = async (
  costCenterId: string,
  categoryId: string | null,
  year: number,
  month: number
): Promise<Budget | null> => {
  try {
    let q = query(
      collection(db, BUDGETS_COLLECTION),
      where('costCenterId', '==', costCenterId),
      where('year', '==', year),
      where('status', 'in', ['approved', 'active']),
      orderBy('period', 'desc') // Preferir períodos mais específicos
    );

    const snapshot = await getDocs(q);
    const budgets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Budget[];

    // Filtrar por categoria se especificada
    const applicableBudgets = budgets.filter(budget => {
      // Se o orçamento especifica categoria, deve coincidir
      if (budget.categoryId && budget.categoryId !== categoryId) {
        return false;
      }

      // Verificar se o período se aplica ao mês
      switch (budget.period) {
        case 'monthly':
          // Para orçamento mensal, verificar se há breakdown para o mês
          return budget.breakdown?.some(b => b.month === month) || true;
        case 'quarterly':
          const quarter = Math.ceil(month / 3);
          return true; // Simplificado - aplicar a qualquer mês do ano
        case 'annual':
          return true;
        default:
          return false;
      }
    });

    // Retornar o orçamento mais específico (com categoria > sem categoria)
    return applicableBudgets.find(b => b.categoryId) || applicableBudgets[0] || null;
  } catch (error) {
    console.error('Erro ao encontrar orçamento aplicável:', error);
    throw error;
  }
};

// Obter orçamentos por centro de custo
export const getBudgetsByCostCenter = async (
  costCenterId: string,
  year?: number
): Promise<Budget[]> => {
  try {
    let q = query(
      collection(db, BUDGETS_COLLECTION),
      where('costCenterId', '==', costCenterId),
      orderBy('year', 'desc')
    );

    if (year) {
      q = query(q, where('year', '==', year));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Budget[];
  } catch (error) {
    console.error('Erro ao buscar orçamentos por centro de custo:', error);
    throw error;
  }
};

// Obter orçamentos por ano
export const getBudgetsByYear = async (year: number): Promise<Budget[]> => {
  try {
    const q = query(
      collection(db, BUDGETS_COLLECTION),
      where('year', '==', year),
      orderBy('costCenterId', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Budget[];
  } catch (error) {
    console.error('Erro ao buscar orçamentos por ano:', error);
    throw error;
  }
};

// Aprovar orçamento
export const approveBudget = async (id: string, approvedBy: string): Promise<void> => {
  try {
    await updateDoc(doc(db, BUDGETS_COLLECTION, id), {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao aprovar orçamento:', error);
    throw error;
  }
};

// Ativar orçamento
export const activateBudget = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, BUDGETS_COLLECTION, id), {
      status: 'active',
      activatedAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao ativar orçamento:', error);
    throw error;
  }
};

// Fechar orçamento
export const closeBudget = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, BUDGETS_COLLECTION, id), {
      status: 'closed',
      closedAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao fechar orçamento:', error);
    throw error;
  }
};

// Duplicar orçamento para novo período
export const duplicateBudget = async (
  id: string,
  newYear: number,
  newPeriod?: BudgetPeriod
): Promise<Budget> => {
  try {
    const originalBudget = await getBudgetById(id);
    if (!originalBudget) throw new Error('Orçamento não encontrado');

    const duplicatedData = {
      ...originalBudget,
      name: `${originalBudget.name} - ${newYear}`,
      year: newYear,
      period: newPeriod || originalBudget.period,
      status: 'draft' as const,
      spentAmount: 0,
      committedAmount: 0,
      availableAmount: originalBudget.plannedAmount,
    };

    delete (duplicatedData as any).id;
    delete (duplicatedData as any).createdAt;
    delete (duplicatedData as any).updatedAt;
    delete (duplicatedData as any).approvedBy;
    delete (duplicatedData as any).approvedAt;
    delete (duplicatedData as any).activatedAt;
    delete (duplicatedData as any).closedAt;

    return await createBudget(duplicatedData);
  } catch (error) {
    console.error('Erro ao duplicar orçamento:', error);
    throw error;
  }
};

// Estatísticas de orçamento
export const getBudgetStats = async (
  filters: {
    costCenterId?: string;
    year?: number;
    period?: BudgetPeriod;
  } = {}
): Promise<{
  totalPlanned: number;
  totalSpent: number;
  totalCommitted: number;
  totalAvailable: number;
  utilizationRate: number;
  budgetCount: number;
  overBudgetCount: number;
}> => {
  try {
    let q = query(collection(db, BUDGETS_COLLECTION));

    if (filters.costCenterId) {
      q = query(q, where('costCenterId', '==', filters.costCenterId));
    }

    if (filters.year) {
      q = query(q, where('year', '==', filters.year));
    }

    if (filters.period) {
      q = query(q, where('period', '==', filters.period));
    }

    const snapshot = await getDocs(q);
    const budgets = snapshot.docs.map(doc => doc.data()) as Budget[];

    const totalPlanned = budgets.reduce((sum, b) => sum + b.plannedAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const totalCommitted = budgets.reduce((sum, b) => sum + b.committedAmount, 0);
    const totalAvailable = budgets.reduce((sum, b) => sum + b.availableAmount, 0);
    const utilizationRate = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;
    const budgetCount = budgets.length;
    const overBudgetCount = budgets.filter(b => b.spentAmount > b.plannedAmount).length;

    return {
      totalPlanned,
      totalSpent,
      totalCommitted,
      totalAvailable,
      utilizationRate,
      budgetCount,
      overBudgetCount,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
};

// Criar forecast
export const createForecast = async (forecastData: {
  name: string;
  description?: string;
  costCenterId: string;
  categoryId?: string;
  year: number;
  projections: {
    month: number;
    projected: number;
    confidence: number;
  }[];
  methodology: string;
  assumptions: string[];
  createdBy: string;
}): Promise<ForecastData> => {
  try {
    const forecastDoc = {
      name: forecastData.name,
      description: forecastData.description || '',
      costCenterId: forecastData.costCenterId,
      categoryId: forecastData.categoryId || null,
      year: forecastData.year,
      projections: forecastData.projections,
      methodology: forecastData.methodology,
      assumptions: forecastData.assumptions,
      totalProjected: forecastData.projections.reduce((sum, p) => sum + p.projected, 0),
      averageConfidence: forecastData.projections.reduce((sum, p) => sum + p.confidence, 0) / forecastData.projections.length,
      createdBy: forecastData.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, FORECASTS_COLLECTION), forecastDoc);

    return {
      id: docRef.id,
      ...forecastDoc
    } as ForecastData;
  } catch (error) {
    console.error('Erro ao criar forecast:', error);
    throw error;
  }
};

// Obter forecasts
export const getForecasts = async (
  costCenterId?: string,
  year?: number
): Promise<ForecastData[]> => {
  try {
    let q = query(collection(db, FORECASTS_COLLECTION), orderBy('year', 'desc'));

    if (costCenterId) {
      q = query(q, where('costCenterId', '==', costCenterId));
    }

    if (year) {
      q = query(q, where('year', '==', year));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ForecastData[];
  } catch (error) {
    console.error('Erro ao buscar forecasts:', error);
    throw error;
  }
};

