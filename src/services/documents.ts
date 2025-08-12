// Serviços para gestão de documentos
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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
  listAll
} from 'firebase/storage';
import { db, storage } from './firebase';
import type { Document, DocumentVersion, DocumentCategory } from '../types';

// Tipos para upload e gestão de documentos
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface DocumentUploadOptions {
  file: File;
  category?: string;
  description?: string;
  tags?: string[];
  relatedEntityType?: 'request' | 'vendor' | 'cost-center' | 'budget';
  relatedEntityId?: string;
  isPublic?: boolean;
  expiresAt?: Date;
  onProgress?: (progress: UploadProgress) => void;
}

export interface DocumentSearchFilters {
  category?: string;
  tags?: string[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  uploadedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  fileType?: string;
  isPublic?: boolean;
  search?: string;
}

export interface DocumentListOptions extends DocumentSearchFilters {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'uploadedAt' | 'size' | 'category';
  sortOrder?: 'asc' | 'desc';
}

// Obter lista de documentos com filtros
export const getDocuments = async (options: DocumentListOptions = {}) => {
  try {
    const {
      page = 1,
      limit: pageLimit = 20,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
      category,
      tags,
      relatedEntityType,
      relatedEntityId,
      uploadedBy,
      dateFrom,
      dateTo,
      fileType,
      isPublic,
      search
    } = options;

    let documentsQuery = query(collection(db, 'documents'));

    // Aplicar filtros
    if (category) {
      documentsQuery = query(documentsQuery, where('category', '==', category));
    }

    if (tags && tags.length > 0) {
      documentsQuery = query(documentsQuery, where('tags', 'array-contains-any', tags));
    }

    if (relatedEntityType) {
      documentsQuery = query(documentsQuery, where('relatedEntityType', '==', relatedEntityType));
    }

    if (relatedEntityId) {
      documentsQuery = query(documentsQuery, where('relatedEntityId', '==', relatedEntityId));
    }

    if (uploadedBy) {
      documentsQuery = query(documentsQuery, where('uploadedBy', '==', uploadedBy));
    }

    if (dateFrom) {
      documentsQuery = query(documentsQuery, where('uploadedAt', '>=', Timestamp.fromDate(dateFrom)));
    }

    if (dateTo) {
      documentsQuery = query(documentsQuery, where('uploadedAt', '<=', Timestamp.fromDate(dateTo)));
    }

    if (fileType) {
      documentsQuery = query(documentsQuery, where('fileType', '==', fileType));
    }

    if (typeof isPublic === 'boolean') {
      documentsQuery = query(documentsQuery, where('isPublic', '==', isPublic));
    }

    // Ordenação
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    documentsQuery = query(documentsQuery, orderBy(sortBy, orderDirection));

    // Paginação
    if (page > 1) {
      const offset = (page - 1) * pageLimit;
      const offsetQuery = query(documentsQuery, limit(offset));
      const offsetSnapshot = await getDocs(offsetQuery);
      const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      if (lastDoc) {
        documentsQuery = query(documentsQuery, startAfter(lastDoc));
      }
    }

    documentsQuery = query(documentsQuery, limit(pageLimit));

    const snapshot = await getDocs(documentsQuery);
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate() || null,
    })) as Document[];

    // Filtro de busca textual (feito no cliente para simplicidade)
    let filteredDocuments = documents;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocuments = documents.filter(doc => 
        doc.name.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Contar total (aproximado)
    const totalQuery = query(collection(db, 'documents'));
    const totalSnapshot = await getDocs(totalQuery);
    const total = totalSnapshot.size;

    return {
      data: filteredDocuments,
      total,
      page,
      limit: pageLimit,
      totalPages: Math.ceil(total / pageLimit),
    };
  } catch (error) {
    console.error('Erro ao obter documentos:', error);
    throw error;
  }
};

// Obter documento por ID
export const getDocument = async (id: string): Promise<Document> => {
  try {
    const docRef = doc(db, 'documents', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Documento não encontrado');
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      uploadedAt: data.uploadedAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || null,
    } as Document;
  } catch (error) {
    console.error('Erro ao obter documento:', error);
    throw error;
  }
};

// Upload de documento
export const uploadDocument = async (
  options: DocumentUploadOptions,
  userId: string
): Promise<Document> => {
  try {
    const { 
      file, 
      category = 'general', 
      description, 
      tags = [], 
      relatedEntityType,
      relatedEntityId,
      isPublic = false,
      expiresAt,
      onProgress 
    } = options;

    // Validar arquivo
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 50MB');
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomId}.${fileExtension}`;
    
    // Definir caminho no Storage
    const storagePath = `documents/${category}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload do arquivo utilizando SDK do Firebase
    const uploadTask = uploadBytesResumable(storageRef, file);

    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            onProgress({
              loaded: snapshot.bytesTransferred,
              total: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            });
          }
        },
        (error) => reject(error),
        () => resolve()
      );
    });

    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    const metadata = await getMetadata(uploadTask.snapshot.ref);

    // Criar documento no Firestore
    const documentData = {
      name: file.name,
      originalName: file.name,
      fileName,
      storagePath,
      downloadURL,
      fileType: file.type,
      fileSize: file.size,
      category,
      description: description || '',
      tags,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null,
      isPublic,
      uploadedBy: userId,
      uploadedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      downloadCount: 0,
      version: 1,
      isActive: true,
      metadata: {
        contentType: metadata.contentType,
        size: metadata.size,
        timeCreated: metadata.timeCreated,
        updated: metadata.updated,
      },
    };

    const docRef = await addDoc(collection(db, 'documents'), documentData);
    
    return {
      id: docRef.id,
      ...documentData,
      uploadedAt: documentData.uploadedAt.toDate(),
      updatedAt: documentData.updatedAt.toDate(),
      expiresAt: documentData.expiresAt?.toDate() || null,
    } as Document;
  } catch (error) {
    console.error('Erro ao fazer upload do documento:', error);
    throw error;
  }
};

// Atualizar documento
export const updateDocument = async (
  id: string,
  updates: Partial<Document>,
  userId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'documents', id);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    };

    // Remover campos que não devem ser atualizados diretamente
    delete updateData.id;
    delete updateData.uploadedAt;
    delete updateData.uploadedBy;
    delete updateData.downloadURL;
    delete updateData.storagePath;
    delete updateData.fileSize;
    delete updateData.fileType;

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    throw error;
  }
};

// Deletar documento
export const deleteDocument = async (id: string): Promise<void> => {
  try {
    const document = await getDocument(id);
    
    // Deletar arquivo do Storage
    if (document.storagePath) {
      const storageRef = ref(storage, document.storagePath);
      try {
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn('Erro ao deletar arquivo do Storage:', storageError);
        // Continuar mesmo se não conseguir deletar do Storage
      }
    }

    // Deletar documento do Firestore
    const docRef = doc(db, 'documents', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    throw error;
  }
};

// Incrementar contador de download
export const incrementDownloadCount = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'documents', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const currentCount = docSnap.data().downloadCount || 0;
      await updateDoc(docRef, {
        downloadCount: currentCount + 1,
        lastDownloadAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Erro ao incrementar contador de download:', error);
    // Não propagar erro para não afetar o download
  }
};

// Obter documentos por entidade relacionada
export const getDocumentsByEntity = async (
  entityType: string,
  entityId: string
): Promise<Document[]> => {
  try {
    const documentsQuery = query(
      collection(db, 'documents'),
      where('relatedEntityType', '==', entityType),
      where('relatedEntityId', '==', entityId),
      where('isActive', '==', true),
      orderBy('uploadedAt', 'desc')
    );

    const snapshot = await getDocs(documentsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate() || null,
    })) as Document[];
  } catch (error) {
    console.error('Erro ao obter documentos por entidade:', error);
    throw error;
  }
};

// Obter categorias de documentos
export const getDocumentCategories = async (): Promise<DocumentCategory[]> => {
  try {
    const categoriesQuery = query(
      collection(db, 'document-categories'),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(categoriesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as DocumentCategory[];
  } catch (error) {
    console.error('Erro ao obter categorias de documentos:', error);
    throw error;
  }
};

// Criar categoria de documento
export const createDocumentCategory = async (
  categoryData: Omit<DocumentCategory, 'id'>,
  userId: string
): Promise<DocumentCategory> => {
  try {
    const data = {
      ...categoryData,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'document-categories'), data);
    
    return {
      id: docRef.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as DocumentCategory;
  } catch (error) {
    console.error('Erro ao criar categoria de documento:', error);
    throw error;
  }
};

// Obter estatísticas de documentos
export const getDocumentStats = async (filters: DocumentSearchFilters = {}) => {
  try {
    let documentsQuery = query(collection(db, 'documents'));

    // Aplicar filtros básicos
    if (filters.relatedEntityType) {
      documentsQuery = query(documentsQuery, where('relatedEntityType', '==', filters.relatedEntityType));
    }
    if (filters.relatedEntityId) {
      documentsQuery = query(documentsQuery, where('relatedEntityId', '==', filters.relatedEntityId));
    }
    if (filters.uploadedBy) {
      documentsQuery = query(documentsQuery, where('uploadedBy', '==', filters.uploadedBy));
    }

    const snapshot = await getDocs(documentsQuery);
    const documents = snapshot.docs.map(doc => doc.data()) as Document[];

    // Calcular estatísticas
    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    const totalDownloads = documents.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0);

    // Agrupar por categoria
    const byCategory = documents.reduce((acc, doc) => {
      const category = doc.category || 'general';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por tipo de arquivo
    const byFileType = documents.reduce((acc, doc) => {
      const type = doc.fileType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Documentos recentes (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDocuments = documents.filter(doc => 
      doc.uploadedAt && new Date(doc.uploadedAt) > sevenDaysAgo
    ).length;

    return {
      totalDocuments,
      totalSize,
      totalDownloads,
      recentDocuments,
      byCategory,
      byFileType,
      averageSize: totalDocuments > 0 ? totalSize / totalDocuments : 0,
      averageDownloads: totalDocuments > 0 ? totalDownloads / totalDocuments : 0,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de documentos:', error);
    throw error;
  }
};

// Buscar documentos por texto
export const searchDocuments = async (
  searchTerm: string,
  filters: DocumentSearchFilters = {},
  limit: number = 20
): Promise<Document[]> => {
  try {
    // Como o Firestore não suporta busca full-text nativa,
    // vamos buscar todos os documentos e filtrar no cliente
    const documents = await getDocuments({ ...filters, limit: 1000 });
    
    const searchLower = searchTerm.toLowerCase();
    const filteredDocuments = documents.data.filter(doc => 
      doc.name.toLowerCase().includes(searchLower) ||
      doc.description?.toLowerCase().includes(searchLower) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      doc.originalName?.toLowerCase().includes(searchLower)
    );

    return filteredDocuments.slice(0, limit);
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    throw error;
  }
};

// Obter versões de um documento
export const getDocumentVersions = async (documentId: string): Promise<DocumentVersion[]> => {
  try {
    const versionsQuery = query(
      collection(db, 'document-versions'),
      where('documentId', '==', documentId),
      orderBy('version', 'desc')
    );

    const snapshot = await getDocs(versionsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as DocumentVersion[];
  } catch (error) {
    console.error('Erro ao obter versões do documento:', error);
    throw error;
  }
};

// Criar nova versão de documento
export const createDocumentVersion = async (
  documentId: string,
  file: File,
  userId: string,
  comment?: string
): Promise<DocumentVersion> => {
  try {
    const originalDoc = await getDocument(documentId);
    const newVersion = originalDoc.version + 1;

    // Upload da nova versão
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_v${newVersion}_${randomId}.${fileExtension}`;
    
    const storagePath = `documents/${originalDoc.category}/versions/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const uploadResult = await uploadBytesResumable(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // Criar registro da versão
    const versionData = {
      documentId,
      version: newVersion,
      fileName,
      storagePath,
      downloadURL,
      fileSize: file.size,
      fileType: file.type,
      comment: comment || '',
      createdBy: userId,
      createdAt: Timestamp.now(),
    };

    const versionRef = await addDoc(collection(db, 'document-versions'), versionData);

    // Atualizar documento principal
    await updateDoc(doc(db, 'documents', documentId), {
      version: newVersion,
      downloadURL,
      storagePath,
      fileSize: file.size,
      fileType: file.type,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    });

    return {
      id: versionRef.id,
      ...versionData,
      createdAt: versionData.createdAt.toDate(),
    } as DocumentVersion;
  } catch (error) {
    console.error('Erro ao criar versão do documento:', error);
    throw error;
  }
};

