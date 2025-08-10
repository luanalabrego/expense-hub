import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

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
    role: 'finance',
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

  const updateUserRole = async (id, role) => {
    await updateDoc(doc(db, 'users', id), { role });
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );
  };

  const deleteUser = async (id) => {
    await deleteDoc(doc(db, 'users', id));
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const [permissions, setPermissions] = useState({
    requests: ['finance', 'cost_center_owner', 'user'],
    vendors: ['finance'],
    vendorApprovals: ['finance'],
    users: ['finance'],
    'cost-centers': ['finance', 'cost_center_owner'],
    financialApprovals: ['finance'],
    payments: ['finance'],
  });

  const updatePermissions = (page, roles) => {
    setPermissions((prev) => ({ ...prev, [page]: roles }));
  };

  const hasPageAccess = (page) =>
    permissions[page]?.includes(mockUser.role) || mockUser.role === 'finance';

  const authValue = {
    user: mockUser,
    users,
    addUser,
    updateUserRole,
    deleteUser,
    permissions,
    updatePermissions,
    hasPageAccess,
    isAuthenticated: true,
    isLoading: false,
    login: () => {},
    logout: () => {},
    hasRole: (role) => mockUser.role === role || mockUser.role === 'finance',
    hasAnyRole: (roles) => roles.includes(mockUser.role) || mockUser.role === 'finance',
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

