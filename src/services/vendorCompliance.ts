export interface ComplianceResult {
  sefazActive: boolean;
  serasaScore: number;
  serasaBlocked: boolean;
}

async function checkSefazStatus(cnpj: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!resp.ok) {
      return false;
    }
    const data = await resp.json();
    const situacao = (data.situacao || data.status || '').toString().toUpperCase();
    return situacao === 'ATIVA' || situacao === 'ATIVO';
  } catch (err) {
    console.error('Erro ao consultar SEFAZ:', err);
    return false;
  }
}

async function checkSerasa(cnpj: string): Promise<{ score: number; blocked: boolean }> {
  // Simulação determinística de consulta ao SERASA baseada no CNPJ
  const digits = cnpj.replace(/\D/g, '');
  let sum = 0;
  for (const ch of digits) {
    sum += Number(ch);
  }
  const score = (sum * 37) % 1000; // score entre 0-999
  const blocked = score < 300; // bloqueado se score muito baixo
  return { score, blocked };
}

export const checkVendorCompliance = async (taxId: string): Promise<ComplianceResult> => {
  const cnpj = taxId.replace(/\D/g, '');
  const [sefazActive, serasa] = await Promise.all([
    checkSefazStatus(cnpj),
    checkSerasa(cnpj),
  ]);
  return {
    sefazActive,
    serasaScore: serasa.score,
    serasaBlocked: serasa.blocked,
  };
};
