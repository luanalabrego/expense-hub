export interface NFData {
  amount: number;
  /**
   * Valor de impostos informado na NF. Se não fornecido,
   * assume-se o valor esperado e a validação sempre será aprovada.
   */
  reportedTax?: number;
  /**
   * Alíquota esperada. Padrão de 10%.
   */
  taxRate?: number;
}

export interface TaxValidationResult {
  status: 'approved' | 'pending_adjustment';
  taxes: {
    expected: number;
    calculated: number;
    difference: number;
  };
}

/**
 * Calcula e valida os impostos de uma NF.
 * Retorna o valor esperado, o informado e a diferença.
 * Caso a divergência seja superior a R$1, marca como pendente de ajuste.
 */
export const validateNF = async (nf: NFData): Promise<TaxValidationResult> => {
  const rate = nf.taxRate ?? 0.1;
  const expected = nf.amount * rate;
  const calculated = nf.reportedTax ?? expected;
  const difference = calculated - expected;
  const status = Math.abs(difference) > 1 ? 'pending_adjustment' : 'approved';
  return {
    status,
    taxes: {
      expected,
      calculated,
      difference,
    },
  };
};

