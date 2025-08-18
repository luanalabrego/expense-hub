import React from 'react';
import { useVendors, useApproveVendorContract, useRequestVendorContractAdjustments } from '@/hooks/useVendors';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCNPJ } from '@/utils';

export const ContractReviewPage = () => {
  const { data: vendorsData, isLoading, isError } = useVendors({ status: 'contract_review', page: 1, limit: 50 });
  const approveContract = useApproveVendorContract();
  const requestAdjustments = useRequestVendorContractAdjustments();

  const handleApprove = async (id) => {
    if (window.confirm('Aprovar contrato deste fornecedor?')) {
      await approveContract.mutateAsync(id);
    }
  };

  const handleRequestAdjustments = async (id) => {
    const notes = window.prompt('Informe as notas do jurídico:');
    if (notes) {
      await requestAdjustments.mutateAsync({ id, notes });
    }
  };

  const vendors = vendorsData?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Revisão de Contratos</h1>
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Erro ao carregar contratos</div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum contrato para revisão</p>
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
                        disabled={approveContract.isPending}
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleRequestAdjustments(vendor.id)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded-md"
                        disabled={requestAdjustments.isPending}
                      >
                        Solicitar Ajustes
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

export default ContractReviewPage;
