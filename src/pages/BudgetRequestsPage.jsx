import React, { useState } from 'react';
import { useBudgetRequests } from '@/stores/budget-requests';
import BudgetRequestDetailsModal from '@/components/BudgetRequestDetailsModal';

export const BudgetRequestsPage = () => {
  const { requests } = useBudgetRequests();
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Solicitações de Orçamento</h1>
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Título</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-4 py-2">{r.id}</td>
              <td className="px-4 py-2">{r.title}</td>
              <td className="px-4 py-2">{r.status}</td>
              <td className="px-4 py-2 text-center">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => setSelected(r)}
                >
                  Detalhes
                </button>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                Nenhuma solicitação registrada
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <BudgetRequestDetailsModal
        request={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default BudgetRequestsPage;

