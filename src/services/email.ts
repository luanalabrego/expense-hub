// Serviço simples de envio de e-mails
export const sendPaymentReceiptEmail = async (
  to: string,
  subject: string,
  body: string,
  attachmentUrl?: string
): Promise<void> => {
  // Integração real com serviço de e-mail ocorreria aqui
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log(`E-mail enviado para ${to} com comprovante ${attachmentUrl}`);
};
