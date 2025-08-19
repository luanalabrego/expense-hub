import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/services/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/stores/auth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const { login: storeLogin, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const formattedUser = { id: firebaseUser.uid, email: firebaseUser.email, ...userData };
        setCurrentUser(formattedUser);
        storeLogin({
          id: firebaseUser.uid,
          name: userData.name || firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          roles: userData.roles || (userData.role ? [userData.role] : []),
          ccScope: userData.ccScope || [],
          approvalLimit: userData.approvalLimit || 0,
          status: userData.status || 'active',
          createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
          updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date(),
        });
      } else {
        setCurrentUser(null);
        storeLogout();
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [storeLogin, storeLogout]);

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
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const deleteUser = async (id) => {
    await deleteDoc(doc(db, 'users', id));
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const [permissions, setPermissions] = useState({
    requests: ['finance', 'cost_center_owner', 'user', 'fpa', 'director', 'cfo', 'ceo'],
    vendors: ['finance'],
    vendorApprovals: ['finance'],
    contractReview: ['finance'],
    validation: ['finance'],
    ownerApprovals: ['cost_center_owner'],
    financialApprovals: ['fpa'],
    directorApprovals: ['director'],
    cfoApprovals: ['cfo'],
    ceoApprovals: ['ceo'],
    users: ['finance'],
    'cost-centers': ['finance', 'cost_center_owner'],
    payments: ['finance'],
    reports: ['finance'],
    budgets: ['cost_center_owner'],
  });

  const updatePermissions = (page, roles) => {
    setPermissions((prev) => ({ ...prev, [page]: roles }));
  };

  const hasPageAccess = (page) => {
    const roles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
    return (
      roles.includes('finance') ||
      roles.includes('admin') ||
      roles.some((role) => permissions[page]?.includes(role))
    );
  };

  const login = (email, password) => {
    setIsLoading(true);
    return signInWithEmailAndPassword(auth, email, password).finally(() => setIsLoading(false));
  };

  const logout = async () => {
    await signOut(auth);
  };

  const authValue = {
    user: currentUser,
    users,
    addUser,
    updateUserRole,
    deleteUser,
    permissions,
    updatePermissions,
    hasPageAccess,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    logout,
    hasRole: (role) => {
      const roles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
      return roles.includes(role) || roles.includes('finance') || roles.includes('admin');
    },
    hasAnyRole: (rolesToCheck) => {
      const roles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
      return roles.includes('finance') || roles.includes('admin') || rolesToCheck.some((r) => roles.includes(r));
    },
  };

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};
