import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveVendors } from '@/hooks/useVendors';
import { useActiveCostCenters } from '@/hooks/useCostCenters';
import {
  getBudgetLines,
  createBudgetLine,
  updateBudgetLine,
  deleteBudgetLine,
  findBudgetLineByKey,
} from '@/services/budgetLines';
import {
  getTotalSpentByBudgetLine,
  getRequestsByBudgetLine,
} from '@/services/requests';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useNotifications } from '@/stores/ui';
import { parseCurrency } from '@/utils';

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

// Componente da página de Orçamento
export const BudgetsPage = () => {
  const { user, hasAnyRole } = useAuth();
  const { warning } = useNotifications();
  // Permite que usuários com papel "finance", "cost_center_owner" ou "admin" editem o orçamento
  const canEdit = hasAnyRole(['cost_center_owner', 'finance', 'admin']);
  const { data: vendorsData } = useActiveVendors();
  const { data: costCentersData } = useActiveCostCenters();
  const vendors = vendorsData || [];
  const costCenters = costCentersData || [];

  const [form, setForm] = useState({
    id: null,
    vendorId: '',
    costCenterId: '',
    description: '',
    nature: 'fixo',
    costType: 'OPEX',
    year: new Date().getFullYear(),
    months: { ...emptyMonths },
  });

  const [items, setItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({});
  const [expenses, setExpenses] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchItems = async () => {
      const data = await getBudgetLines();
      setItems(data);
    };
    fetchItems();
  }, []);

  useEffect(() => {
    if (!showResults) return;

    const fetchResults = async () => {
      const res = {};
      const exp = {};

      try {
        await Promise.all(
          items
            .filter((item) => item.id)
            .map(async (item) => {
              const monthKeys = Object.keys(emptyMonths);
              const monthValues = await Promise.all(
                monthKeys.map((m) =>
                  getTotalSpentByBudgetLine(item.id, item.year, Number(m))
                )
              );

              res[item.id] = monthKeys.reduce((acc, key, idx) => {
                acc[key] = monthValues[idx];
                return acc;
              }, {});

              exp[item.id] = await getRequestsByBudgetLine(item.id);
            })
        );
        setResults(res);
        setExpenses(exp);
      } catch (err) {
        console.error('Erro ao carregar resultados', err);
      }
    };

    fetchResults();

  }, [showResults, items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMonthChange = (month, value) => {
    setForm((prev) => ({
      ...prev,
      months: { ...prev.months, [month]: parseCurrency(value) },
    }));
  };

  const resetForm = () => {
    setForm({
      id: null,
      vendorId: '',
      costCenterId: '',
      description: '',
      nature: 'fixo',
      costType: 'OPEX',
      year: new Date().getFullYear(),
      months: { ...emptyMonths },
    });
    setEditingIndex(null);
  };

  const toggleResults = () => setShowResults((prev) => !prev);

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const [, ...lines] = rows;
    const monthNames = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    const getVendorIdByName = (name) =>
      vendors.find((v) => v.name?.trim().toLowerCase() === name)?.id || '';
    const getCostCenterIdByName = (name) =>
      costCenters.find((c) => c.name === name)?.id || '';
    const createdItems = [];
    const ignoredLines = [];
    for (const line of lines) {
      if (line.length === 0) continue;
      const [
        fornecedor,
        descricao,
        centroCusto,
        natureza,
        tipo,
        ano,
        ...months
      ] = line;
      const normalizedVendor = (fornecedor || '').trim().toLowerCase();
      const vendorId = getVendorIdByName(normalizedVendor);
      if (!vendorId) {
        const reason = `Fornecedor "${fornecedor}" não encontrado`;
        console.error(reason);
        ignoredLines.push(reason);
        continue;
      }
      const newItem = {
        vendorId,
        description: descricao || '',
        costCenterId: getCostCenterIdByName(centroCusto),
        nature: natureza || 'fixo',
        costType: tipo || 'OPEX',
        year: Number(ano) || new Date().getFullYear(),
        months: monthNames.reduce((acc, _, idx) => {
          acc[idx + 1] = parseCurrency(months[idx]) || 0;
          return acc;
        }, {}),
      };
      const existing = await findBudgetLineByKey(
        newItem.vendorId,
        newItem.description,
        newItem.costCenterId,
        newItem.year
      );
      if (existing) {
        warning('Linha ignorada por duplicidade', `${descricao} - ${fornecedor} / ${centroCusto} (${ano})`);
        continue;
      }
      const created = await createBudgetLine({
        ...newItem,
        createdBy: user.id,
      });
      createdItems.push(created);
    }
    setItems((prev) => [...prev, ...createdItems]);
    if (ignoredLines.length) {
      alert(`Algumas linhas foram ignoradas:\n${ignoredLines.join('\n')}`);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, ...data } = form;
    if (editingIndex !== null) {
      await updateBudgetLine(id, data);
      const newItems = [...items];
      newItems[editingIndex] = { ...data, id };
      setItems(newItems);
    } else {
      const created = await createBudgetLine({ ...data, createdBy: user.id });
      setItems((prev) => [...prev, created]);
    }
    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (index) => {
    setForm(items[index]);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleDelete = async (index) => {
    const item = items[index];
    await deleteBudgetLine(item.id);
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const getVendorName = (id) => vendors.find((v) => v.id === id)?.name || '';
  const getCostCenterName = (id) => costCenters.find((c) => c.id === id)?.name || '';

  const exportToExcel = () => {
    const headers = [
      'Fornecedor',
      'Descrição',
      'Centro de Custo',
      'Natureza',
      'Tipo',
      'Ano',
      ...Object.keys(emptyMonths).map((m) =>
        new Date(0, m - 1).toLocaleString('pt-BR', { month: 'short' })
      ),
    ];
    const data = items.map((item) => [
      getVendorName(item.vendorId),
      item.description,
      getCostCenterName(item.costCenterId),
      item.nature,
      item.costType,
      item.year,
      ...Object.keys(emptyMonths).map((m) => item.months[m] || 0),
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orçamento');
    XLSX.writeFile(workbook, 'orcamento.xlsx');
  };

  const totalColumns = 6 + Object.keys(emptyMonths).length + (canEdit ? 1 : 0);

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx"
        className="hidden"
        onChange={handleExcelUpload}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orçamento</h1>
          <p className="text-muted-foreground">Previsão de gastos por fornecedor e mês</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleResults}
            className="px-4 py-2 bg-gray-200 rounded-md"
          >
            {showResults ? 'Ocultar resultados' : 'Ver resultados'}
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Baixar Excel
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Upload Excel
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Adicionar linha
              </button>
            </>
          )}
        </div>
      </div>
      <Dialog
        open={isModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setIsModalOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Editar orçamento' : 'Novo orçamento'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700" data-tooltip="Fornecedor relacionado à linha">Fornecedor</label>
                <select
                  name="vendorId"
                  value={form.vendorId}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Selecione</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" data-tooltip="Descrição da linha orçamentária">Descrição</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" data-tooltip="Centro de custo responsável">Centro de Custo</label>
              <select
                name="costCenterId"
                value={form.costCenterId}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Selecione</option>
                {costCenters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700" data-tooltip="Indica se o custo é fixo ou variável">Natureza</label>
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
                <label className="block text-sm font-medium text-gray-700" data-tooltip="Classificação contábil (CAPEX/OPEX/CPO)">Tipo de Custo</label>
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
                <label className="block text-sm font-medium text-gray-700" data-tooltip="Ano de referência do orçamento">Ano</label>
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
                  <label className="block text-sm font-medium text-gray-700" data-tooltip="Valor previsto para o mês">
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
            <DialogFooter>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="bg-white p-6 rounded-lg border overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left">Fornecedor</th>
              <th className="px-2 py-2 text-left">Descrição</th>
              <th className="px-2 py-2 text-left">Centro de Custo</th>
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
            {items.map((item, idx) => {
              const totalBudget = Object.values(item.months).reduce(
                (sum, v) => sum + v,
                0
              );
              const totalSpent = Object.values(results[item.id] || {}).reduce(
                (sum, v) => sum + v,
                0
              );
              const attainment = totalBudget
                ? Math.round(((totalBudget - totalSpent) / totalBudget) * 100)
                : 100;
              return (
                <React.Fragment key={item.id || idx}>
                  <tr className="border-t">
                    <td className="px-2 py-2">{getVendorName(item.vendorId)}</td>
                    <td className="px-2 py-2">{item.description}</td>
                    <td className="px-2 py-2">{getCostCenterName(item.costCenterId)}</td>
                    <td className="px-2 py-2 capitalize">{item.nature}</td>
                    <td className="px-2 py-2">{item.costType}</td>
                    <td className="px-2 py-2">{item.year}</td>
                    {Object.keys(emptyMonths).map((m) => (
                      <td key={m} className="px-2 py-2 text-right">
                        <div className="flex flex-col items-end">
                          <span>
                            {item.months[m].toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </span>
                          {showResults && results[item.id] && (
                            <span className="text-xs text-gray-500">
                              {results[item.id][m].toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}{' '}
                              (
                              {item.months[m]
                                ? Math.round(
                                    (results[item.id][m] / item.months[m]) * 100
                                  )
                                : 0}
                              %)
                            </span>
                          )}
                        </div>
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
                  {showResults && (
                    <tr className="bg-gray-50">
                      <td colSpan={totalColumns} className="px-2 py-2">
                        <div className="space-y-1">
                          {expenses[item.id] && expenses[item.id].length > 0 ? (
                            expenses[item.id].map((exp) => {
                              const date = exp.competenceDate
                                ? new Date(exp.competenceDate)
                                : null;
                              return (
                                <div
                                  key={exp.id}
                                  className="flex justify-between text-sm"
                                >
                                  <span>
                                    {exp.description}
                                    {date
                                      ? ` (${date.toLocaleDateString('pt-BR')})`
                                      : ''}
                                  </span>
                                  <span>
                                    {exp.amount.toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    })}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-sm text-gray-500">
                              Nenhuma despesa lançada
                            </div>
                          )}

                          <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                            <span>Total gasto</span>
                            <span>
                              {totalSpent.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}{' '}
                              (Atingimento: {attainment}%)
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={totalColumns}
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

