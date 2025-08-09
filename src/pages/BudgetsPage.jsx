import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Eye, CheckCircle, Play, Square, Copy, Trash2, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Calendar, Target, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { 
  useBudgets,
  useBudgetStats,
  useApproveBudget,
  useActivateBudget,
  useCloseBudget,
  useDuplicateBudget,
  useDeleteBudget
} from '../hooks/useBudgets';
import { useCostCenters } from '../hooks/useCostCenters';
import { useCategories } from '../hooks/useCategories';
import { useAuthStore } from '../stores/auth';
import { formatCurrency } from '../utils';

export const BudgetsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [costCenterFilter, setCostCenterFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const { user, hasAnyRole } = useAuthStore();
  
  const { data: budgetsData, isLoading, error } = useBudgets({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    year: yearFilter ? parseInt(yearFilter) : undefined,
    costCenterId: costCenterFilter || undefined,
  });

  const { data: budgetStats } = useBudgetStats({
    year: yearFilter ? parseInt(yearFilter) : undefined,
    costCenterId: costCenterFilter || undefined,
  });

  const { data: costCentersData } = useCostCenters({ limit: 100 });
  const { data: categoriesData } = useCategories({ limit: 100 });

  const approveBudget = useApproveBudget();
  const activateBudget = useActivateBudget();
  const closeBudget = useCloseBudget();
  const duplicateBudget = useDuplicateBudget();
  const deleteBudget = useDeleteBudget();

  const handleApproveBudget = async (budgetId) => {
    if (window.confirm('Tem certeza que deseja aprovar este orçamento?')) {
      await approveBudget.mutateAsync({ id: budgetId, approvedBy: user.id });
    }
  };

  const handleActivateBudget = async (budgetId) => {
    if (window.confirm('Tem certeza que deseja ativar este orçamento?')) {
      await activateBudget.mutateAsync(budgetId);
    }
  };

  const handleCloseBudget = async (budgetId) => {
    if (window.confirm('Tem certeza que deseja fechar este orçamento? Esta ação não pode ser desfeita.')) {
      await closeBudget.mutateAsync(budgetId);
    }
  };

  const handleDuplicate = async (budgetId, currentName) => {
    const newYear = window.prompt('Ano do novo orçamento:', (new Date().getFullYear() + 1).toString());
    if (newYear && !isNaN(parseInt(newYear))) {
      await duplicateBudget.mutateAsync({ 
        id: budgetId, 
        newYear: parseInt(newYear) 
      });
    }
  };

  const handleDelete = async (budgetId) => {
    if (window.confirm('Tem certeza que deseja deletar este orçamento? Esta ação não pode ser desfeita.')) {
      await deleteBudget.mutateAsync(budgetId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'approved': return 'default';
      case 'active': return 'default';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'approved': return 'Aprovado';
      case 'active': return 'Ativo';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return Edit;
      case 'approved': return CheckCircle;
      case 'active': return Play;
      case 'closed': return Square;
      default: return Edit;
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'annual': return 'Anual';
      default: return period;
    }
  };

  const getCostCenterName = (costCenterId) => {
    const cc = costCentersData?.data?.find(c => c.id === costCenterId);
    return cc ? `${cc.code} - ${cc.name}` : 'N/A';
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Todas';
    const category = categoriesData?.data?.find(c => c.id === categoryId);
    return category?.name || 'N/A';
  };

  const getUtilizationColor = (percentage) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationIcon = (percentage) => {
    if (percentage >= 100) return AlertTriangle;
    if (percentage >= 80) return TrendingUp;
    return TrendingDown;
  };

  const calculateUtilization = (budget) => {
    if (budget.plannedAmount === 0) return 0;
    return ((budget.spentAmount + budget.committedAmount) / budget.plannedAmount) * 100;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Erro ao carregar orçamentos: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orçamentos e Forecast</h1>
          <p className="text-muted-foreground">
            Gerencie planejamento orçamentário, controle de gastos e projeções financeiras
          </p>
        </div>
        
        {hasAnyRole(['admin', 'finance']) && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Planejado</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(budgetStats?.totalPlanned || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Gasto</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(budgetStats?.totalSpent || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Comprometido</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(budgetStats?.totalCommitted || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Taxa de Utilização</p>
                <p className="text-2xl font-bold">
                  {budgetStats?.utilizationRate?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar orçamentos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Centro de Custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {costCentersData?.data?.map((cc) => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.code} - {cc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de orçamentos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Orçamentos ({budgetsData?.total || 0})
          </CardTitle>
          <CardDescription>
            Controle de planejamento e execução orçamentária
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Centro de Custo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Planejado</TableHead>
                <TableHead>Utilização</TableHead>
                <TableHead>Disponível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetsData?.data?.map((budget) => {
                const utilization = calculateUtilization(budget);
                const UtilizationIcon = getUtilizationIcon(utilization);
                const StatusIcon = getStatusIcon(budget.status);
                
                return (
                  <TableRow key={budget.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{budget.name}</div>
                        {budget.description && (
                          <div className="text-sm text-muted-foreground">
                            {budget.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {budget.year} • {getPeriodLabel(budget.period)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {getCostCenterName(budget.costCenterId)}
                      </div>
                      {budget.categoryId && (
                        <div className="text-sm text-muted-foreground">
                          {getCategoryName(budget.categoryId)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPeriodLabel(budget.period)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(budget.plannedAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Gasto: {formatCurrency(budget.spentAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Comprometido: {formatCurrency(budget.committedAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <UtilizationIcon className={`h-4 w-4 ${getUtilizationColor(utilization)}`} />
                          <span className={`font-medium ${getUtilizationColor(utilization)}`}>
                            {utilization.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(utilization, 100)} 
                          className="w-full"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(budget.availableAmount)}
                      </div>
                      {budget.availableAmount < 0 && (
                        <div className="text-sm text-red-600">
                          Estourado
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant={getStatusColor(budget.status)}>
                          {getStatusLabel(budget.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          
                          {hasAnyRole(['admin', 'finance']) && (
                            <>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(budget.id, budget.name)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {budget.status === 'draft' && (
                                <DropdownMenuItem
                                  onClick={() => handleApproveBudget(budget.id)}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Aprovar
                                </DropdownMenuItem>
                              )}
                              
                              {budget.status === 'approved' && (
                                <DropdownMenuItem
                                  onClick={() => handleActivateBudget(budget.id)}
                                  className="text-blue-600"
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Ativar
                                </DropdownMenuItem>
                              )}
                              
                              {budget.status === 'active' && (
                                <DropdownMenuItem
                                  onClick={() => handleCloseBudget(budget.id)}
                                  className="text-orange-600"
                                >
                                  <Square className="mr-2 h-4 w-4" />
                                  Fechar
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => handleDelete(budget.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deletar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {budgetsData?.data?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum orçamento encontrado</p>
              <p className="text-sm">
                {hasAnyRole(['admin', 'finance']) 
                  ? 'Crie seu primeiro orçamento para começar o planejamento.'
                  : 'Aguarde a configuração dos orçamentos pelo administrador.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {budgetsData && budgetsData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </Button>
          
          <span className="flex items-center px-4">
            Página {page} de {budgetsData.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === budgetsData.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão Orçamentária</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">📊 Controle de Execução</h4>
              <p className="text-sm text-muted-foreground">
                Acompanhe em tempo real a utilização do orçamento com valores gastos, 
                comprometidos e disponíveis por centro de custo.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🎯 Planejamento Flexível</h4>
              <p className="text-sm text-muted-foreground">
                Configure orçamentos mensais, trimestrais ou anuais com breakdown 
                detalhado e projeções por categoria.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">⚠️ Alertas Inteligentes</h4>
              <p className="text-sm text-muted-foreground">
                Receba notificações automáticas quando orçamentos estiverem próximos 
                do limite ou em situação de estouro.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">📈 Análise de Variação</h4>
              <p className="text-sm text-muted-foreground">
                Compare planejado vs realizado com análises de variação e 
                identificação de desvios significativos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
