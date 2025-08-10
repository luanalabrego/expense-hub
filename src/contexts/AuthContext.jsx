import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

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

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  const addUser = async (user) => {
    const docRef = await addDoc(collection(db, 'users'), user);
    setUsers((prev) => [...prev, { id: docRef.id, ...user }]);
  };

  const [permissions, setPermissions] = useState({
    requests: ['admin', 'finance', 'user'],
    vendors: ['admin', 'finance'],
    vendorApprovals: ['procurement'],
    users: ['admin'],
    'cost-centers': ['admin', 'finance'],
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

