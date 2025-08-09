import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Shield, ShieldOff, Star } from 'lucide-react';
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
  useVendors, 
  useDeactivateVendor, 
  useReactivateVendor,
  useBlockVendor,
  useUnblockVendor 
} from '../hooks/useVendors';
import { useAuthStore } from '../stores/auth';
import { formatCNPJ, formatPhone, formatDate } from '../utils';

export const VendorsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const { hasAnyRole } = useAuthStore();
  
  const { data: vendorsData, isLoading, error } = useVendors({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const deactivateVendor = useDeactivateVendor();
  const reactivateVendor = useReactivateVendor();
  const blockVendor = useBlockVendor();
  const unblockVendor = useUnblockVendor();

  const handleDeactivate = async (vendorId) => {
    if (window.confirm('Tem certeza que deseja desativar este fornecedor?')) {
      await deactivateVendor.mutateAsync(vendorId);
    }
  };

  const handleReactivate = async (vendorId) => {
    if (window.confirm('Tem certeza que deseja reativar este fornecedor?')) {
      await reactivateVendor.mutateAsync(vendorId);
    }
  };

  const handleBlock = async (vendorId) => {
    if (window.confirm('Tem certeza que deseja bloquear este fornecedor?')) {
      await blockVendor.mutateAsync(vendorId);
    }
  };

  const handleUnblock = async (vendorId) => {
    if (window.confirm('Tem certeza que deseja desbloquear este fornecedor?')) {
      await unblockVendor.mutateAsync(vendorId);
    }
  };

  const getStatusColor = (status, blocked) => {
    if (blocked) return 'destructive';
    return status === 'active' ? 'default' : 'secondary';
  };

  const getStatusLabel = (status, blocked) => {
    if (blocked) return 'Bloqueado';
    return status === 'active' ? 'Ativo' : 'Inativo';
  };

  const renderRating = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
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
        Erro ao carregar fornecedores: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie fornecedores e suas informações
          </p>
        </div>
        
        {hasAnyRole(['admin', 'finance']) && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar fornecedores específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou email..."
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
          </div>
        </CardContent>
      </Card>

      {/* Tabela de fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>
            Fornecedores ({vendorsData?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorsData?.data?.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">
                    {vendor.name}
                  </TableCell>
                  <TableCell>
                    {formatCNPJ(vendor.taxId)}
                  </TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>
                    {vendor.phone ? formatPhone(vendor.phone) : '-'}
                  </TableCell>
                  <TableCell>
                    {renderRating(vendor.rating || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {vendor.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(vendor.status, vendor.blocked)}>
                      {getStatusLabel(vendor.status, vendor.blocked)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(vendor.createdAt)}
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
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        
                        {hasAnyRole(['admin', 'finance']) && (
                          <>
                            {vendor.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(vendor.id)}
                                className="text-orange-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleReactivate(vendor.id)}
                                className="text-green-600"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Reativar
                              </DropdownMenuItem>
                            )}

                            {vendor.blocked ? (
                              <DropdownMenuItem
                                onClick={() => handleUnblock(vendor.id)}
                                className="text-green-600"
                              >
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Desbloquear
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleBlock(vendor.id)}
                                className="text-red-600"
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Bloquear
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

          {vendorsData?.data?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fornecedor encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {vendorsData && vendorsData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Anterior
          </Button>
          
          <span className="flex items-center px-4">
            Página {page} de {vendorsData.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === vendorsData.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};
