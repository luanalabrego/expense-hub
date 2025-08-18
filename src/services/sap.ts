import type { Vendor } from '../types';

const API_URL = import.meta.env.VITE_SAP_API_URL || 'https://sap.example.com/api';
const API_TOKEN = import.meta.env.VITE_SAP_API_TOKEN || '';

export const createOrUpdateVendor = async (
  vendor: Pick<Vendor, 'id' | 'name' | 'taxId' | 'email' | 'phone'>,
): Promise<string> => {
  try {
    const resp = await fetch(`${API_URL}/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(vendor),
    });

    if (!resp.ok) {
      throw new Error('Falha ao sincronizar fornecedor no SAP');
    }

    const data = await resp.json();
    return data.id || data.vendorId || '';
  } catch (error) {
    console.error('Erro ao integrar com SAP:', error);
    throw error;
  }
};

export default { createOrUpdateVendor };
