import React from 'react';
import { useVendors, useApproveVendor, useRejectVendor, useRequestMoreInfoVendor } from '@/hooks/useVendors';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCNPJ } from '@/utils';

export const VendorApprovalsPage = () => {
  const { data: vendorsData, isLoading, isError } = useVendors({ status: 'pending', page: 1, limit: 50 });
  const approveVendor = useApproveVendor();
  const rejectVendor = useRejectVendor();
  const requestInfoVendor = useRequestMoreInfoVendor();

  const handleApprove = async (id) => {
    if (window.confirm('Aprovar este fornecedor?')) {
      await approveVendor.mutateAsync(id);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Motivo da reprovação:');
    if (reason) {
      await rejectVendor.mutateAsync({ id, reason });
    }
  };

  const handleRequestInfo = async (id) => {
    const info = window.prompt('Quais informações adicionais são necessárias?');
    if (info) {
      await requestInfoVendor.mutateAsync({ id, info });
    }
  };

  const vendors = vendorsData?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Aprovação de Fornecedores</h1>
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Erro ao carregar fornecedores</div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum fornecedor pendente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vendor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCNPJ(vendor.taxId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleApprove(vendor.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md"
                        disabled={approveVendor.isPending}
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(vendor.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md"
                        disabled={rejectVendor.isPending}
                      >
                        Reprovar
                      </button>
                      <button
                        onClick={() => handleRequestInfo(vendor.id)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded-md"
                        disabled={requestInfoVendor.isPending}
                      >
                        Mais Info
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
