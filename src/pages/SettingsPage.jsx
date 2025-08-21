import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/services/settings';

export const SettingsPage = () => {
  const [limits, setLimits] = useState([{ key: '', value: '' }]);
  const [params, setParams] = useState([{ key: '', value: '' }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getSettings();
      setLimits(
        Object.entries(data.limits || {}).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      );
      setParams(
        Object.entries(data.params || {}).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (setter) => (index, field, value) => {
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleAdd = (setter) => () => setter((prev) => [...prev, { key: '', value: '' }]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const limitsObj = limits.reduce((acc, cur) => {
      if (cur.key) acc[cur.key] = Number(cur.value);
      return acc;
    }, {});
    const paramsObj = params.reduce((acc, cur) => {
      if (cur.key) acc[cur.key] = cur.value;
      return acc;
    }, {});
    await updateSettings({ limits: limitsObj, params: paramsObj });
    setSaving(false);
    alert('Parâmetros salvos com sucesso');
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Parâmetros Gerais</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Alçadas de Aprovação</h2>
          {limits.map((item, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                className="border rounded p-1 flex-1"
                placeholder="Nome"
                value={item.key}
                onChange={(e) => handleChange(setLimits)(index, 'key', e.target.value)}
              />
              <input
                className="border rounded p-1 w-32"
                placeholder="Valor"
                type="number"
                value={item.value}
                onChange={(e) => handleChange(setLimits)(index, 'value', e.target.value)}
              />
            </div>
          ))}
          <button
            type="button"
            className="px-2 py-1 text-sm bg-gray-200 rounded"
            onClick={handleAdd(setLimits)}
          >
            Adicionar Alçada
          </button>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Parametrizações</h2>
          {params.map((item, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                className="border rounded p-1 flex-1"
                placeholder="Chave"
                value={item.key}
                onChange={(e) => handleChange(setParams)(index, 'key', e.target.value)}
              />
              <input
                className="border rounded p-1 flex-1"
                placeholder="Valor"
                value={item.value}
                onChange={(e) => handleChange(setParams)(index, 'value', e.target.value)}
              />
            </div>
          ))}
          <button
            type="button"
            className="px-2 py-1 text-sm bg-gray-200 rounded"
            onClick={handleAdd(setParams)}
          >
            Adicionar Parametrização
          </button>
        </section>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  );
};
