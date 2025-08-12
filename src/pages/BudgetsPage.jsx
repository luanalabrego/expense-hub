import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveVendors } from '@/hooks/useVendors';

// Componente da página de Orçamento
export const BudgetsPage = () => {
  const { user } = useAuth();
  // Permite que usuários com papel "finance" também editem o orçamento
  const canEdit =
    user.role === 'cost_center_owner' || user.role === 'finance';
  const { data: vendorsData } = useActiveVendors();
  const vendors = vendorsData || [];

  const emptyMonths = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
  };

  const [form, setForm] = useState({
    vendorId: '',
    description: '',
    nature: 'fixo',
    costType: 'OPEX',
    year: new Date().getFullYear(),
    months: { ...emptyMonths },
  });

  const [items, setItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMonthChange = (month, value) => {
    setForm((prev) => ({
      ...prev,
      months: { ...prev.months, [month]: Number(value) },
    }));
  };

  const resetForm = () => {
    setForm({
      vendorId: '',
      description: '',
      nature: 'fixo',
      costType: 'OPEX',
      year: new Date().getFullYear(),
      months: { ...emptyMonths },
    });
    setEditingIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingIndex !== null) {
      const newItems = [...items];
      newItems[editingIndex] = form;
      setItems(newItems);
    } else {
      setItems((prev) => [...prev, form]);
    }
    resetForm();
  };

  const handleEdit = (index) => {
    setForm(items[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const getVendorName = (id) => vendors.find((v) => v.id === id)?.name || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orçamento</h1>
          <p className="text-muted-foreground">Previsão de gastos por fornecedor e mês</p>
        </div>
      </div>

      {canEdit && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Adicionar linha</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                <select
                  name="vendorId"
                  value={form.vendorId}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Selecione</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Natureza</label>
                <select
                  name="nature"
                  value={form.nature}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="fixo">Fixo</option>
                  <option value="variavel">Variável</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Custo</label>
                <select
                  name="costType"
                  value={form.costType}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="OPEX">OPEX</option>
                  <option value="CAPEX">CAPEX</option>
                  <option value="CPO">CPO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ano</label>
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {Object.keys(form.months).map((month) => (
                <div key={month}>
                  <label className="block text-sm font-medium text-gray-700">
                    {new Date(0, month - 1).toLocaleString('pt-BR', { month: 'short' })}
                  </label>
                  <input
                    type="number"
                    value={form.months[month]}
                    onChange={(e) => handleMonthChange(month, e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              ))}
            </div>
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
              </button>
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="ml-2 px-4 py-2 bg-gray-200 rounded-md"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left">Fornecedor</th>
              <th className="px-2 py-2 text-left">Descrição</th>
              <th className="px-2 py-2 text-left">Natureza</th>
              <th className="px-2 py-2 text-left">Tipo</th>
              <th className="px-2 py-2 text-left">Ano</th>
              {Object.keys(emptyMonths).map((m) => (
                <th key={m} className="px-2 py-2 text-right">
                  {new Date(0, m - 1).toLocaleString('pt-BR', { month: 'short' })}
                </th>
              ))}
              {canEdit && <th className="px-2 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-2 py-2">{getVendorName(item.vendorId)}</td>
                <td className="px-2 py-2">{item.description}</td>
                <td className="px-2 py-2 capitalize">{item.nature}</td>
                <td className="px-2 py-2">{item.costType}</td>
                <td className="px-2 py-2">{item.year}</td>
                {Object.keys(emptyMonths).map((m) => (
                  <td key={m} className="px-2 py-2 text-right">
                    {item.months[m].toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                ))}
                {canEdit && (
                  <td className="px-2 py-2 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(idx)}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={canEdit ? 17 : 16}
                  className="px-2 py-4 text-center text-gray-500"
                >
                  Nenhuma linha adicionada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

