import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BudgetRequestModal from '../components/BudgetRequestModal';
import { useBudgetRequests } from '../stores/budget-requests';
import { Plus, Search, Edit, Eye, CheckCircle, XCircle, Clock, DollarSign, Upload } from 'lucide-react';
import { useRequestsList, useRequestStats, useApproveRequest, useRejectRequest } from '../hooks/useRequests';
import { useAuth } from '../contexts/AuthContext';
import { usePrompt } from '../contexts/PromptContext';
import { useNotifications } from '../stores/ui';
import NewRequestModal from '../components/NewRequestModal';
import ImportRequestsModal from '../components/ImportRequestsModal';

export const RequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [orderBy, setOrderBy] = useState('createdAt');
  const [orderDir, setOrderDir] = useState('desc');
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const prompt = usePrompt();
  const { error: notifyError } = useNotifications();
  const { requests: budgetRequests } = useBudgetRequests();
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const isBasicUser = user?.roles?.includes('user');
  const { data, isLoading, isError, error } = useRequestsList({
    page,
    limit,
    search,
    status: statusFilter || undefined,
    orderBy,
    orderDir,
    requesterId: user.id,
  });
  const { data: stats } = useRequestStats({ requesterId: user.id });
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
      pending_owner_approval: 'bg-yellow-100 text-yellow-800',
      pending_director_approval: 'bg-indigo-100 text-indigo-800',
      pending_cfo_approval: 'bg-pink-100 text-pink-800',
      pending_ceo_approval: 'bg-orange-100 text-orange-800',
      pending_payment_approval: 'bg-purple-100 text-purple-800',
      pending_payment: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-200 text-gray-800',
      paid: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending_owner_approval: 'Ag. aprovação do owner',
      pending_director_approval: 'Ag. aprovação Diretor',
      pending_cfo_approval: 'Ag. aprovação CFO',
      pending_ceo_approval: 'Ag. aprovação CEO',
      pending_payment_approval: 'Ag. aprovação de pagamento',
      pending_payment: 'Ag. pagamento',
      rejected: 'Rejeitado',
      cancelled: 'Cancelado',
      paid: 'Pagamento realizado',
    };
    return labels[status] || status;
  };

  const getFiscalStatusColor = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending_adjustment: 'bg-orange-100 text-orange-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getFiscalStatusLabel = (status) => {
    const labels = {
      approved: 'Aprovado',
      pending_adjustment: 'Pendente de ajuste',
      pending: 'Pendente',
    };
    return labels[status] || '-';
  };

  const getContractStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      adjustments_requested: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getContractStatusLabel = (status) => {
    const labels = {
      pending: 'Ag. jurídico',
      approved: 'Aprovado',
      adjustments_requested: 'Ajustes solicitados',
    };
    return labels[status] || '-';
  };

  const handleApprove = async (id) => {
    const comments = await prompt({ title: 'Comentário da aprovação' });
    if (comments === null) return;
    approveRequest.mutate({
      id,
      approverId: user.id,
      approverName: user.name,
      comments,
    });
  };

  const handleReject = async (id) => {
    const reason = await prompt({ title: 'Motivo da reprovação' });
    if (!reason) return;
    rejectRequest.mutate({
      id,
      approverId: user.id,
      approverName: user.name,
      reason,
    });
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
        <div className="flex space-x-2">
          <button
            onClick={() => setShowBudgetModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Solicitar Orçamento
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar Excel
            </button>
            <button
              onClick={() => setShowNewRequest(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Solicitação
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-2xl font-bold">{stats?.byStatus?.pending_payment ?? 0}</p>
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
              <option value="pending_owner_approval">Ag. aprovação do owner</option>
              <option value="pending_director_approval">Ag. aprovação Diretor</option>
              <option value="pending_cfo_approval">Ag. aprovação CFO</option>
              <option value="pending_ceo_approval">Ag. aprovação CEO</option>
              <option value="pending_payment_approval">Ag. aprovação de pagamento</option>
              <option value="pending_payment">Ag. pagamento</option>
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
                  Tipo de compra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No orçamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Fiscal
                  Contrato
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
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
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
                        <div className="text-sm text-gray-900">{request.purchaseType || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.inBudget ? 'Sim' : 'Não'}
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

                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFiscalStatusColor(request.fiscalStatus)}`}>
                          {getFiscalStatusLabel(request.fiscalStatus)}
                        </span>
                        {request.contractStatus ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getContractStatusColor(request.contractStatus)}`}>
                            {getContractStatusLabel(request.contractStatus)}
                          </span>
                        ) : '-'}
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
                          {!isBasicUser && request.status === 'pending_owner_approval' && (
                            <>
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                title="Aprovar"
                                disabled={approveRequest.isPending}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                title="Rejeitar"
                                disabled={rejectRequest.isPending}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {(!isBasicUser || request.status === 'pending_owner_approval') && (
                            <button
                              onClick={() => navigate(`/requests/${request.id}/edit`)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Solicitações de Orçamento */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-2">Solicitações de Orçamento</h2>
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Título</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {budgetRequests.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.id}</td>
                <td className="px-4 py-2">{r.title}</td>
                <td className="px-4 py-2">{r.status}</td>
              </tr>
            ))}
            {budgetRequests.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma solicitação de orçamento
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
      <BudgetRequestModal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} />
      <ImportRequestsModal
        open={showImport}
        onClose={() => setShowImport(false)}
        userId={user.id}
        userName={user.name}
      />
    </div>
  );
};

