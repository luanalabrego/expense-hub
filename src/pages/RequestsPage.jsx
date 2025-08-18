import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Eye, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { useRequestsList, useRequestStats } from '../hooks/useRequests';
import { useNotifications } from '../stores/ui';
import NewRequestModal from '../components/NewRequestModal';

export const RequestsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [orderBy, setOrderBy] = useState('createdAt');
  const [orderDir, setOrderDir] = useState('desc');
  const [showNewRequest, setShowNewRequest] = useState(false);
  const { error: notifyError } = useNotifications();
  const { data, isLoading, isError, error } = useRequestsList({
    page,
    limit,
    search,
    status: statusFilter || undefined,
    orderBy,
    orderDir,
  });
  const { data: stats } = useRequestStats();
  const requests = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  useEffect(() => {
    if (isError) {
      notifyError('Erro ao carregar solicitações', error?.message);
    }
  }, [isError, error, notifyError]);

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

    const getStatusColor = (status) => {
      const colors = {
        pending_validation: 'bg-orange-100 text-orange-800',
        pending_owner_approval: 'bg-yellow-100 text-yellow-800',
        pending_payment_approval: 'bg-purple-100 text-purple-800',
        rejected: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-200 text-gray-800',
        paid: 'bg-green-100 text-green-800',
      };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

    const getStatusLabel = (status) => {
      const labels = {
        pending_validation: 'Ag. validação',
        pending_owner_approval: 'Ag. aprovação do owner',
        pending_payment_approval: 'Ag. aprovação de pagamento',
        rejected: 'Rejeitado',
        cancelled: 'Cancelado',
        paid: 'Pagamento realizado',
      };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority] || priority;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações de Pagamento</h1>
          <p className="text-muted-foreground">
            Gerencie todas as solicitações de pagamento da empresa
          </p>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Solicitação
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ag. validação</p>
              <p className="text-2xl font-bold">{stats?.byStatus?.pending_validation ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ag. aprovação</p>
              <p className="text-2xl font-bold">{stats?.byStatus?.pending_owner_approval ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ag. pagamento</p>
              <p className="text-2xl font-bold">{stats?.byStatus?.pending_payment_approval ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold">{formatCurrency(stats?.totalAmount ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por descrição, número ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="pending_validation">Ag. validação</option>
              <option value="pending_owner_approval">Ag. aprovação do owner</option>
              <option value="pending_payment_approval">Ag. aprovação de pagamento</option>
              <option value="rejected">Rejeitado</option>
              <option value="cancelled">Cancelado</option>
              <option value="paid">Pagamento realizado</option>
            </select>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">Criada em</option>
              <option value="dueDate">Vencimento</option>
              <option value="amount">Valor</option>
              <option value="status">Status</option>
              <option value="priority">Prioridade</option>
            </select>
          </div>

          <div className="w-full sm:w-32">
            <select
              value={orderDir}
              onChange={(e) => setOrderDir(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading
                ? Array.from({ length: limit }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                    </tr>
                  ))
                : requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.requestNumber || request.number}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {request.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.vendorName || ''}</div>
                        <div className="text-sm text-gray-500">{request.costCenterName || request.costCenterId || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(request.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                          {getPriorityLabel(request.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.dueDate ? formatDate(request.dueDate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/requests/${request.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status === 'pending_owner_approval' && (
                            <>
                              <button
                                onClick={() => alert('Aprovar solicitação (Demo)')}
                                className="text-green-600 hover:text-green-900"
                                title="Aprovar"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => alert('Rejeitar solicitação (Demo)')}
                                className="text-red-600 hover:text-red-900"
                                title="Rejeitar"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => navigate(`/requests/${request.id}/edit`)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        
        {!isLoading && requests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma solicitação encontrada</p>
            <button
              onClick={() => setShowNewRequest(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Solicitação
            </button>
          </div>
        )}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando {requests.length} de {total} solicitações
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white disabled:bg-gray-100 disabled:text-gray-400"
          >
            Anterior
          </button>
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white disabled:bg-gray-100 disabled:text-gray-400"
          >
            Próximo
          </button>
        </div>
      </div>
      <NewRequestModal open={showNewRequest} onClose={() => setShowNewRequest(false)} />
    </div>
  );
};

