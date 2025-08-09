import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Eye, Power, Copy, Trash2, ArrowUp, ArrowDown, Settings, Users, DollarSign, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
  useApprovalPolicies,
  useToggleApprovalPolicyStatus,
  useDuplicateApprovalPolicy,
  useDeleteApprovalPolicy,
  useReorderApprovalPolicies
} from '../hooks/useApprovalPolicies';
import { useCategories } from '../hooks/useCategories';
import { useCostCenters } from '../hooks/useCostCenters';
import { useAuthStore } from '../stores/auth';
import { formatCurrency } from '../utils';

export const PoliciesPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const { user, hasAnyRole } = useAuthStore();
  
  const { data: policiesData, isLoading, error } = useApprovalPolicies({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    categoryId: categoryFilter || undefined,
  });

  const { data: categoriesData } = useCategories({ limit: 100 });
  const { data: costCentersData } = useCostCenters({ limit: 100 });

  const toggleStatus = useToggleApprovalPolicyStatus();
  const duplicatePolicy = useDuplicateApprovalPolicy();
  const deletePolicy = useDeleteApprovalPolicy();
  const reorderPolicies = useReorderApprovalPolicies();

  const handleToggleStatus = async (policyId) => {
    if (window.confirm('Tem certeza que deseja alterar o status desta política?')) {
      await toggleStatus.mutateAsync(policyId);
    }
  };

  const handleDuplicate = async (policyId, currentName) => {
    const newName = window.prompt('Nome da nova política:', `${currentName} (Cópia)`);
    if (newName) {
      await duplicatePolicy.mutateAsync({ id: policyId, newName });
    }
  };

  const handleDelete = async (policyId) => {
    if (window.confirm('Tem certeza que deseja deletar esta política? Esta ação não pode ser desfeita.')) {
      await deletePolicy.mutateAsync(policyId);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  const getStatusLabel = (status) => {
    return status === 'active' ? 'Ativa' : 'Inativa';
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Todas';
    const category = categoriesData?.data?.find(c => c.id === categoryId);
    return category?.name || 'N/A';
  };

  const getCostCenterName = (costCenterId) => {
    if (!costCenterId) return 'Todos';
    const cc = costCentersData?.data?.find(c => c.id === costCenterId);
    return cc?.name || 'N/A';
  };

  const getApproversCount = (approvers) => {
    return approvers?.length || 0;
  };

  const getRequiredApproversCount = (approvers) => {
    return approvers?.filter(a => a.isRequired)?.length || 0;
  };

  const formatAmountRange = (minAmount, maxAmount) => {
    if (maxAmount === Infinity || maxAmount >= 999999999) {
      return `${formatCurrency(minAmount)} ou mais`;
    }
    return `${formatCurrency(minAmount)} - ${formatCurrency(maxAmount)}`;
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
        Erro ao carregar políticas: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Políticas de Aprovação</h1>
          <p className="text-muted-foreground">
            Configure alçadas e regras de aprovação por valor, categoria e centro de custo
          </p>
        </div>
        
        {hasAnyRole(['admin', 'finance']) && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Política
          </Button>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total de Políticas</p>
                <p className="text-2xl font-bold">{policiesData?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Power className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Políticas Ativas</p>
                <p className="text-2xl font-bold">
                  {policiesData?.data?.filter(p => p.status === 'active')?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Aprovadores Únicos</p>
                <p className="text-2xl font-bold">
                  {new Set(
                    policiesData?.data?.flatMap(p => p.approvers?.map(a => a.userId) || [])
                  ).size || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Maior Alçada</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    Math.max(...(policiesData?.data?.map(p => p.maxAmount) || [0]))
                  )}
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
            Use os filtros abaixo para encontrar políticas específicas
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categoriesData?.data?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de políticas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Políticas de Aprovação ({policiesData?.total || 0})
          </CardTitle>
          <CardDescription>
            Ordenadas por prioridade (menor número = maior prioridade)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prioridade</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Faixa de Valor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Centro de Custo</TableHead>
                <TableHead>Aprovadores</TableHead>
                <TableHead>Condições</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policiesData?.data?.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-mono">
                        {policy.priority}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{policy.name}</div>
                      {policy.description && (
                        <div className="text-sm text-muted-foreground">
                          {policy.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatAmountRange(policy.minAmount, policy.maxAmount)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getCategoryName(policy.categoryId)}
                  </TableCell>
                  <TableCell>
                    {getCostCenterName(policy.costCenterId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {getRequiredApproversCount(policy.approvers)}/{getApproversCount(policy.approvers)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        (obrigatórios/total)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {policy.conditions?.requiresAllApprovers && (
                        <Badge variant="outline" className="text-xs">
                          Todos devem aprovar
                        </Badge>
                      )}
                      {policy.conditions?.allowParallelApproval && (
                        <Badge variant="outline" className="text-xs">
                          Aprovação paralela
                        </Badge>
                      )}
                      {policy.conditions?.escalationTimeHours > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{policy.conditions.escalationTimeHours}h escalação</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(policy.status)}>
                      {getStatusLabel(policy.status)}
                    </Badge>
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
                              onClick={() => handleDuplicate(policy.id, policy.name)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(policy.id)}
                              className={policy.status === 'active' ? 'text-orange-600' : 'text-green-600'}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {policy.status === 'active' ? 'Desativar' : 'Ativar'}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => handleDelete(policy.id)}
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
              ))}
            </TableBody>
          </Table>

          {policiesData?.data?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma política encontrada</p>
              <p className="text-sm">
                {hasAnyRole(['admin', 'finance']) 
                  ? 'Crie sua primeira política de aprovação para começar.'
                  : 'Aguarde a configuração das políticas pelo administrador.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {policiesData && policiesData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </Button>
          
          <span className="flex items-center px-4">
            Página {page} de {policiesData.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === policiesData.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Como funcionam as Políticas de Aprovação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">🎯 Prioridade</h4>
              <p className="text-sm text-muted-foreground">
                Políticas são aplicadas por ordem de prioridade (menor número = maior prioridade). 
                A primeira política que atender aos critérios será utilizada.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">💰 Faixa de Valores</h4>
              <p className="text-sm text-muted-foreground">
                Define o intervalo de valores que a política se aplica. 
                Pode ser específica (R$ 1.000 - R$ 5.000) ou aberta (R$ 10.000 ou mais).
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">👥 Aprovadores</h4>
              <p className="text-sm text-muted-foreground">
                Configure níveis de aprovação com aprovadores obrigatórios e opcionais. 
                Defina se todos devem aprovar ou apenas os obrigatórios.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">⏰ Escalação</h4>
              <p className="text-sm text-muted-foreground">
                Configure tempo limite para aprovação. Após o prazo, 
                a solicitação pode ser escalada automaticamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
