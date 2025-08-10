import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const UsersPage = () => {
  const { users, addUser, permissions, updatePermissions } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', role: 'user' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    await addUser(form);
    setForm({ name: '', email: '', role: 'user' });
  };

  const roles = ['finance', 'cost_center_owner', 'user'];
  const pages = Object.keys(permissions);
  const pageLabels = {
    requests: 'Solicitações',
    vendors: 'Fornecedores',
    users: 'Usuários',
    'cost-centers': 'Centros de Custo',
  };

  const handlePermissionToggle = (page, role) => {
    const roleList = permissions[page] || [];
    const updated = roleList.includes(role)
      ? roleList.filter((r) => r !== role)
      : [...roleList, role];
    updatePermissions(page, updated);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Usuários &amp; Roles</h1>

      <section className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Cadastrar Novo Usuário</h2>
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
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Adicionar Usuário
          </button>
        </form>
      </section>

      <section className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Usuários Cadastrados</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Permissões por Página</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Página</th>
                {roles.map((role) => (
                  <th
                    key={role}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pageLabels[page] || page}
                  </td>
                  {roles.map((role) => (
                    <td key={role} className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={permissions[page]?.includes(role)}
                        onChange={() => handlePermissionToggle(page, role)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
