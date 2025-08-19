import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { LoadingSpinner } from './ui/loading-spinner';
import { useVendor } from '@/hooks/useVendors';
import { useDocumentsByEntity } from '@/hooks/useDocuments';
import { formatCNPJ } from '@/utils';

export const VendorDetailsModal = ({
  vendorId,
  open,
  onClose,
  onApprove,
  onReject,
  onRequestInfo,
  approveDisabled,
  rejectDisabled,
  requestInfoDisabled,
}) => {
  const { data: vendor, isLoading: vendorLoading } = useVendor(vendorId || '');
  const { data: docsData, isLoading: docsLoading } = useDocumentsByEntity('vendor', vendorId || '');
  const documents = docsData ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        {vendorLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : vendor ? (
          <>
            <DialogHeader>
              <DialogTitle>{vendor.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div><span className="font-semibold">CNPJ: </span>{formatCNPJ(vendor.taxId)}</div>
              {vendor.email && (
                <div><span className="font-semibold">Email: </span>{vendor.email}</div>
              )}
              {vendor.phone && (
                <div><span className="font-semibold">Telefone: </span>{vendor.phone}</div>
              )}
              {vendor.serviceType && (
                <div><span className="font-semibold">Tipo de Serviço: </span>{vendor.serviceType}</div>
              )}
              {vendor.scope && (
                <div><span className="font-semibold">Escopo: </span>{vendor.scope}</div>
              )}
              {vendor.paymentTerms && (
                <div><span className="font-semibold">Prazo de pagamento: </span>{vendor.paymentTerms}</div>
              )}
              {vendor.tags && vendor.tags.length > 0 && (
                <div><span className="font-semibold">Tags: </span>{vendor.tags.join(', ')}</div>
              )}
              {vendor.categories && vendor.categories.length > 0 && (
                <div><span className="font-semibold">Categorias: </span>{vendor.categories.join(', ')}</div>
              )}
              {vendor.observations && (
                <div><span className="font-semibold">Observações: </span>{vendor.observations}</div>
              )}
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Documentos</h3>
              {docsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : documents.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum documento anexado</p>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {doc.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter className="mt-6">
              <button
                onClick={() => onApprove(vendor.id)}
                className="px-3 py-1 bg-green-600 text-white rounded-md"
                disabled={approveDisabled}
              >
                Aprovar
              </button>
              <button
                onClick={() => onReject(vendor.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-md"
                disabled={rejectDisabled}
              >
                Reprovar
              </button>
              <button
                onClick={() => onRequestInfo(vendor.id)}
                className="px-3 py-1 bg-yellow-600 text-white rounded-md"
                disabled={requestInfoDisabled}
              >
                Mais Info
              </button>
            </DialogFooter>
          </>
        ) : (
          <div className="text-center py-12">Fornecedor não encontrado</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VendorDetailsModal;
