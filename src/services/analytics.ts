// Serviços para analytics e KPIs do dashboard
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  endBefore,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  PaymentRequest, 
  Budget, 
  User, 
  Vendor, 
  CostCenter,
  Category 
} from '../types';

// Tipos para KPIs e Analytics
export interface DashboardKPIs {
  financial: {
    totalRequests: number;
    totalAmount: number;
    approvedAmount: number;
    pendingAmount: number;
    rejectedAmount: number;
    paidAmount: number;
    averageRequestValue: number;
    budgetUtilization: number;
  };
  operational: {
    requestsThisMonth: number;
    requestsLastMonth: number;
    averageApprovalTime: number;
    pendingApprovals: number;
    overdueRequests: number;
    approvalRate: number;
    rejectionRate: number;
  };
  trends: {
    monthlyGrowth: number;
    quarterlyGrowth: number;
    yearlyGrowth: number;
    seasonalTrend: 'up' | 'down' | 'stable';
  };
}

export interface ChartData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
  [key: string]: any;
}

export interface TimeSeriesData {
  period: string;
  date: Date;
  requests: number;
  amount: number;
  approved: number;
  rejected: number;
  pending: number;
}

export interface TopVendorsData {
  vendorId: string;
  vendorName: string;
  totalAmount: number;
  requestCount: number;
  averageAmount: number;
  lastRequest: Date;
}

export interface PaymentForecastData {
  date: string;
  dueDate: Date;
  amount: number;
  count: number;
}

export interface CostCenterAnalysis {
  costCenterId: string;
  costCenterName: string;
  budgetPlanned: number;
  budgetSpent: number;
  budgetCommitted: number;
  budgetAvailable: number;
  utilizationRate: number;
  requestCount: number;
  averageRequestValue: number;
}

// Obter KPIs do dashboard
export const getDashboardKPIs = async (
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
    categoryIds?: string[];
  } = {}
): Promise<DashboardKPIs> => {
  try {
    const { startDate, endDate, costCenterIds, categoryIds } = filters;
    
    // Query base para solicitações
    let requestsQuery = query(collection(db, 'payment-requests'));
    
    // Aplicar filtros de data
    if (startDate) {
      requestsQuery = query(requestsQuery, where('createdAt', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      requestsQuery = query(requestsQuery, where('createdAt', '<=', Timestamp.fromDate(endDate)));
    }
    
    // Aplicar filtros de centro de custo
    if (costCenterIds && costCenterIds.length > 0) {
      requestsQuery = query(requestsQuery, where('costCenterId', 'in', costCenterIds));
    }
    
    // Aplicar filtros de categoria
    if (categoryIds && categoryIds.length > 0) {
      requestsQuery = query(requestsQuery, where('categoryId', 'in', categoryIds));
    }
    
    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as PaymentRequest[];

    // Calcular KPIs financeiros
    const totalRequests = requests.length;
    const totalAmount = requests.reduce((sum, r) => sum + r.amount, 0);
    const approvedRequests = requests.filter(r => ['pending_payment_approval', 'paid'].includes(r.status));
    const pendingRequests = requests.filter(
      r => r.status.startsWith('pending_') && r.status !== 'pending_payment_approval'
    );
    const rejectedRequests = requests.filter(r => ['rejected', 'cancelled'].includes(r.status));
    const paidRequests = requests.filter(r => r.status === 'paid');
    
    const approvedAmount = approvedRequests.reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = pendingRequests.reduce((sum, r) => sum + r.amount, 0);
    const rejectedAmount = rejectedRequests.reduce((sum, r) => sum + r.amount, 0);
    const paidAmount = paidRequests.reduce((sum, r) => sum + r.amount, 0);
    const averageRequestValue = totalRequests > 0 ? totalAmount / totalRequests : 0;

    // Calcular utilização orçamentária
    const budgetsQuery = query(collection(db, 'budgets'), where('status', 'in', ['active', 'approved']));
    const budgetsSnapshot = await getDocs(budgetsQuery);
    const budgets = budgetsSnapshot.docs.map(doc => doc.data()) as Budget[];
    
    const totalBudgetPlanned = budgets.reduce((sum, b) => sum + b.plannedAmount, 0);
    const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const budgetUtilization = totalBudgetPlanned > 0 ? (totalBudgetSpent / totalBudgetPlanned) * 100 : 0;

    // Calcular KPIs operacionais
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const requestsThisMonth = requests.filter(r => r.createdAt >= thisMonthStart).length;
    const requestsLastMonth = requests.filter(r => 
      r.createdAt >= lastMonthStart && r.createdAt <= lastMonthEnd
    ).length;

    // Calcular tempo médio de aprovação
    const approvedRequestsWithTime = approvedRequests.filter(r => r.updatedAt && r.createdAt);
    const totalApprovalTime = approvedRequestsWithTime.reduce((sum, r) => {
      const timeDiff = r.updatedAt.getTime() - r.createdAt.getTime();
      return sum + (timeDiff / (1000 * 60 * 60)); // em horas
    }, 0);
    const averageApprovalTime = approvedRequestsWithTime.length > 0 
      ? totalApprovalTime / approvedRequestsWithTime.length 
      : 0;

    const pendingApprovals = pendingRequests.length;
    
    // Calcular solicitações vencidas (mais de 7 dias pendentes)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const overdueRequests = pendingRequests.filter(r => r.createdAt < sevenDaysAgo).length;
    
    const approvalRate = totalRequests > 0 ? (approvedRequests.length / totalRequests) * 100 : 0;
    const rejectionRate = totalRequests > 0 ? (rejectedRequests.length / totalRequests) * 100 : 0;

    // Calcular tendências
    const monthlyGrowth = requestsLastMonth > 0 
      ? ((requestsThisMonth - requestsLastMonth) / requestsLastMonth) * 100 
      : 0;
    
    // Simplificado para demonstração
    const quarterlyGrowth = monthlyGrowth * 3; // Aproximação
    const yearlyGrowth = monthlyGrowth * 12; // Aproximação
    
    const seasonalTrend: 'up' | 'down' | 'stable' = 
      monthlyGrowth > 5 ? 'up' : 
      monthlyGrowth < -5 ? 'down' : 'stable';

    return {
      financial: {
        totalRequests,
        totalAmount,
        approvedAmount,
        pendingAmount,
        rejectedAmount,
        paidAmount,
        averageRequestValue,
        budgetUtilization,
      },
      operational: {
        requestsThisMonth,
        requestsLastMonth,
        averageApprovalTime,
        pendingApprovals,
        overdueRequests,
        approvalRate,
        rejectionRate,
      },
      trends: {
        monthlyGrowth,
        quarterlyGrowth,
        yearlyGrowth,
        seasonalTrend,
      },
    };
  } catch (error) {
    console.error('Erro ao obter KPIs:', error);
    throw error;
  }
};

// Obter dados para gráfico de status
export const getRequestsByStatus = async (
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
  } = {}
): Promise<ChartData[]> => {
  try {
    let requestsQuery = query(collection(db, 'payment-requests'));
    
    if (filters.startDate) {
      requestsQuery = query(requestsQuery, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      requestsQuery = query(requestsQuery, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }
    if (filters.costCenterIds && filters.costCenterIds.length > 0) {
      requestsQuery = query(requestsQuery, where('costCenterId', 'in', filters.costCenterIds));
    }
    
    const snapshot = await getDocs(requestsQuery);
    const requests = snapshot.docs.map(doc => doc.data()) as PaymentRequest[];
    
    const statusCounts = requests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const statusLabels = {
      returned: 'Devolvido',
      pending_owner_approval: 'Ag. aprovação do owner',
      pending_director_approval: 'Ag. aprovação Diretor',
      pending_cfo_approval: 'Ag. aprovação CFO',
      pending_ceo_approval: 'Ag. aprovação CEO',
      pending_payment_approval: 'Ag. aprovação de pagamento',
      rejected: 'Rejeitado',
      cancelled: 'Cancelado',
      paid: 'Pagamento realizado',
    };

    const statusColors = {
      returned: '#06b6d4',
      pending_owner_approval: '#f59e0b',
      pending_director_approval: '#6366f1',
      pending_cfo_approval: '#ec4899',
      pending_ceo_approval: '#f97316',
      pending_payment_approval: '#3b82f6',
      rejected: '#ef4444',
      cancelled: '#6b7280',
      paid: '#10b981',
    };
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status as keyof typeof statusLabels] || status,
      value: count,
      color: statusColors[status as keyof typeof statusColors] || '#6b7280',
    }));
  } catch (error) {
    console.error('Erro ao obter dados por status:', error);
    throw error;
  }
};

// Obter dados de série temporal
export const getTimeSeriesData = async (
  period: 'daily' | 'weekly' | 'monthly' = 'monthly',
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
  } = {}
): Promise<TimeSeriesData[]> => {
  try {
    let requestsQuery = query(collection(db, 'payment-requests'), orderBy('createdAt', 'asc'));
    
    if (filters.startDate) {
      requestsQuery = query(requestsQuery, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      requestsQuery = query(requestsQuery, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }
    if (filters.costCenterIds && filters.costCenterIds.length > 0) {
      requestsQuery = query(requestsQuery, where('costCenterId', 'in', filters.costCenterIds));
    }
    
    const snapshot = await getDocs(requestsQuery);
    const requests = snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as PaymentRequest[];
    
    // Agrupar por período
    const groupedData = requests.reduce((acc, request) => {
      let periodKey: string;
      const date = request.createdAt;
      
      switch (period) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }
      
      if (!acc[periodKey]) {
        acc[periodKey] = {
          period: periodKey,
          date: new Date(periodKey),
          requests: 0,
          amount: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
        };
      }
      
      acc[periodKey].requests += 1;
      acc[periodKey].amount += request.amount;
      
      if (['pending_payment_approval', 'paid'].includes(request.status)) {
        acc[periodKey].approved += 1;
      } else if (['rejected', 'cancelled'].includes(request.status)) {
        acc[periodKey].rejected += 1;
      } else if (request.status.startsWith('pending_')) {
        acc[periodKey].pending += 1;
      }
      
      return acc;
    }, {} as Record<string, TimeSeriesData>);
    
    return Object.values(groupedData).sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Erro ao obter dados de série temporal:', error);
    throw error;
  }
};

// Obter previsão de pagamentos por data de vencimento
export const getPaymentForecast = async (
  filters: { startDate?: Date; endDate?: Date } = {}
): Promise<PaymentForecastData[]> => {
  try {
    let requestsQuery = query(
      collection(db, 'payment-requests'),
      where('status', '==', 'pending_payment_approval'),
      orderBy('dueDate', 'asc')
    );

    if (filters.startDate) {
      requestsQuery = query(requestsQuery, where('dueDate', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      requestsQuery = query(requestsQuery, where('dueDate', '<=', Timestamp.fromDate(filters.endDate)));
    }

    const snapshot = await getDocs(requestsQuery);
    const requests = snapshot.docs.map(doc => ({
      ...doc.data(),
      dueDate: doc.data().dueDate?.toDate() || new Date(),
    })) as PaymentRequest[];

    const grouped = requests.reduce((acc, request) => {
      const key = request.dueDate.toISOString().split('T')[0];
      if (!acc[key]) {
        acc[key] = { date: key, dueDate: new Date(key), amount: 0, count: 0 };
      }
      acc[key].amount += request.amount;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, PaymentForecastData>);

    return Object.values(grouped).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  } catch (error) {
    console.error('Erro ao obter previsão de pagamentos:', error);
    throw error;
  }
};

// Obter top fornecedores
export const getTopVendors = async (
  limit: number = 10,
  filters: {
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<TopVendorsData[]> => {
  try {
    let requestsQuery = query(collection(db, 'payment-requests'));
    
    if (filters.startDate) {
      requestsQuery = query(requestsQuery, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      requestsQuery = query(requestsQuery, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }
    
    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = requestsSnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as PaymentRequest[];
    
    // Obter dados dos fornecedores
    const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
    const vendors = vendorsSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {} as Record<string, any>);
    
    // Agrupar por fornecedor
    const vendorStats = requests.reduce((acc, request) => {
      const vendorId = request.vendorId;
      if (!vendorId) return acc;
      
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendorId,
          vendorName: vendors[vendorId]?.name || 'Fornecedor Desconhecido',
          totalAmount: 0,
          requestCount: 0,
          lastRequest: request.createdAt,
        };
      }
      
      acc[vendorId].totalAmount += request.amount;
      acc[vendorId].requestCount += 1;
      
      if (request.createdAt > acc[vendorId].lastRequest) {
        acc[vendorId].lastRequest = request.createdAt;
      }
      
      return acc;
    }, {} as Record<string, Omit<TopVendorsData, 'averageAmount'>>);
    
    // Calcular média e ordenar
    const topVendors = Object.values(vendorStats)
      .map(vendor => ({
        ...vendor,
        averageAmount: vendor.requestCount > 0 ? vendor.totalAmount / vendor.requestCount : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
    
    return topVendors;
  } catch (error) {
    console.error('Erro ao obter top fornecedores:', error);
    throw error;
  }
};

// Obter análise por centro de custo
export const getCostCenterAnalysis = async (
  filters: {
    year?: number;
    costCenterIds?: string[];
  } = {}
): Promise<CostCenterAnalysis[]> => {
  try {
    // Obter orçamentos
    let budgetsQuery = query(collection(db, 'budgets'));
    if (filters.year) {
      budgetsQuery = query(budgetsQuery, where('year', '==', filters.year));
    }
    if (filters.costCenterIds && filters.costCenterIds.length > 0) {
      budgetsQuery = query(budgetsQuery, where('costCenterId', 'in', filters.costCenterIds));
    }
    
    const budgetsSnapshot = await getDocs(budgetsQuery);
    const budgets = budgetsSnapshot.docs.map(doc => doc.data()) as Budget[];
    
    // Obter solicitações
    let requestsQuery = query(collection(db, 'payment-requests'));
    if (filters.costCenterIds && filters.costCenterIds.length > 0) {
      requestsQuery = query(requestsQuery, where('costCenterId', 'in', filters.costCenterIds));
    }
    
    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = requestsSnapshot.docs.map(doc => doc.data()) as PaymentRequest[];
    
    // Obter centros de custo
    const costCentersSnapshot = await getDocs(collection(db, 'cost-centers'));
    const costCenters = costCentersSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {} as Record<string, any>);
    
    // Agrupar dados por centro de custo
    const costCenterIds = new Set([
      ...budgets.map(b => b.costCenterId),
      ...requests.map(r => r.costCenterId),
    ]);
    
    const analysis = Array.from(costCenterIds).map(costCenterId => {
      const ccBudgets = budgets.filter(b => b.costCenterId === costCenterId);
      const ccRequests = requests.filter(r => r.costCenterId === costCenterId);
      
      const budgetPlanned = ccBudgets.reduce((sum, b) => sum + b.plannedAmount, 0);
      const budgetSpent = ccBudgets.reduce((sum, b) => sum + b.spentAmount, 0);
      const budgetCommitted = ccBudgets.reduce((sum, b) => sum + b.committedAmount, 0);
      const budgetAvailable = ccBudgets.reduce((sum, b) => sum + b.availableAmount, 0);
      
      const utilizationRate = budgetPlanned > 0 ? (budgetSpent / budgetPlanned) * 100 : 0;
      const requestCount = ccRequests.length;
      const totalRequestAmount = ccRequests.reduce((sum, r) => sum + r.amount, 0);
      const averageRequestValue = requestCount > 0 ? totalRequestAmount / requestCount : 0;
      
      return {
        costCenterId,
        costCenterName: costCenters[costCenterId]?.name || 'Centro de Custo Desconhecido',
        budgetPlanned,
        budgetSpent,
        budgetCommitted,
        budgetAvailable,
        utilizationRate,
        requestCount,
        averageRequestValue,
      };
    });
    
    return analysis.sort((a, b) => b.budgetPlanned - a.budgetPlanned);
  } catch (error) {
    console.error('Erro ao obter análise por centro de custo:', error);
    throw error;
  }
};

// Obter dados para gráfico de categorias
export const getRequestsByCategory = async (
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
  } = {}
): Promise<ChartData[]> => {
  try {
    let requestsQuery = query(collection(db, 'payment-requests'));
    
    if (filters.startDate) {
      requestsQuery = query(requestsQuery, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      requestsQuery = query(requestsQuery, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }
    if (filters.costCenterIds && filters.costCenterIds.length > 0) {
      requestsQuery = query(requestsQuery, where('costCenterId', 'in', filters.costCenterIds));
    }
    
    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = requestsSnapshot.docs.map(doc => doc.data()) as PaymentRequest[];
    
    // Obter categorias
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categories = categoriesSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {} as Record<string, any>);
    
    // Agrupar por categoria
    const categoryStats = requests.reduce((acc, request) => {
      const categoryId = request.categoryId;
      if (!categoryId) return acc;
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          name: categories[categoryId]?.name || 'Categoria Desconhecida',
          value: 0,
          count: 0,
        };
      }
      
      acc[categoryId].value += request.amount;
      acc[categoryId].count += 1;
      
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);
    
    return Object.values(categoryStats)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 categorias
  } catch (error) {
    console.error('Erro ao obter dados por categoria:', error);
    throw error;
  }
};

