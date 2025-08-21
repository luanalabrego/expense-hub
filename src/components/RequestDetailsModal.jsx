import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { formatCurrency, formatDate } from '@/utils';
import { useRequest } from '@/hooks/useRequests';
import { useCostCenter } from '@/hooks/useCostCenters';
import { useCategory } from '@/hooks/useCategories';
import { getBudgetLineById } from '@/services/budgetLines';

const RequestDetailsModal = ({ requestId, open, onClose }) => {
  const { data: request, isLoading } = useRequest(requestId);
  const { data: costCenter } = useCostCenter(request?.costCenterId || '');
  const { data: category } = useCategory(request?.categoryId || '');
  const [budgetLine, setBudgetLine] = useState(null);
  const [preview, setPreview] = useState(null);

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
                  <span className="font-medium">Valor:</span> {formatCurrency(request.amount)}
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
                {request.inBudget && (
                  <div className="sm:col-span-2">
                    <span className="font-medium">Orçamento:</span> {budgetLine?.description || request.budgetLineId}
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
