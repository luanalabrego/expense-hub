// Serviços para gestão de fornecedores
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
import type { Vendor, PaginationParams, PaginatedResponse } from '../types';
import * as notificationsService from './notifications';

const COLLECTION_NAME = 'vendors';

// Obter fornecedor por ID
export const getVendorById = async (id: string): Promise<Vendor | null> => {
  try {
    const vendorDoc = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!vendorDoc.exists()) return null;

    return {
      id: vendorDoc.id,
      ...vendorDoc.data(),
      createdAt: vendorDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: vendorDoc.data().updatedAt?.toDate() || new Date(),
    } as Vendor;
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    throw error;
  }
};

// Listar fornecedores com paginação
export const getVendors = async (
  params: PaginationParams & {
    status?: string;
    search?: string;
    tags?: string[];
  } = { page: 1, limit: 20 }
): Promise<PaginatedResponse<Vendor>> => {
  try {
    let q = query(collection(db, COLLECTION_NAME));

    // Filtros
    if (params.status) {
      q = query(q, where('status', '==', params.status));
    }

    if (params.tags && params.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', params.tags));
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
    let vendors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Vendor[];

    // Aplicar offset simulado
    if (params.page > 1) {
      const offset = (params.page - 1) * params.limit;
      vendors = vendors.slice(offset);
    }

    // Filtro de busca no frontend
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      vendors = vendors.filter(vendor => 
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.taxId.includes(params.search!) ||
        vendor.email?.toLowerCase().includes(searchLower)
      );
    }

    const total = snapshot.size;
    const totalPages = Math.ceil(total / params.limit);

    return {
      data: vendors,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    throw error;
  }
};

// Criar fornecedor
export const createVendor = async (vendorData: {
  name: string;
  taxId: string;
  email?: string;
  phone?: string;
  rating?: number;
  tags?: string[];
  paymentTerms?: string;
  hasContract?: boolean;
  contractUrl?: string;
  observations?: string;
  approvalNotes?: string;
  legalNotes?: string;
  status?: 'pending' | 'needsInfo' | 'rejected' | 'contract_review' | 'active' | 'inactive';
  contractRequesterId?: string;
  blocked?: boolean;
  contacts?: Array<{
    name: string;
    email: string;
    phone?: string;
    role?: string;
  }>;
  categories?: string[];
}): Promise<Vendor> => {
  try {
    const vendorDoc = {
      name: vendorData.name,
      taxId: vendorData.taxId,
      email: vendorData.email || '',
      phone: vendorData.phone || '',
      tags: vendorData.tags || [],
      contacts: vendorData.contacts || [],
      categories: vendorData.categories || [],
      rating: vendorData.rating ?? 0,
      blocked: vendorData.blocked ?? false,
      paymentTerms: vendorData.paymentTerms || '',
      hasContract: vendorData.hasContract ?? false,
      contractUrl: vendorData.contractUrl || '',
      observations: vendorData.observations || '',
      approvalNotes: vendorData.approvalNotes || '',
      legalNotes: vendorData.legalNotes || '',
      contractRequesterId: vendorData.contractRequesterId || '',
      status: vendorData.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), vendorDoc);

    return {
      id: docRef.id,
      ...vendorDoc
    } as Vendor;
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    throw error;
  }
};

// Atualizar fornecedor
export const updateVendor = async (
  id: string, 
  updates: Partial<Omit<Vendor, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(doc(db, COLLECTION_NAME, id), updateData);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    throw error;
  }
};

// Desativar fornecedor (soft delete)
export const deactivateVendor = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'inactive',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao desativar fornecedor:', error);
    throw error;
  }
};

// Reativar fornecedor
export const reactivateVendor = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'active',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao reativar fornecedor:', error);
    throw error;
  }
};

// Bloquear fornecedor
export const blockVendor = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      blocked: true,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao bloquear fornecedor:', error);
    throw error;
  }
};

// Desbloquear fornecedor
export const unblockVendor = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      blocked: false,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao desbloquear fornecedor:', error);
    throw error;
  }
};

// Obter fornecedores por tag
export const getVendorsByTag = async (tag: string): Promise<Vendor[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('tags', 'array-contains', tag),
      where('status', '==', 'active'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Vendor[];
  } catch (error) {
    console.error('Erro ao buscar fornecedores por tag:', error);
    throw error;
  }
};

// Verificar se CNPJ já existe
export const checkTaxIdExists = async (taxId: string, excludeId?: string): Promise<boolean> => {
  try {
    let q = query(
      collection(db, COLLECTION_NAME),
      where('taxId', '==', taxId),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (excludeId) {
      // Se estamos editando, excluir o próprio registro da verificação
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar CNPJ:', error);
    throw error;
  }
};

// Obter fornecedores ativos
export const getActiveVendors = async (): Promise<Vendor[]> => {
  try {
    // Buscar fornecedores ativos do Firestore. O filtro "blocked" foi
    // removido da query para evitar problemas quando o campo não está
    // definido em alguns documentos. A ordenação é feita em memória para
    // não exigir índices compostos no Firebase.
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }))
      // Excluir fornecedores bloqueados ou sem informação do campo
      // "blocked" e ordenar pelo nome.
      .filter(vendor => vendor.blocked !== true)
      .sort((a, b) => a.name.localeCompare(b.name)) as Vendor[];
  } catch (error) {
    console.error('Erro ao buscar fornecedores ativos:', error);
    throw error;
  }
};

// Atualizar rating do fornecedor
export const updateVendorRating = async (id: string, rating: number): Promise<void> => {
  try {
    if (rating < 0 || rating > 5) {
      throw new Error('Rating deve estar entre 0 e 5');
    }

    await updateDoc(doc(db, COLLECTION_NAME, id), {
      rating,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao atualizar rating do fornecedor:', error);
    throw error;
  }
};

// Aprovar fornecedor
export const approveVendor = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'active',
      approvalNotes: '',
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao aprovar fornecedor:', error);
    throw error;
  }
};

// Reprovar fornecedor
export const rejectVendor = async (id: string, reason: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'rejected',
      approvalNotes: reason,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao reprovar fornecedor:', error);
    throw error;
  }
};

// Solicitar mais informações do fornecedor
export const requestMoreInfoVendor = async (
  id: string,
  info: string,
): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'needsInfo',
      approvalNotes: info,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao solicitar mais informações do fornecedor:', error);
    throw error;
  }
};

// Enviar contrato para revisão jurídica
export const sendVendorToContractReview = async (
  id: string,
  requesterId: string,
): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      status: 'contract_review',
      contractRequesterId: requesterId,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao enviar contrato para revisão:', error);
    throw error;
  }
};

// Aprovar contrato do fornecedor
export const approveVendorContract = async (id: string): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(ref);
    await updateDoc(ref, {
      status: 'active',
      legalNotes: '',
      updatedAt: new Date(),
    });

    const requesterId = snap.data()?.contractRequesterId;
    if (requesterId) {
      await notificationsService.createNotification({
        type: 'success',
        title: 'Contrato aprovado',
        message: `O contrato do fornecedor ${snap.data()?.name || ''} foi aprovado.`,
        recipientId: requesterId,
        relatedEntityType: 'vendor',
        relatedEntityId: id,
        priority: 'medium',
      });
    }
  } catch (error) {
    console.error('Erro ao aprovar contrato do fornecedor:', error);
    throw error;
  }
};

// Solicitar ajustes no contrato do fornecedor
export const requestVendorContractAdjustments = async (
  id: string,
  notes: string,
): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(ref);
    await updateDoc(ref, {
      status: 'pending',
      legalNotes: notes,
      updatedAt: new Date(),
    });

    const requesterId = snap.data()?.contractRequesterId;
    if (requesterId) {
      await notificationsService.createNotification({
        type: 'warning',
        title: 'Contrato reprovado',
        message: notes || 'O contrato do fornecedor necessita ajustes.',
        recipientId: requesterId,
        relatedEntityType: 'vendor',
        relatedEntityId: id,
        priority: 'medium',
      });
    }
  } catch (error) {
    console.error('Erro ao solicitar ajustes do contrato:', error);
    throw error;
  }
};

