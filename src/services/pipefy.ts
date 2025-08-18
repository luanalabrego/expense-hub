export interface PreOrderCardInput {
  requestId: string;
  title: string;
  vendorName: string;
}

const API_URL = import.meta.env.VITE_PIPEFY_API_URL || 'https://api.pipefy.com';
const API_TOKEN = import.meta.env.VITE_PIPEFY_API_TOKEN || '';

export const createPreOrderCard = async (
  input: PreOrderCardInput,
): Promise<string> => {
  try {
    const resp = await fetch(`${API_URL}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(input),
    });

    if (!resp.ok) {
      throw new Error('Falha ao criar card no Pipefy');
    }

    const data = await resp.json();
    return data.id || data.data?.id || '';
  } catch (error) {
    console.error('Erro ao integrar com Pipefy:', error);
    throw error;
  }
};

export default { createPreOrderCard };
