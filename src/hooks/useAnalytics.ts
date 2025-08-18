// Hooks React Query para analytics e KPIs
import { useQuery } from '@tanstack/react-query';
import { queryOptions } from '../lib/react-query';
import * as analyticsService from '../services/analytics';

// Hook para obter KPIs do dashboard
export const useDashboardKPIs = (
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
    categoryIds?: string[];
  } = {}
) => {
  return useQuery({
    queryKey: ['analytics', 'dashboard-kpis', filters],
    queryFn: () => analyticsService.getDashboardKPIs(filters),
    ...queryOptions.realtime, // Atualização frequente para KPIs
  });
};

// Hook para obter dados por status
export const useRequestsByStatus = (
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
  } = {}
) => {
  return useQuery({
    queryKey: ['analytics', 'requests-by-status', filters],
    queryFn: () => analyticsService.getRequestsByStatus(filters),
    ...queryOptions.dynamic,
  });
};

// Hook para obter dados de série temporal
export const useTimeSeriesData = (
  period: 'daily' | 'weekly' | 'monthly' = 'monthly',
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
  } = {}
) => {
  return useQuery({
    queryKey: ['analytics', 'time-series', period, filters],
    queryFn: () => analyticsService.getTimeSeriesData(period, filters),
    ...queryOptions.dynamic,
  });
};

// Hook para obter previsão de pagamentos
export const usePaymentForecast = (
  filters: { startDate?: Date; endDate?: Date } = {}
) => {
  return useQuery({
    queryKey: ['analytics', 'payment-forecast', filters],
    queryFn: () => analyticsService.getPaymentForecast(filters),
    ...queryOptions.dynamic,
  });
};

// Hook para obter top fornecedores
export const useTopVendors = (
  limit: number = 10,
  filters: {
    startDate?: Date;
    endDate?: Date;
  } = {}
) => {
  return useQuery({
    queryKey: ['analytics', 'top-vendors', limit, filters],
    queryFn: () => analyticsService.getTopVendors(limit, filters),
    ...queryOptions.dynamic,
  });
};

// Hook para obter análise por centro de custo
export const useCostCenterAnalysis = (
  filters: {
    year?: number;
    costCenterIds?: string[];
  } = {}
) => {
  return useQuery({
    queryKey: ['analytics', 'cost-center-analysis', filters],
    queryFn: () => analyticsService.getCostCenterAnalysis(filters),
    ...queryOptions.dynamic,
  });
};

// Hook para obter dados por categoria
export const useRequestsByCategory = (
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
  } = {}
) => {
  return useQuery({
    queryKey: ['analytics', 'requests-by-category', filters],
    queryFn: () => analyticsService.getRequestsByCategory(filters),
    ...queryOptions.dynamic,
  });
};

// Hook para obter KPIs financeiros específicos
export const useFinancialKPIs = (
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
    categoryIds?: string[];
  } = {}
) => {
  const { data: dashboardKPIs, ...rest } = useDashboardKPIs(filters);
  
  return {
    data: dashboardKPIs?.financial,
    ...rest,
  };
};

// Hook para obter KPIs operacionais específicos
export const useOperationalKPIs = (
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
    categoryIds?: string[];
  } = {}
) => {
  const { data: dashboardKPIs, ...rest } = useDashboardKPIs(filters);
  
  return {
    data: dashboardKPIs?.operational,
    ...rest,
  };
};

// Hook para obter tendências específicas
export const useTrends = (
  filters: {
    startDate?: Date;
    endDate?: Date;
    costCenterIds?: string[];
    categoryIds?: string[];
  } = {}
) => {
  const { data: dashboardKPIs, ...rest } = useDashboardKPIs(filters);
  
  return {
    data: dashboardKPIs?.trends,
    ...rest,
  };
};

// Hook para obter dados do dashboard com período personalizado
export const useDashboardData = (
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' = 'month',
  customRange?: { startDate: Date; endDate: Date }
) => {
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return { startDate: today, endDate: now };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { startDate: weekStart, endDate: now };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: monthStart, endDate: now };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return { startDate: quarterStart, endDate: now };
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { startDate: yearStart, endDate: now };
      case 'custom':
        return customRange || { startDate: today, endDate: now };
      default:
        return { startDate: today, endDate: now };
    }
  };

  const dateRange = getDateRange();
  
  return useDashboardKPIs(dateRange);
};

// Hook para comparar períodos
export const usePeriodComparison = (
  currentPeriod: { startDate: Date; endDate: Date },
  previousPeriod: { startDate: Date; endDate: Date }
) => {
  const currentData = useDashboardKPIs(currentPeriod);
  const previousData = useDashboardKPIs(previousPeriod);
  
  const comparison = {
    current: currentData.data,
    previous: previousData.data,
    isLoading: currentData.isLoading || previousData.isLoading,
    error: currentData.error || previousData.error,
    changes: currentData.data && previousData.data ? {
      totalRequests: {
        value: currentData.data.financial.totalRequests - previousData.data.financial.totalRequests,
        percentage: previousData.data.financial.totalRequests > 0 
          ? ((currentData.data.financial.totalRequests - previousData.data.financial.totalRequests) / previousData.data.financial.totalRequests) * 100
          : 0,
      },
      totalAmount: {
        value: currentData.data.financial.totalAmount - previousData.data.financial.totalAmount,
        percentage: previousData.data.financial.totalAmount > 0 
          ? ((currentData.data.financial.totalAmount - previousData.data.financial.totalAmount) / previousData.data.financial.totalAmount) * 100
          : 0,
      },
      approvalRate: {
        value: currentData.data.operational.approvalRate - previousData.data.operational.approvalRate,
        percentage: previousData.data.operational.approvalRate > 0 
          ? ((currentData.data.operational.approvalRate - previousData.data.operational.approvalRate) / previousData.data.operational.approvalRate) * 100
          : 0,
      },
      averageApprovalTime: {
        value: currentData.data.operational.averageApprovalTime - previousData.data.operational.averageApprovalTime,
        percentage: previousData.data.operational.averageApprovalTime > 0 
          ? ((currentData.data.operational.averageApprovalTime - previousData.data.operational.averageApprovalTime) / previousData.data.operational.averageApprovalTime) * 100
          : 0,
      },
    } : null,
  };
  
  return comparison;
};

// Hook para alertas e notificações baseadas em KPIs
export const useKPIAlerts = (
  thresholds: {
    budgetUtilization?: number;
    approvalTime?: number;
    rejectionRate?: number;
    overdueRequests?: number;
  } = {}
) => {
  const { data: kpis } = useDashboardKPIs();
  
  const alerts = [];
  
  if (kpis) {
    // Alerta de utilização orçamentária
    if (thresholds.budgetUtilization && kpis.financial.budgetUtilization > thresholds.budgetUtilization) {
      alerts.push({
        type: 'warning',
        title: 'Utilização Orçamentária Alta',
        message: `Utilização atual: ${kpis.financial.budgetUtilization.toFixed(1)}%`,
        value: kpis.financial.budgetUtilization,
        threshold: thresholds.budgetUtilization,
      });
    }
    
    // Alerta de tempo de aprovação
    if (thresholds.approvalTime && kpis.operational.averageApprovalTime > thresholds.approvalTime) {
      alerts.push({
        type: 'warning',
        title: 'Tempo de Aprovação Alto',
        message: `Tempo médio: ${kpis.operational.averageApprovalTime.toFixed(1)} horas`,
        value: kpis.operational.averageApprovalTime,
        threshold: thresholds.approvalTime,
      });
    }
    
    // Alerta de taxa de rejeição
    if (thresholds.rejectionRate && kpis.operational.rejectionRate > thresholds.rejectionRate) {
      alerts.push({
        type: 'error',
        title: 'Taxa de Rejeição Alta',
        message: `Taxa atual: ${kpis.operational.rejectionRate.toFixed(1)}%`,
        value: kpis.operational.rejectionRate,
        threshold: thresholds.rejectionRate,
      });
    }
    
    // Alerta de solicitações vencidas
    if (thresholds.overdueRequests && kpis.operational.overdueRequests > thresholds.overdueRequests) {
      alerts.push({
        type: 'error',
        title: 'Solicitações Vencidas',
        message: `${kpis.operational.overdueRequests} solicitações pendentes há mais de 7 dias`,
        value: kpis.operational.overdueRequests,
        threshold: thresholds.overdueRequests,
      });
    }
  }
  
  return {
    alerts,
    hasAlerts: alerts.length > 0,
    criticalAlerts: alerts.filter(a => a.type === 'error').length,
    warningAlerts: alerts.filter(a => a.type === 'warning').length,
  };
};

