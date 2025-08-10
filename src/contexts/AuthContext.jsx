import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Simular usuário logado para demonstração
  const mockUser = {
    id: 'demo-user-123',
    name: 'Usuário Demonstração',
    email: 'demo@empresa.com',
    role: 'admin',
    active: true,
    phone: '(11) 99999-9999',
    approvalLimit: 100000,
    costCenters: ['cc-001', 'cc-002'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [users, setUsers] = useState([
    { id: '1', name: 'Administrador', email: 'admin@empresa.com', role: 'admin' },
    { id: '2', name: 'Financeiro', email: 'finance@empresa.com', role: 'finance' },
    { id: '3', name: 'Usuário Padrão', email: 'user@empresa.com', role: 'user' },
  ]);

  const addUser = (user) => {
    setUsers((prev) => [...prev, { id: String(Date.now()), ...user }]);
  };

  const [permissions, setPermissions] = useState({
    requests: ['admin', 'finance', 'user'],
    vendors: ['admin', 'finance'],
    users: ['admin'],
  });

  const updatePermissions = (page, roles) => {
    setPermissions((prev) => ({ ...prev, [page]: roles }));
  };

  const hasPageAccess = (page) =>
    permissions[page]?.includes(mockUser.role) || mockUser.role === 'admin';

  const authValue = {
    user: mockUser,
    users,
    addUser,
    permissions,
    updatePermissions,
    hasPageAccess,
    isAuthenticated: true,
    isLoading: false,
    login: () => {},
    logout: () => {},
    hasRole: (role) => mockUser.role === role || mockUser.role === 'admin',
    hasAnyRole: (roles) => roles.includes(mockUser.role) || mockUser.role === 'admin',
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

