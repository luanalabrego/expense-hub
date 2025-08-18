import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import type { Quotation } from '../types';

const COLLECTION_NAME = 'quotations';

// Criar nova cotação
export const createQuotation = async (
  data: Omit<Quotation, 'id' | 'createdAt'>
): Promise<Quotation> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: new Date()
  });

  return {
    id: docRef.id,
    ...data,
    createdAt: new Date()
  } as Quotation;
};

// Listar cotações de uma solicitação
export const getQuotationsByRequest = async (
  requestId: string
): Promise<Quotation[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('requestId', '==', requestId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
    } as Quotation;
  });
};

// Remover cotação
export const deleteQuotation = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
