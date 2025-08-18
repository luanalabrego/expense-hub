import React from 'react';
import { useRequestsList, useApproveRequest, useRejectRequest } from '../hooks/useRequests';
import { useAuth } from '../contexts/AuthContext';

export const DirectorApprovalsPage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useRequestsList({ page: 1, limit: 50, status: 'pending_director_approval' });
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const requests = data?.data || [];

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleApprove = (id) => {
    const comments = window.prompt('Comentário da aprovação');
    if (comments === null) return;
    approveRequest.mutate({ id, approverId: user.id, approverName: user.name, comments });
  };

  const handleReject = (id) => {
    const reason = window.prompt('Motivo da reprovação');
    if (!reason) return;
    rejectRequest.mutate({ id, approverId: user.id, approverName: user.name, reason });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aprovações Diretor</h1>
        <p className="text-muted-foreground">Solicitações aguardando aprovação do Diretor</p>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitação</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">Carregando...</td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{req.requestNumber || req.number}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{req.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{req.vendorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(req.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Reprovar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && requests.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">Nenhuma solicitação pendente.</div>
        )}
      </div>
    </div>
  );
};

export default DirectorApprovalsPage;
