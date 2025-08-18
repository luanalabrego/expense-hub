// Integração com API da Arquivei para consulta de NFs
import { XMLParser } from 'fast-xml-parser';
import type { Invoice, InvoiceItem } from '../types';

const BASE_URL = 'https://sandbox-api.arquivei.com.br/v1';
const parser = new XMLParser({ ignoreAttributes: false });

const getHeaders = () => {
  const apiId = process.env.ARQUIVEI_API_ID;
  const apiKey = process.env.ARQUIVEI_API_KEY;
  if (!apiId || !apiKey) {
    throw new Error('Credenciais da Arquivei não configuradas');
  }
  return {
    'x-api-id': apiId,
    'x-api-key': apiKey,
    accept: 'application/json'
  } as Record<string, string>;
};

// Buscar NFs recebidas pelo fornecedor
export const fetchReceivedInvoices = async (vendorTaxId: string): Promise<Invoice[]> => {
  const url = `${BASE_URL}/nfe/received?sender_tax_id=${vendorTaxId}`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error(`Erro ao buscar NFs: ${response.statusText}`);
  }
  const json = await response.json();
  const xmlList: string[] = (json.data || []).map((item: any) =>
    Buffer.from(item.xml, 'base64').toString('utf8')
  );
  return xmlList.map(parseInvoiceXml);
};

// Converter XML da NF em objeto para conciliação
export const parseInvoiceXml = (xml: string): Invoice => {
  const parsed = parser.parse(xml);
  const det = parsed?.nfeProc?.NFe?.infNFe?.det;
  const items = Array.isArray(det) ? det : [det].filter(Boolean);
  const invoiceItems: InvoiceItem[] = items.map((it: any) => ({
    description: it.prod.xProd,
    quantity: Number(it.prod.qCom),
    unitPrice: Number(it.prod.vUnCom),
    total: Number(it.prod.vProd)
  }));
  const total = Number(parsed?.nfeProc?.NFe?.infNFe?.total?.ICMSTot?.vNF || 0);
  const key = parsed?.nfeProc?.protNFe?.infProt?.chNFe || '';
  return { key, items: invoiceItems, total };
};
