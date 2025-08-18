import React, { useState, useEffect } from 'react';
import { getCostCenters, createCostCenter } from '@/services/costCenters';
import { useAuth } from '@/contexts/AuthContext';

export const CostCentersPage = () => {
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', managerId: '', budget: 0 });
  const { users } = useAuth();

  const fetchCostCenters = async () => {
    try {
      const response = await getCostCenters();
      setCostCenters(response.data);
    } catch (error) {
      console.error('Erro ao carregar centros de custo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCostCenter({
        name: form.name,
        managerId: form.managerId,
        budget: Number(form.budget)
      });
      setShowModal(false);
      setForm({ name: '', managerId: '', budget: 0 });
      fetchCostCenters();
    } catch (error) {
      console.error('Erro ao criar centro de custo:', error);
    }
  };

  const getManagerEmail = (managerId) => {
    const id = typeof managerId === 'string' ? managerId : managerId?.id;
    return users.find((u) => u.id === id)?.email || id;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="text-muted-foreground">Gerencie centros de custo e orçamentos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Novo Centro de Custo
        </button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="bg-white p-6 rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gerente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orçamento</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {costCenters.map((cc) => (
                <tr key={cc.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{cc.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cc.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getManagerEmail(cc.managerId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cc.budget != null
                      ? cc.budget.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
              {costCenters.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum centro de custo cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Novo Centro de Custo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gerente</label>
                <select
                  name="managerId"
                  value={form.managerId}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Orçamento</label>
                <input
                  name="budget"
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-md border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCentersPage;

