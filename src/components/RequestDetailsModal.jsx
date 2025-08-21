import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { formatCurrency, formatDate } from '@/utils';
import { useRequest } from '@/hooks/useRequests';

const RequestDetailsModal = ({ requestId, open, onClose }) => {
  const { data: request, isLoading } = useRequest(requestId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Despesa</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-4">Carregando...</div>
        ) : request ? (
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Solicitação:</span> {request.requestNumber || request.number}
            </div>
            <div>
              <span className="font-medium">Nome da Despesa:</span> {request.title}
            </div>
            <div>
              <span className="font-medium">Fornecedor:</span> {request.vendorName}
            </div>
            <div>
              <span className="font-medium">Valor:</span> {formatCurrency(request.amount)}
            </div>
            <div>
              <span className="font-medium">Competência:</span> {request.competenceDate ? formatDate(request.competenceDate) : '-'}
            </div>
            <div>
              <span className="font-medium">Vencimento:</span> {formatDate(request.dueDate)}
            </div>
            {request.description && (
              <div>
                <span className="font-medium">Descrição:</span> {request.description}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailsModal;
