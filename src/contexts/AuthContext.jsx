import React, { createContext, useContext, useEffect, useState } from 'react';
import app, { auth, db } from '@/services/firebase';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  getAuth,
} from 'firebase/auth';
import { getApps, initializeApp } from 'firebase/app';
import { useAuthStore } from '@/stores/auth';

const AuthContext = createContext({});

// Secondary Firebase app to create new users without affecting current session
const secondaryApp =
  getApps().find((a) => a.name === 'Secondary') ||
  initializeApp(app.options, 'Secondary');
const secondaryAuth = getAuth(secondaryApp);

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

        // Normaliza os papéis para um array em minúsculas
        const roles = Array.isArray(userData.roles)
          ? userData.roles
          : userData.role
            ? [userData.role]
            : [];
        const normalizedRoles = roles.map((r) => r.toLowerCase());

        const formattedUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          ...userData,
          roles: normalizedRoles,
        };
        setCurrentUser(formattedUser);

        storeLogin({
          id: firebaseUser.uid,
          name: userData.name || firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          roles: normalizedRoles,
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
    // Create user in Firebase Auth using a secondary app instance
    const tempPassword = Math.random().toString(36).slice(-8);
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      user.email,
      tempPassword,
    );

    // Store user information in Firestore using the auth UID
    await setDoc(doc(db, 'users', cred.user.uid), user);

    // Update local state
    setUsers((prev) => [...prev, { id: cred.user.uid, ...user }]);

    // Send email for the user to define a password
    await sendPasswordResetEmail(auth, user.email);
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
    requests: ['admin', 'finance', 'cost_center_owner', 'user', 'fpa', 'director', 'cfo', 'ceo'],
    vendors: ['admin', 'finance'],
    vendorApprovals: ['admin', 'finance'],
    contractReview: ['admin', 'finance'],
    validation: ['admin', 'finance'],
    ownerApprovals: ['admin', 'cost_center_owner'],
    financialApprovals: ['admin', 'fpa'],
    directorApprovals: ['admin', 'director'],
    cfoApprovals: ['admin', 'cfo'],
    ceoApprovals: ['admin', 'ceo'],
    users: ['admin', 'finance'],
    'cost-centers': ['admin', 'finance', 'cost_center_owner'],
    payments: ['admin', 'finance'],
    reports: ['admin', 'finance'],
    budgets: ['admin', 'cost_center_owner'],
  });

  const updatePermissions = (page, roles) => {
    setPermissions((prev) => ({ ...prev, [page]: roles }));
  };

  // Temporarily allow access to all pages for every role
  const hasPageAccess = () => true;

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
    hasRole: () => true,
    hasAnyRole: () => true,
  };

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};
