export interface ComplianceResult {
  sefazActive: boolean;
  serasaScore: number;
  serasaBlocked: boolean;
}

export const checkVendorCompliance = async (taxId: string): Promise<ComplianceResult> => {
  // Validações de SEFAZ e SERASA desativadas temporariamente
  return {
    sefazActive: true,
    serasaScore: 0,
    serasaBlocked: false,
  };
};
