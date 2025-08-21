import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { formatCurrency, formatDate } from '@/utils';
import { useRequest } from '@/hooks/useRequests';

const RequestDetailsModal = ({ requestId, open, onClose }) => {
  const { data: request, isLoading } = useRequest(requestId);
  const [preview, setPreview] = useState(null);

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
