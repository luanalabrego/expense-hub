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
    receiptUrl: `https://bank.example.com/receipts/${params.requestId}`,
  };
};
