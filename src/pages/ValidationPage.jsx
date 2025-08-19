import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRequestsByStatus, useValidateRequest, useRejectRequest } from '../hooks/useRequests';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency } from '@/utils';

export const ValidationPage = () => {
  const { user } = useAuth();
  const { data, isLoading, isError } = useRequestsByStatus('pending_validation');
  const validateRequest = useValidateRequest();
  const rejectRequest = useRejectRequest();

  const requests = data || [];

  const handleValidate = async (id) => {
    const comments = window.prompt('Comentários da validação');
    await validateRequest.mutateAsync({
      id,
      validatorId: user.id,
      validatorName: user.name,
      comments: comments || undefined,
    });
  };

  const handleReturn = (id) => {
    const reason = window.prompt('Motivo da devolução');
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
      <h1 className="text-3xl font-bold tracking-tight">Validação de Solicitações</h1>

      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Erro ao carregar solicitações</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma solicitação para validar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {req.requestNumber || req.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.vendorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(req.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleValidate(req.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md"
                        disabled={validateRequest.isPending}
                      >
                        Validar
                      </button>
                      <button
                        onClick={() => handleReturn(req.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md"
                        disabled={rejectRequest.isPending}
                      >
                        Devolver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationPage;

