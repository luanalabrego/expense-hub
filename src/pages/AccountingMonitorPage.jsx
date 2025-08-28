import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePrompt } from '../contexts/PromptContext';
import { useRequestsByStatus, useVerifyRequest, useReturnRequestWithError } from '../hooks/useRequests';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency } from '@/utils';
import RequestDetailsModal from '@/components/RequestDetailsModal';

export const AccountingMonitorPage = () => {
  const { user } = useAuth();
  const { data, isLoading, isError } = useRequestsByStatus('pending_accounting_monitor');
  const verifyRequest = useVerifyRequest();
  const returnRequest = useReturnRequestWithError();
  const prompt = usePrompt();
  const [detailsId, setDetailsId] = useState(null);

  const requests = data || [];

  const handleVerify = async (id) => {
    const comments = await prompt({ title: 'Comentários da verificação' });
    await verifyRequest.mutateAsync({
      id,
      verifierId: user.id,
      verifierName: user.name,
      comments: comments || undefined,
    });
  };

  const handleReturn = async (id) => {
    const reason = await prompt({ title: 'Motivo do retorno' });
    if (!reason) return;
    returnRequest.mutate({
      id,
      verifierId: user.id,
      verifierName: user.name,
      reason,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Monitor Contábil</h1>
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Erro ao carregar solicitações</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma solicitação para verificar</p>
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
                  <tr
                    key={req.id}
                    onClick={() => setDetailsId(req.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerify(req.id);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-md"
                        disabled={verifyRequest.isPending}
                      >
                        Verificar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReturn(req.id);
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded-md"
                        disabled={returnRequest.isPending}
                      >
                        Retornar
                      </button>
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

export default AccountingMonitorPage;
