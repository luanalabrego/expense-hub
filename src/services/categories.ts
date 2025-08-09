// Serviços para gestão de categorias
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
import { db } from './firebase';
import type { Category, PaginationParams, PaginatedResponse } from '../types';

const COLLECTION_NAME = 'categories';

// Obter categoria por ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const categoryDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!categoryDoc.exists()) return null;

    return {
      id: categoryDoc.id,
      ...categoryDoc.data(),
      createdAt: categoryDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: categoryDoc.data().updatedAt?.toDate() || new Date(),
    } as Category;
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    throw error;
  }
};

// Listar categorias com paginação
export const getCategories = async (
  params: PaginationParams & {
    type?: string;
    status?: string;
    search?: string;
    parentId?: string;
  } = { page: 1, limit: 20 }
): Promise<PaginatedResponse<Category>> => {
  try {
    let q = query(collection(db, COLLECTION_NAME));

    // Filtros
    if (params.type) {
      q = query(q, where('type', '==', params.type));
    }

    if (params.status) {
      q = query(q, where('status', '==', params.status));
    }

    if (params.parentId) {
      q = query(q, where('parentId', '==', params.parentId));
    }

    // Ordenação
    const sortField = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    q = query(q, orderBy(sortField, sortOrder));

    // Paginação
    if (params.page > 1) {
      const offset = (params.page - 1) * params.limit;
      q = query(q, limit(params.limit + offset));
    } else {
      q = query(q, limit(params.limit));
    }

    const snapshot = await getDocs(q);
    let categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Category[];

    // Aplicar offset simulado
    if (params.page > 1) {
      const offset = (params.page - 1) * params.limit;
      categories = categories.slice(offset);
    }

    // Filtro de busca no frontend
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      categories = categories.filter(category => 
        category.name.toLowerCase().includes(searchLower) ||
        category.code?.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower)
      );
    }

    const total = snapshot.size;
    const totalPages = Math.ceil(total / params.limit);

    return {
      data: categories,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    throw error;
  }
};

// Criar categoria
export const createCategory = async (categoryData: {
  name: string;
  code?: string;
  description?: string;
  type: string;
  parentId?: string;
  color?: string;
  icon?: string;
  requiresApproval?: boolean;
  approvalLimit?: number;
}): Promise<Category> => {
  try {
    const categoryDoc = {
      name: categoryData.name,
      code: categoryData.code || '',
      description: categoryData.description || '',
      type: categoryData.type,
      parentId: categoryData.parentId || null,
      color: categoryData.color || '#3B82F6',
      icon: categoryData.icon || '📁',
      requiresApproval: categoryData.requiresApproval || false,
      approvalLimit: categoryData.approvalLimit || 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), categoryDoc);

    return {
      id: docRef.id,
      ...categoryDoc
    } as Category;
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    throw error;
  }
};

// Atualizar categoria
export const updateCategory = async (
  id: string, 
  updates: Partial<Omit<Category, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    throw error;
  }
};

// Desativar categoria (soft delete)
export const deactivateCategory = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'inactive',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao desativar categoria:', error);
    throw error;
  }
};

// Reativar categoria
export const reactivateCategory = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'active',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao reativar categoria:', error);
    throw error;
  }
};

// Obter categorias por tipo
export const getCategoriesByType = async (type: string): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('type', '==', type),
      where('status', '==', 'active'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Category[];
  } catch (error) {
    console.error('Erro ao buscar categorias por tipo:', error);
    throw error;
  }
};

// Obter categorias filhas
export const getChildCategories = async (parentId: string): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('parentId', '==', parentId),
      where('status', '==', 'active'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Category[];
  } catch (error) {
    console.error('Erro ao buscar categorias filhas:', error);
    throw error;
  }
};

// Verificar se código já existe
export const checkCodeExists = async (code: string, excludeId?: string): Promise<boolean> => {
  try {
    if (!code) return false;
    
    let q = query(
      collection(db, COLLECTION_NAME),
      where('code', '==', code),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (excludeId) {
      // Se estamos editando, excluir o próprio registro da verificação
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar código:', error);
    throw error;
  }
};

// Obter categorias ativas
export const getActiveCategories = async (): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'active'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Category[];
  } catch (error) {
    console.error('Erro ao buscar categorias ativas:', error);
    throw error;
  }
};

// Obter hierarquia de categorias
export const getCategoryHierarchy = async (type?: string): Promise<Category[]> => {
  try {
    let q = query(collection(db, COLLECTION_NAME), where('status', '==', 'active'));
    
    if (type) {
      q = query(q, where('type', '==', type));
    }
    
    q = query(q, orderBy('name'));

    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Category[];

    // Organizar em hierarquia (pais primeiro, depois filhos)
    const parents = categories.filter(cat => !cat.parentId);
    const children = categories.filter(cat => cat.parentId);

    const hierarchy: Category[] = [];
    
    parents.forEach(parent => {
      hierarchy.push(parent);
      const parentChildren = children.filter(child => child.parentId === parent.id);
      hierarchy.push(...parentChildren);
    });

    return hierarchy;
  } catch (error) {
    console.error('Erro ao buscar hierarquia de categorias:', error);
    throw error;
  }
};

// Obter categorias que requerem aprovação
export const getApprovalCategories = async (): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('requiresApproval', '==', true),
      where('status', '==', 'active'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Category[];
  } catch (error) {
    console.error('Erro ao buscar categorias de aprovação:', error);
    throw error;
  }
};

// Tipos de categoria predefinidos
export const CATEGORY_TYPES = {
  EXPENSE: 'expense',
  REVENUE: 'revenue',
  ASSET: 'asset',
  LIABILITY: 'liability',
  PAYMENT: 'payment',
  DOCUMENT: 'document',
} as const;

// Ícones predefinidos para categorias
export const CATEGORY_ICONS = [
  '📁', '💼', '🏢', '🛒', '🔧', '💡', '📊', '🎯',
  '🚀', '⚡', '🔥', '💎', '🌟', '🎨', '📈', '💰',
  '🏆', '🎪', '🎭', '🎨', '🎵', '🎮', '📱', '💻',
  '🖥️', '⌚', '📷', '🎥', '📺', '📻', '☎️', '📞',
] as const;

// Cores predefinidas para categorias
export const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F43F5E', // Rose
] as const;

