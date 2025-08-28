import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import { useRequest } from '@/hooks/useRequests';
import { useCostCenter } from '@/hooks/useCostCenters';
import { useCategory } from '@/hooks/useCategories';
import { getBudgetLineById } from '@/services/budgetLines';

const statusLabels = {
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

const RequestDetailsModal = ({ requestId, open, onClose }) => {
  const { data: request, isLoading } = useRequest(requestId);
  const { data: costCenter } = useCostCenter(request?.costCenterId || '');
  const { data: category } = useCategory(request?.categoryId || '');
  const [budgetLine, setBudgetLine] = useState(null);
  const [preview, setPreview] = useState(null);
  const sortedHistory =
    request?.statusHistory?.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) || [];

  useEffect(() => {
    if (request?.budgetLineId) {
      getBudgetLineById(request.budgetLineId).then(setBudgetLine);
    }
  }, [request?.budgetLineId]);

  const openPreview = (url) => {
    const type = url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
    setPreview({ url, type });
  };

  const closePreview = () => setPreview(null);

  const refDate =
    request?.competenceDate || request?.invoiceDate || request?.dueDate || null;
  const month = refDate ? new Date(refDate).getMonth() + 1 : null;
  const budgetedAmount =
    budgetLine && month ? budgetLine.months?.[month] || 0 : null;
  const difference =
    budgetedAmount !== null ? request.amount - budgetedAmount : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Despesa</DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="py-4">Carregando...</div>
          ) : request ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <span className="font-medium">Centro de Custo:</span> {costCenter?.name || request.costCenterId}
                </div>
                <div>
                  <span className="font-medium">Categoria:</span> {category?.name || request.categoryId}
                </div>
                <div>
                  <span className="font-medium">Valor Solicitado:</span> {formatCurrency(request.amount)}
                </div>
                <div>
                  <span className="font-medium">Valor Orçado:</span> {budgetedAmount !== null ? formatCurrency(budgetedAmount) : '-'}
                </div>
                <div>
                  <span className="font-medium">Diferença:</span>{' '}
                  {difference !== null ? (
                    <span className={difference > 0 ? 'text-red-600 font-bold' : ''}>
                      {formatCurrency(difference)}
                    </span>
                  ) : (
                    '-'
                  )}
                </div>
                <div>
                  <span className="font-medium">Competência:</span> {request.competenceDate ? formatDate(request.competenceDate) : '-'}
                </div>
                <div>
                  <span className="font-medium">Vencimento:</span> {formatDate(request.dueDate)}
                </div>
                {request.invoiceNumber && (
                  <div>
                    <span className="font-medium">NF:</span> {request.invoiceNumber}
                  </div>
                )}
                {request.invoiceDate && (
                  <div>
                    <span className="font-medium">Data NF:</span> {formatDate(request.invoiceDate)}
                  </div>
                )}
                <div>
                  <span className="font-medium">Status:</span> {request.status}
                </div>
                <div>
                  <span className="font-medium">Em Orçamento:</span> {request.inBudget ? 'Sim' : 'Não'}
                </div>
                {request.budgetLineId && (
                  <div className="sm:col-span-2">
                    <span className="font-medium">Orçamento:</span> {budgetLine?.description || request.budgetLineId}
                  </div>
                )}
                {request.isOverBudget && request.overBudgetReason && (
                  <div className="sm:col-span-2">
                    <span className="font-medium">Justificativa do Estouro:</span> {request.overBudgetReason}
                  </div>
                )}
              </div>
              {request.description && (
                <div>
                  <span className="font-medium">Descrição:</span> {request.description}
                </div>
              )}
              {request.attachments && request.attachments.length > 0 && (
                <div>
                  <span className="font-medium">Anexos:</span>
                  <ul className="list-disc list-inside">
                    {request.attachments.map((url, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          className="text-blue-600 hover:underline"
                          onClick={() => openPreview(url)}
                        >
                          {`Anexo ${index + 1}`}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sortedHistory.length > 0 && (
                <div>
                  <span className="font-medium">Histórico de Aprovações:</span>
                  <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {sortedHistory.map((entry, idx) => (
                      <li key={idx} className="border rounded p-2">
                        <div className="text-sm font-medium">
                          {statusLabels[entry.status] || entry.status}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.changedByName} - {formatDateTime(entry.timestamp)}
                        </div>
                        {entry.reason && (
                          <div className="text-xs text-gray-600 mt-1">
                            Motivo: {entry.reason}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={!!preview} onOpenChange={(o) => !o && closePreview()}>
        <DialogContent className="max-w-3xl">
          {preview &&
            (preview.type === 'pdf' ? (
              <iframe src={preview.url} className="w-full h-[80vh]" />
            ) : (
              <img src={preview.url} alt="Pré-visualização do anexo" className="w-full h-auto" />
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestDetailsModal;
