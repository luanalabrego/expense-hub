import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  usePendingRequestsForApprover,
  useRequestsList,
  useApproveRequest,
  useRejectRequest,
} from '../hooks/useRequests';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatDate } from '@/utils';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import RequestDetailsModal from '@/components/RequestDetailsModal';
import { usePrompt } from '../contexts/PromptContext';

export const OwnerApprovalsPage = () => {
  const { user } = useAuth();
  const { data: pendingData, isLoading: pendingLoading, isError: pendingError } =
    usePendingRequestsForApprover(user.id);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailsId, setDetailsId] = useState(null);

  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
  } = useRequestsList({ page: 1, limit: 100, orderBy: sortBy, orderDir: sortOrder });

  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const prompt = usePrompt();

  const userCostCenters = user?.ccScope ?? user?.costCenters ?? [];
  const pendingRequests = (pendingData ?? []).filter(
    (r) =>
      userCostCenters.length === 0 || userCostCenters.includes(r.costCenterId)
  );
  const historyRequests = (historyData?.data ?? []).filter(
    (r) =>
      (userCostCenters.length === 0 || userCostCenters.includes(r.costCenterId)) &&
      r.status !== 'pending_owner_approval'
  );

  const filteredHistory = historyRequests.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.vendorName?.toLowerCase().includes(q) ||
      r.requestNumber?.toLowerCase().includes(q)
    );
  });

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(pendingRequests.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
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

  const handleApproveSelected = async () => {
    const comments = await prompt({ title: 'Comentário da aprovação' });
    if (comments === null) return;
    selectedIds.forEach((id) =>
      approveRequest.mutate({
        id,
        approverId: user.id,
        approverName: user.name,
        comments,
      })
    );
    setSelectedIds([]);
  };

  const pendingAmount = pendingRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const approvedAmount = historyRequests.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Aprovações do Owner</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprovado</p>
              <p className="text-2xl font-bold">{formatCurrency(approvedAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendente</p>
              <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold">{formatCurrency(pendingAmount + approvedAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold tracking-tight">Pendências de Aprovação</h2>
      <div className="bg-white rounded-lg border overflow-hidden">
        {pendingLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : pendingError ? (
          <div className="text-center py-12 text-red-500">Erro ao carregar solicitações</div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma solicitação pendente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="p-4 flex gap-2">
              <button
                onClick={() => toggleSelectAll(true)}
                className="px-3 py-1 bg-gray-200 rounded-md"
              >
                Selecionar Tudo
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleApproveSelected}
                  className="px-3 py-1 bg-green-600 text-white rounded-md"
                >
                  Aprovar Selecionadas
                </button>
              )}
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3">
                    <Checkbox
                      checked={
                        pendingRequests.length > 0 &&
                        selectedIds.length === pendingRequests.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despesa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competência</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atualizado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedIds.includes(req.id)}
                        onCheckedChange={() => toggleSelect(req.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {req.requestNumber || req.number}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      onClick={() => setDetailsId(req.id)}
                    >
                      {req.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.vendorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(req.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.competenceDate ? formatDate(req.competenceDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(req.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(req.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md"
                        disabled={approveRequest.isPending}
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md"
                        disabled={rejectRequest.isPending}
                      >
                        Reprovar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold tracking-tight">Histórico de Aprovações</h2>
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar solicitações..."
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        {historyLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : historyError ? (
          <div className="text-center py-12 text-red-500">Erro ao carregar histórico</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum histórico encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => toggleSort('requestNumber')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Solicitação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Despesa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th
                    onClick={() => toggleSort('status')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Status
                  </th>
                  <th
                    onClick={() => toggleSort('updatedAt')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Atualizado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {req.requestNumber || req.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.vendorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(req.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.competenceDate ? formatDate(req.competenceDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(req.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(req.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <RequestDetailsModal
        requestId={detailsId}
        open={!!detailsId}
        onClose={() => setDetailsId(null)}
      />
    </div>
  );
};

export default OwnerApprovalsPage;

