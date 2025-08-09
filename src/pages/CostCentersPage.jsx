import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, TrendingUp, Building } from 'lucide-react';
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
  useCostCenters, 
  useDeactivateCostCenter, 
  useReactivateCostCenter 
} from '../hooks/useCostCenters';
import { useUsers } from '../hooks/useUsers';
import { useAuthStore } from '../stores/auth';
import { formatCurrency, formatDate, calculatePercentage } from '../utils';
import { calculateBudgetUtilization } from '../services/costCenters';

export const CostCentersPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const { hasAnyRole } = useAuthStore();
  
  const { data: costCentersData, isLoading, error } = useCostCenters({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    managerId: managerFilter || undefined,
  });

  const { data: usersData } = useUsers({ limit: 100 });

  const deactivateCostCenter = useDeactivateCostCenter();
  const reactivateCostCenter = useReactivateCostCenter();

  const handleDeactivate = async (ccId) => {
    if (window.confirm('Tem certeza que deseja desativar este centro de custo?')) {
      await deactivateCostCenter.mutateAsync(ccId);
    }
  };

  const handleReactivate = async (ccId) => {
    if (window.confirm('Tem certeza que deseja reativar este centro de custo?')) {
      await reactivateCostCenter.mutateAsync(ccId);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  const getStatusLabel = (status) => {
    return status === 'active' ? 'Ativo' : 'Inativo';
  };

  const getManagerName = (managerId) => {
    const manager = usersData?.data?.find(user => user.id === managerId);
    return manager?.name || 'N/A';
  };

  const getBudgetStatusColor = (utilization) => {
    if (utilization >= 90) return 'destructive';
    if (utilization >= 75) return 'warning';
    return 'default';
  };

  const renderBudgetProgress = (costCenter) => {
    const utilization = calculateBudgetUtilization(costCenter);
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Utilização</span>
          <span>{utilization.totalUsedPercentage.toFixed(1)}%</span>
        </div>
        <Progress 
          value={utilization.totalUsedPercentage} 
          className="h-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Gasto: {formatCurrency(costCenter.spent || 0)}</span>
          <span>Orçamento: {formatCurrency(costCenter.budget || 0)}</span>
        </div>
      </div>
    );
  };

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
        Erro ao carregar centros de custo: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="text-muted-foreground">
            Gerencie centros de custo e orçamentos
          </p>
        </div>
        
        {hasAnyRole(['admin', 'finance']) && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Centro de Custo
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar centros de custo específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por gerente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os gerentes</SelectItem>
                {usersData?.data?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de centros de custo */}
      <Card>
        <CardHeader>
          <CardTitle>
            Centros de Custo ({costCentersData?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Gerente</TableHead>
                <TableHead>Orçamento</TableHead>
                <TableHead>Utilização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCentersData?.data?.map((costCenter) => (
                <TableRow key={costCenter.id}>
                  <TableCell className="font-mono font-medium">
                    {costCenter.code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{costCenter.name}</div>
                      {costCenter.description && (
                        <div className="text-sm text-muted-foreground">
                          {costCenter.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                      {getManagerName(costCenter.managerId)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(costCenter.budget || 0)}
                  </TableCell>
                  <TableCell className="w-48">
                    {costCenter.budget > 0 ? (
                      renderBudgetProgress(costCenter)
                    ) : (
                      <span className="text-muted-foreground">Sem orçamento</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(costCenter.status)}>
                      {getStatusLabel(costCenter.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(costCenter.createdAt)}
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
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Ver Relatórios
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        
                        {hasAnyRole(['admin', 'finance']) && (
                          <>
                            {costCenter.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(costCenter.id)}
                                className="text-orange-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleReactivate(costCenter.id)}
                                className="text-green-600"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Reativar
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {costCentersData?.data?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum centro de custo encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {costCentersData && costCentersData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </Button>
          
          <span className="flex items-center px-4">
            Página {page} de {costCentersData.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === costCentersData.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};
