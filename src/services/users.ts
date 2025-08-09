// Serviços para gestão de usuários
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification 
} from 'firebase/auth';
import { db, auth } from './firebase';
import type { User, PaginationParams, PaginatedResponse } from '../types';

const COLLECTION_NAME = 'users';

// Obter usuário atual
export const getCurrentUser = async (): Promise<User | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const userDoc = await getDoc(doc(db, COLLECTION_NAME, currentUser.uid));
  if (!userDoc.exists()) return null;

  return {
    id: userDoc.id,
    ...userDoc.data()
  } as User;
};

// Obter usuário por ID
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!userDoc.exists()) return null;

    return {
      id: userDoc.id,
      ...userDoc.data()
    } as User;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
};

// Listar usuários com paginação
export const getUsers = async (
  params: PaginationParams & {
    role?: string;
    status?: string;
    search?: string;
  } = { page: 1, limit: 20 }
): Promise<PaginatedResponse<User>> => {
  try {
    let q = query(collection(db, COLLECTION_NAME));

    // Filtros
    if (params.role) {
      q = query(q, where('roles', 'array-contains', params.role));
    }

    if (params.status) {
      q = query(q, where('status', '==', params.status));
    }

    // Ordenação
    const sortField = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    q = query(q, orderBy(sortField, sortOrder));

    // Paginação
    if (params.page > 1) {
      // Para implementar paginação real, seria necessário armazenar o último documento
      // Por simplicidade, vamos usar limit e offset simulado
      const offset = (params.page - 1) * params.limit;
      q = query(q, limit(params.limit + offset));
    } else {
      q = query(q, limit(params.limit));
    }

    const snapshot = await getDocs(q);
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];

    // Aplicar offset simulado (não é eficiente, mas funciona para MVP)
    if (params.page > 1) {
      const offset = (params.page - 1) * params.limit;
      users = users.slice(offset);
    }

    // Filtro de busca no frontend (para MVP)
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Calcular total (aproximado)
    const total = snapshot.size;
    const totalPages = Math.ceil(total / params.limit);

    return {
      data: users,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw error;
  }
};

// Criar usuário
export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  roles: string[];
  ccScope?: string[];
  approvalLimit?: number;
}): Promise<User> => {
  try {
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    // Atualizar perfil
    await updateProfile(userCredential.user, {
      displayName: userData.name
    });

    // Enviar email de verificação
    await sendEmailVerification(userCredential.user);

    // Criar documento no Firestore
    const userDoc = {
      name: userData.name,
      email: userData.email,
      roles: userData.roles,
      ccScope: userData.ccScope || [],
      approvalLimit: userData.approvalLimit || 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Usar o UID do Firebase Auth como ID do documento
    await updateDoc(doc(db, COLLECTION_NAME, userCredential.user.uid), userDoc);

    return {
      id: userCredential.user.uid,
      ...userDoc
    } as User;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
};

// Atualizar usuário
export const updateUser = async (
  id: string, 
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};

// Desativar usuário (soft delete)
export const deactivateUser = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'inactive',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    throw error;
  }
};

// Reativar usuário
export const reactivateUser = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'active',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao reativar usuário:', error);
    throw error;
  }
};

// Obter usuários por papel
export const getUsersByRole = async (role: string): Promise<User[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('roles', 'array-contains', role),
      where('status', '==', 'active'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Erro ao buscar usuários por papel:', error);
    throw error;
  }
};

// Obter usuários por centro de custo
export const getUsersByCostCenter = async (costCenterId: string): Promise<User[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('ccScope', 'array-contains', costCenterId),
      where('status', '==', 'active'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Erro ao buscar usuários por centro de custo:', error);
    throw error;
  }
};

// Verificar se email já existe
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('email', '==', email),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    throw error;
  }
};

// Atualizar perfil do usuário atual
export const updateCurrentUserProfile = async (
  updates: Partial<Pick<User, 'name'>>
): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuário não autenticado');

    // Atualizar no Firebase Auth
    if (updates.name) {
      await updateProfile(currentUser, {
        displayName: updates.name
      });
    }

    // Atualizar no Firestore
    await updateDoc(doc(db, COLLECTION_NAME, currentUser.uid), {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
};

