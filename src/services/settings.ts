import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Documento único para armazenar parâmetros gerais
const COLLECTION = 'settings';
const DOC_ID = 'general';

export interface Settings {
  limits: Record<string, number>;
  params: Record<string, string>;
}

// Busca os parâmetros salvos
export const getSettings = async (): Promise<Settings> => {
  const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
  if (!snap.exists()) {
    return { limits: {}, params: {} };
  }
  const data = snap.data() as Partial<Settings>;
  return {
    limits: data.limits || {},
    params: data.params || {},
  };
};

// Atualiza os parâmetros
export const updateSettings = async (settings: Settings): Promise<void> => {
  const ref = doc(db, COLLECTION, DOC_ID);
  await setDoc(ref, { ...settings, updatedAt: new Date() }, { merge: true });
};
