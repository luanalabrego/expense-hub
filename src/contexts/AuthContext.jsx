import React, { createContext, useContext } from 'react';

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

  const authValue = {
    user: mockUser,
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

