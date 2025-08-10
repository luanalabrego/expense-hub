import React from 'react';
import { useParams } from 'react-router-dom';
import { useVendor } from '@/hooks/useVendors';
import { useRequests } from '@/hooks/useRequests';
import { useEntityTimeline } from '@/hooks/useAudit';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCNPJ, formatCurrency, formatDate } from '@/utils';

export const VendorDossierPage = () => {
  const { id } = useParams();
  const { data: vendor, isLoading, isError } = useVendor(id || '');
  const { data: requestsData, isLoading: requestsLoading } = useRequests({
    page: 1,
    limit: 20,
    vendorId: id,
  });
  const { data: timelineData, isLoading: timelineLoading } = useEntityTimeline(
    'vendor',
    id || '',
    20
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !vendor) {
    return <div className="text-center py-12">Fornecedor não encontrado</div>;
  }

  const requests = requestsData?.data ?? [];
  const timeline = timelineData ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dossiê do Fornecedor</h1>

      <div className="bg-white p-6 rounded-lg border space-y-2">
        <div><span className="font-semibold">Nome: </span>{vendor.name}</div>
        <div><span className="font-semibold">CNPJ: </span>{formatCNPJ(vendor.taxId)}</div>
        <div><span className="font-semibold">Status: </span>{vendor.status}</div>
        {vendor.email && (
          <div><span className="font-semibold">Email: </span>{vendor.email}</div>
        )}
        {vendor.phone && (
          <div><span className="font-semibold">Telefone: </span>{vendor.phone}</div>
        )}
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Histórico de Despesas</h2>
        <div className="bg-white rounded-lg border overflow-hidden">
          {requestsLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner size="lg" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-6">Nenhuma despesa encontrada</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.requestNumber || req.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(req.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Histórico de Aprovações</h2>
        <div className="bg-white rounded-lg border overflow-hidden">
          {timelineLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner size="lg" />
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-6">Nenhum registro encontrado</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeline.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default VendorDossierPage;
