import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useVendors,
  useApproveVendor,
  useRejectVendor,
  useRequestMoreInfoVendor,
} from '@/hooks/useVendors';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCNPJ, formatDate } from '@/utils';
import VendorDetailsModal from '@/components/VendorDetailsModal';
import { useConfirm } from '@/hooks/useConfirm';
import { usePrompt } from '@/contexts/PromptContext';

export const VendorApprovalsPage = () => {
  const { data: vendorsData, isLoading, isError } = useVendors({
    status: 'pending',
    page: 1,
    limit: 50,
  });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const navigate = useNavigate();
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
  } = useVendors({
    page: 1,
    limit: 100,
    sortBy,
    sortOrder,
  });
  const approveVendor = useApproveVendor();
  const rejectVendor = useRejectVendor();
  const requestInfoVendor = useRequestMoreInfoVendor();

  const { confirm, ConfirmationDialog } = useConfirm();
  const prompt = usePrompt();

  const handleApprove = async (id) => {
    if (await confirm('Aprovar este fornecedor?')) {
      await approveVendor.mutateAsync(id);
    }
  };

  const handleReject = async (id) => {
    const reason = await prompt({ title: 'Motivo da reprovação:' });
    if (reason) {
      await rejectVendor.mutateAsync({ id, reason });
    }
  };

  const handleRequestInfo = async (id) => {
    const info = await prompt({ title: 'Quais informações adicionais são necessárias?' });
    if (info) {
      await requestInfoVendor.mutateAsync({ id, info });
    }
  };

  const vendors = vendorsData?.data ?? [];
  const historyVendors = (historyData?.data ?? []).filter(
    (v) => v.status !== 'pending'
  );
  const filteredHistory = historyVendors.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      (v.taxId && v.taxId.includes(search))
    );
  });

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const openVendorDetails = (id) => {
    setSelectedVendorId(id);
    setShowDetails(true);
  };

  return (
    <>
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
                      <button
                        onClick={() => openVendorDetails(vendor.id)}
                        className="text-blue-600 hover:underline"
                      >
                        {vendor.name}
                      </button>
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

      <h2 className="text-2xl font-bold tracking-tight">Histórico de Aprovações</h2>
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar fornecedores..."
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        {historyLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : historyError ? (
          <div className="text-center py-12 text-red-500">
            Erro ao carregar histórico
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum histórico encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => toggleSort('name')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Fornecedor
                  </th>
                  <th
                    onClick={() => toggleSort('status')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Status
                  </th>
                  <th
                    onClick={() => toggleSort('updatedAt')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Atualizado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vendor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(vendor.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <VendorDetailsModal
        vendorId={selectedVendorId}
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedVendorId('');
        }}
        onApprove={async (id) => {
          await handleApprove(id);
          setShowDetails(false);
        }}
        onReject={async (id) => {
          await handleReject(id);
          setShowDetails(false);
        }}
        onRequestInfo={async (id) => {
          await handleRequestInfo(id);
          setShowDetails(false);
        }}
        approveDisabled={approveVendor.isPending}
        rejectDisabled={rejectVendor.isPending}
        requestInfoDisabled={requestInfoVendor.isPending}
      />
    </div>
    <ConfirmationDialog />
    </>
  );
};
