import React, { useState } from 'react';

const availableTables = [
  {
    name: 'expenses',
    label: 'Despesas',
    columns: [
      { value: 'id', label: 'ID' },
      { value: 'title', label: 'Título' },
      { value: 'amount', label: 'Valor' },
      { value: 'status', label: 'Status' },
      { value: 'createdAt', label: 'Criado em' },
    ],
  },
  {
    name: 'users',
    label: 'Usuários',
    columns: [
      { value: 'id', label: 'ID' },
      { value: 'name', label: 'Nome' },
      { value: 'email', label: 'Email' },
    ],
  },
];

const availableMetrics = [
  { value: 'count', label: 'Contagem' },
  { value: 'sum', label: 'Soma' },
  { value: 'average', label: 'Média' },
];

export const ReportsPage = () => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filters, setFilters] = useState([{ column: '', value: '' }]);
  const [metric, setMetric] = useState('count');

  const columnsForSelectedTable = selectedTable
    ? availableTables.find((t) => t.name === selectedTable)?.columns || []
    : [];

  const toggleColumn = (col) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const handleFilterChange = (index, field, value) => {
    setFilters((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  };

  const addFilterRow = () => {
    setFilters((prev) => [...prev, { column: '', value: '' }]);
  };

  const handleTableChange = (value) => {
    setSelectedTable(value);
    setSelectedColumns([]);
    setFilters([{ column: '', value: '' }]);
  };

  const handleGenerate = () => {
    // Placeholder for generating report
    // In a real app, this would fetch data based on selections
    console.log({ selectedTable, selectedColumns, filters, metric });
    alert('Relatório gerado (exemplo).');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>

      {!showBuilder && (
        <button
          onClick={() => setShowBuilder(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Novo Relatório
        </button>
      )}

      {showBuilder && (
        <div className="space-y-6 bg-white p-6 rounded-lg border">
          <div>
            <h2 className="text-xl font-semibold mb-2">Tabela</h2>
            <select
              value={selectedTable}
              onChange={(e) => handleTableChange(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione uma tabela</option>
              {availableTables.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {selectedTable && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Colunas Disponíveis</h2>
              <div className="space-y-2">
                {columnsForSelectedTable.map((col) => (
                  <label key={col.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.value)}
                      onChange={() => toggleColumn(col.value)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-2">Métrica</h2>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableMetrics.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {selectedTable && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Filtros</h2>
              {filters.map((filter, idx) => (
                <div key={idx} className="flex space-x-2 mb-2">
                  <select
                    value={filter.column}
                    onChange={(e) => handleFilterChange(idx, 'column', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md"
                  >
                    <option value="">Coluna</option>
                    {columnsForSelectedTable.map((col) => (
                      <option key={col.value} value={col.value}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={filter.value}
                    onChange={(e) => handleFilterChange(idx, 'value', e.target.value)}
                    placeholder="Valor"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addFilterRow}
                className="text-sm text-blue-600 hover:underline"
              >
                Adicionar filtro
              </button>
            </div>
          )}

          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Gerar Relatório
          </button>
        </div>
      )}
    </div>
  );
};

