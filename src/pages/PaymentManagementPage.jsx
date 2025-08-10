import React from 'react';
import { useRequestsList, useMarkAsPaid, useCancelRequest } from '../hooks/useRequests';
import { useAuth } from '../contexts/AuthContext';

export const PaymentManagementPage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useRequestsList({ page: 1, limit: 50, status: 'pending_payment_approval' });
  const { mutate: markAsPaid } = useMarkAsPaid();
  const { mutate: cancelRequest } = useCancelRequest();
  const requests = data?.data || [];

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handlePaid = (id) => {
    const notes = window.prompt('Observações do pagamento');
    if (notes === null) return;
    markAsPaid({
      id,
      paymentDetails: {
        paidBy: user.id,
        paidByName: user.name,
        paymentDate: new Date(),
        notes,
      },
    });
  };

  const handleCancel = (id) => {
    const reason = window.prompt('Motivo do cancelamento');
    if (!reason) return;
    cancelRequest({ id, reason, userId: user.id, userName: user.name });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Pagamentos</h1>
        <p className="text-muted-foreground">Despesas aguardando pagamento</p>
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
                      onClick={() => handlePaid(req.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Pagamento Realizado
                    </button>
                    <button
                      onClick={() => handleCancel(req.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && requests.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">Nenhuma despesa pendente.</div>
        )}
      </div>
    </div>
  );
};

export default PaymentManagementPage;

