import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'budget-lines';

export interface BudgetLine {
  id?: string;
  vendorId: string;
  costCenterId: string;
  description: string;
  nature: string;
  costType: string;
  year: number;
  months: Record<string, number>;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const getBudgetLines = async (): Promise<BudgetLine[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : undefined,
    updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate() : undefined,
  })) as BudgetLine[];
};

export const findBudgetLine = async (
  vendorId: string,
  year: number
): Promise<BudgetLine | null> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('vendorId', '==', vendorId),
    where('year', '==', year)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return {
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : undefined,
    updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate() : undefined,
  } as BudgetLine;
};

export const createBudgetLine = async (
  data: Omit<BudgetLine, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BudgetLine> => {
  const now = new Date();
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
};

export const updateBudgetLine = async (
  id: string,
  data: Partial<Omit<BudgetLine, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  await updateDoc(doc(db, COLLECTION_NAME, id), {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteBudgetLine = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

