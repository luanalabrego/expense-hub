import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Tag, Shield } from 'lucide-react';
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
  useCategories, 
  useDeactivateCategory, 
  useReactivateCategory 
} from '../hooks/useCategories';
import { useAuthStore } from '../stores/auth';
import { formatCurrency, formatDate } from '../utils';
import { CATEGORY_TYPES } from '../services/categories';

export const CategoriesPage = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const { hasAnyRole } = useAuthStore();
  
  const { data: categoriesData, isLoading, error } = useCategories({
    page,
    limit: 20,
    search: search || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

  const deactivateCategory = useDeactivateCategory();
  const reactivateCategory = useReactivateCategory();

  const handleDeactivate = async (categoryId) => {
    if (window.confirm('Tem certeza que deseja desativar esta categoria?')) {
      await deactivateCategory.mutateAsync(categoryId);
    }
  };

  const handleReactivate = async (categoryId) => {
    if (window.confirm('Tem certeza que deseja reativar esta categoria?')) {
      await reactivateCategory.mutateAsync(categoryId);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  const getStatusLabel = (status) => {
    return status === 'active' ? 'Ativo' : 'Inativo';
  };

  const getTypeColor = (type) => {
    const colors = {
      expense: 'destructive',
      revenue: 'default',
      asset: 'secondary',
      liability: 'outline',
      payment: 'default',
      document: 'secondary',
    };
    return colors[type] || 'outline';
  };

  const getTypeLabel = (type) => {
    const labels = {
      expense: 'Despesa',
      revenue: 'Receita',
      asset: 'Ativo',
      liability: 'Passivo',
      payment: 'Pagamento',
      document: 'Documento',
    };
    return labels[type] || type;
  };

  const renderCategoryIcon = (category) => {
    return (
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
        style={{ backgroundColor: category.color }}
      >
        {category.icon}
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
        Erro ao carregar categorias: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie categorias para organizar despesas e receitas
          </p>
        </div>
        
        {hasAnyRole(['admin', 'finance']) && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar categorias específicas
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

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
                <SelectItem value="asset">Ativo</SelectItem>
                <SelectItem value="liability">Passivo</SelectItem>
                <SelectItem value="payment">Pagamento</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
              </SelectContent>
            </Select>

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
          </div>
        </CardContent>
      </Card>

      {/* Tabela de categorias */}
      <Card>
        <CardHeader>
          <CardTitle>
            Categorias ({categoriesData?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Aprovação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesData?.data?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {renderCategoryIcon(category)}
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {category.code && (
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {category.code}
                      </code>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeColor(category.type)}>
                      {getTypeLabel(category.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {category.requiresApproval ? (
                        <>
                          <Shield className="h-4 w-4 text-orange-500" />
                          <span className="text-sm">
                            {category.approvalLimit > 0 
                              ? formatCurrency(category.approvalLimit)
                              : 'Sempre'
                            }
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Não requer
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(category.status)}>
                      {getStatusLabel(category.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(category.createdAt)}
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
                          <Tag className="mr-2 h-4 w-4" />
                          Ver Subcategorias
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        
                        {hasAnyRole(['admin', 'finance']) && (
                          <>
                            {category.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(category.id)}
                                className="text-orange-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleReactivate(category.id)}
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

          {categoriesData?.data?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma categoria encontrada
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {categoriesData && categoriesData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </Button>
          
          <span className="flex items-center px-4">
            Página {page} de {categoriesData.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === categoriesData.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};
