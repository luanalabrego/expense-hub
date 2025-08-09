import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Edit, Eye, CheckCircle, XCircle, Clock, DollarSign, AlertTriangle } from 'lucide-react';

// Dados mockados para demonstração
const mockRequests = [
  {
    id: 'REQ-001',
    number: '202401001',
    description: 'Licenças de software Microsoft Office',
    amount: 15000,
    status: 'pending',
    priority: 'high',
    vendor: { name: 'Microsoft Brasil' },
    costCenter: { name: 'TI', code: 'CC-001' },
    category: { name: 'Software' },
    requester: { name: 'João Silva' },
    dueDate: new Date('2024-02-15'),
    createdAt: new Date('2024-01-15'),
    paymentMethod: 'transfer'
  },
  {
    id: 'REQ-002',
    number: '202401002',
    description: 'Material de escritório',
    amount: 2500,
    status: 'approved',
    priority: 'medium',
    vendor: { name: 'Papelaria Central' },
    costCenter: { name: 'Administrativo', code: 'CC-002' },
    category: { name: 'Material de Escritório' },
    requester: { name: 'Maria Santos' },
    dueDate: new Date('2024-02-20'),
    createdAt: new Date('2024-01-20'),
    paymentMethod: 'check'
  },
  {
    id: 'REQ-003',
    number: '202401003',
    description: 'Consultoria jurídica',
    amount: 8000,
    status: 'paid',
    priority: 'urgent',
    vendor: { name: 'Advocacia & Consultoria' },
    costCenter: { name: 'Jurídico', code: 'CC-003' },
    category: { name: 'Consultoria' },
    requester: { name: 'Carlos Oliveira' },
    dueDate: new Date('2024-01-30'),
    createdAt: new Date('2024-01-10'),
    paymentMethod: 'transfer'
  },
  {
    id: 'REQ-004',
    number: '202401004',
    description: 'Equipamentos de TI',
    amount: 25000,
    status: 'rejected',
    priority: 'low',
    vendor: { name: 'Tech Solutions' },
    costCenter: { name: 'TI', code: 'CC-001' },
    category: { name: 'Equipamentos' },
    requester: { name: 'Ana Costa' },
    dueDate: new Date('2024-03-01'),
    createdAt: new Date('2024-01-25'),
    paymentMethod: 'transfer'
  }
];

export const RequestsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      paid: 'Pago',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority] || priority;
  };

  const filteredRequests = mockRequests.filter(request => {
    const matchesSearch = !search || 
      request.description.toLowerCase().includes(search.toLowerCase()) ||
      request.number.toLowerCase().includes(search.toLowerCase()) ||
      request.vendor.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações de Pagamento</h1>
          <p className="text-muted-foreground">
            Gerencie todas as solicitações de pagamento da empresa
          </p>
        </div>
        <button
          onClick={() => navigate('/requests/new')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Solicitação
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold">{mockRequests.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold">
                {mockRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprovadas</p>
              <p className="text-2xl font-bold">
                {mockRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(mockRequests.reduce((sum, r) => sum + r.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por descrição, número ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
              <option value="paid">Pago</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {request.number}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {request.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.vendor.name}</div>
                    <div className="text-sm text-gray-500">{request.costCenter.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(request.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                      {getPriorityLabel(request.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/requests/${request.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => alert('Aprovar solicitação (Demo)')}
                            className="text-green-600 hover:text-green-900"
                            title="Aprovar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert('Rejeitar solicitação (Demo)')}
                            className="text-red-600 hover:text-red-900"
                            title="Rejeitar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => navigate(`/requests/${request.id}/edit`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma solicitação encontrada</p>
          </div>
        )}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando {filteredRequests.length} de {mockRequests.length} solicitações
        </div>
        <div className="flex space-x-2">
          <button
            disabled
            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            disabled
            className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
};

