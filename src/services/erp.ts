// Serviço para integração com ERP
export interface MiroDocument {
  documentNumber: string;
  status: string;
}

// Gera um documento MIRO no ERP para a solicitação informada
export const generateMiroDocument = async (requestId: string): Promise<MiroDocument> => {
  // Aqui ocorreria a chamada real ao ERP
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    documentNumber: `MIRO-${Date.now()}`,
    status: 'generated',
  };
};

// Atualiza o status da solicitação no ERP
export const updateERPStatus = async (requestId: string, status: string): Promise<void> => {
  // Chamada ao ERP para atualizar o status
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log(`ERP atualizado para ${requestId} com status ${status}`);
};
