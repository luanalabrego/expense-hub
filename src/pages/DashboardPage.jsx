import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Target,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  useDashboardData,
  useRequestsByStatus,
  useTimeSeriesData,
  useTopVendors,
  useCostCenterAnalysis,
  useRequestsByCategory,
  useKPIAlerts,
  usePeriodComparison
} from '../hooks/useAnalytics';
import { useCostCenters } from '../hooks/useCostCenters';
import { useAuthStore } from '../stores/auth';
import { formatCurrency } from '../utils';

export const DashboardPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCostCenters, setSelectedCostCenters] = useState([]);
  const [chartType, setChartType] = useState('line');
  
  const { user, hasAnyRole } = useAuthStore();
  
  // Dados principais do dashboard
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardData(selectedPeriod);
  
  // Dados para gráficos
  const { data: statusData } = useRequestsByStatus();
  const { data: timeSeriesData } = useTimeSeriesData('monthly');
  const { data: topVendors } = useTopVendors(5);
  const { data: costCenterAnalysis } = useCostCenterAnalysis();
  const { data: categoryData } = useRequestsByCategory();
  
  // Alertas baseados em KPIs
  const { alerts, hasAlerts, criticalAlerts, warningAlerts } = useKPIAlerts({
    budgetUtilization: 90,
    approvalTime: 48,
    rejectionRate: 20,
    overdueRequests: 5,
  });
  
  // Dados dos centros de custo para filtros
  const { data: costCentersData } = useCostCenters({ limit: 100 });
  
  // Comparação de períodos
  const getCurrentPeriodRange = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: monthStart, endDate: now };
  };
  
  const getPreviousPeriodRange = () => {
    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: prevMonthStart, endDate: prevMonthEnd };
  };
  
  const periodComparison = usePeriodComparison(
    getCurrentPeriodRange(),
    getPreviousPeriodRange()
  );

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatChange = (change) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Visão geral dos KPIs financeiros e operacionais
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">7 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {hasAlerts && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Alertas do Sistema</span>
              <Badge variant="outline" className="ml-2">
                {criticalAlerts} críticos, {warningAlerts} avisos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.slice(0, 4).map((alert, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                  <AlertTriangle className={`h-4 w-4 ${alert.type === 'error' ? 'text-red-600' : 'text-yellow-600'}`} />
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Solicitações</p>
                <p className="text-2xl font-bold">{dashboardData?.financial?.totalRequests || 0}</p>
                {periodComparison.changes && (
                  <div className="flex items-center space-x-1 mt-1">
                    {getChangeIcon(periodComparison.changes.totalRequests.percentage)}
                    <span className={`text-xs ${getChangeColor(periodComparison.changes.totalRequests.percentage)}`}>
                      {formatChange(periodComparison.changes.totalRequests.percentage)}
                    </span>
                  </div>
                )}
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboardData?.financial?.totalAmount || 0)}
                </p>
                {periodComparison.changes && (
                  <div className="flex items-center space-x-1 mt-1">
                    {getChangeIcon(periodComparison.changes.totalAmount.percentage)}
                    <span className={`text-xs ${getChangeColor(periodComparison.changes.totalAmount.percentage)}`}>
                      {formatChange(periodComparison.changes.totalAmount.percentage)}
                    </span>
                  </div>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Aprovação</p>
                <p className="text-2xl font-bold">
                  {dashboardData?.operational?.approvalRate?.toFixed(1) || 0}%
                </p>
                {periodComparison.changes && (
                  <div className="flex items-center space-x-1 mt-1">
                    {getChangeIcon(periodComparison.changes.approvalRate.percentage)}
                    <span className={`text-xs ${getChangeColor(periodComparison.changes.approvalRate.percentage)}`}>
                      {formatChange(periodComparison.changes.approvalRate.percentage)}
                    </span>
                  </div>
                )}
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio de Aprovação</p>
                <p className="text-2xl font-bold">
                  {dashboardData?.operational?.averageApprovalTime?.toFixed(1) || 0}h
                </p>
                {periodComparison.changes && (
                  <div className="flex items-center space-x-1 mt-1">
                    {getChangeIcon(-periodComparison.changes.averageApprovalTime.percentage)} {/* Invertido: menos tempo é melhor */}
                    <span className={`text-xs ${getChangeColor(-periodComparison.changes.averageApprovalTime.percentage)}`}>
                      {formatChange(periodComparison.changes.averageApprovalTime.percentage)}
                    </span>
                  </div>
                )}
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes de Aprovação</p>
                <p className="text-xl font-bold">{dashboardData?.operational?.pendingApprovals || 0}</p>
              </div>
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solicitações Vencidas</p>
                <p className="text-xl font-bold">{dashboardData?.operational?.overdueRequests || 0}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilização Orçamentária</p>
                <p className="text-xl font-bold">
                  {dashboardData?.financial?.budgetUtilization?.toFixed(1) || 0}%
                </p>
              </div>
              <Target className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Distribuição por Status</span>
            </CardTitle>
            <CardDescription>
              Proporção de solicitações por status atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${(percentage || 0).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Quantidade']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Tendência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Tendência Mensal</span>
            </CardTitle>
            <CardDescription>
              Evolução de solicitações e valores ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'amount' ? formatCurrency(value) : value,
                    name === 'amount' ? 'Valor' : 'Quantidade'
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="requests" fill="#3b82f6" name="Solicitações" />
                <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#10b981" name="Valor Total" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Fornecedores e Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Fornecedores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Top Fornecedores</span>
            </CardTitle>
            <CardDescription>
              Fornecedores com maior volume de transações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topVendors?.map((vendor, index) => (
                <div key={vendor.vendorId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{vendor.vendorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.requestCount} solicitações
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(vendor.totalAmount)}</p>
                    <p className="text-sm text-muted-foreground">
                      Média: {formatCurrency(vendor.averageAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Categorias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Gastos por Categoria</span>
            </CardTitle>
            <CardDescription>
              Distribuição de gastos por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Valor Total']} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Centro de Custo */}
      {hasAnyRole(['admin', 'finance']) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Performance por Centro de Custo</span>
            </CardTitle>
            <CardDescription>
              Análise de execução orçamentária por departamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costCenterAnalysis?.slice(0, 5).map((cc) => (
                <div key={cc.costCenterId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{cc.costCenterName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {cc.requestCount} solicitações • Média: {formatCurrency(cc.averageRequestValue)}
                      </p>
                    </div>
                    <Badge variant={cc.utilizationRate > 90 ? 'destructive' : cc.utilizationRate > 70 ? 'default' : 'secondary'}>
                      {cc.utilizationRate.toFixed(1)}% utilizado
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Planejado</p>
                      <p className="font-medium">{formatCurrency(cc.budgetPlanned)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gasto</p>
                      <p className="font-medium">{formatCurrency(cc.budgetSpent)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Comprometido</p>
                      <p className="font-medium">{formatCurrency(cc.budgetCommitted)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Disponível</p>
                      <p className="font-medium">{formatCurrency(cc.budgetAvailable)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

