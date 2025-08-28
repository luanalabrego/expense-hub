// Serviço para integração com módulo bancário
export interface BankPaymentParams {
  requestId: string;
  amount: number;
  vendorId: string;
}

export interface BankPaymentResponse {
  protocol: string;
  receiptUrl: string;
}

// Efetiva o pagamento no banco e retorna protocolo e comprovante
export const processBankPayment = async (
  params: BankPaymentParams
): Promise<BankPaymentResponse> => {
  // Chamada real à API do banco ocorreria aqui
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    protocol: `PROTO-${Date.now()}`,
    // O domínio original era fictício e causava erro de resolução
    // Retornamos um placeholder acessível para simular o comprovante bancário
    receiptUrl: `https://placehold.co/600x400?text=Comprovante+${params.requestId}`,
  };
};
