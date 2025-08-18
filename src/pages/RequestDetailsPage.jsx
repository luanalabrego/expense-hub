import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRequest } from '@/hooks/useRequests';

const statusLabels = {
  pending_validation: 'Ag. validação',
  pending_owner_approval: 'Ag. aprovação do owner',
  pending_fpa_approval: 'Ag. aprovação FP&A',
  pending_director_approval: 'Ag. aprovação Diretor',
  pending_cfo_approval: 'Ag. aprovação CFO',
  pending_ceo_approval: 'Ag. aprovação CEO',
  pending_payment_approval: 'Ag. aprovação de pagamento',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  paid: 'Pagamento realizado',
};

const formatDateTime = (date) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));

export const RequestDetailsPage = () => {
  const { id } = useParams();
  const { data: request, isLoading } = useRequest(id);

  if (isLoading) return <div>Carregando...</div>;
  if (!request) return <div>Solicitação não encontrada</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solicitação {request.requestNumber}</h1>
        <Link to="/requests" className="text-blue-600 hover:underline text-sm">
          Voltar
        </Link>
      </div>
      <div>
        <p className="mb-4"><strong>Status atual:</strong> {statusLabels[request.status] || request.status}</p>
        <h2 className="text-xl font-semibold mb-2">Histórico de Status</h2>
        <ul className="space-y-2">
          {request.statusHistory?.map((entry, idx) => (
            <li key={idx} className="border rounded p-2">
              <div className="text-sm font-medium">{statusLabels[entry.status] || entry.status}</div>
              <div className="text-xs text-gray-500">
                {entry.changedByName} - {formatDateTime(entry.timestamp)}
              </div>
              {entry.reason && (
                <div className="text-xs text-gray-600 mt-1">Motivo: {entry.reason}</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RequestDetailsPage;
