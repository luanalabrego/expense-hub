import { create } from 'zustand';

export interface BudgetLineSelection {
  title: string;
  description: string;
  explanation: string;
  inBudget: boolean;
  budgetLine: string;
  attachments: File[];
  supplierSuggestions: string;
}

export interface BudgetItem {
  supplierName: string;
  cnpj: string;
  attachment?: File | null;
  value: number;
  paymentMethod: string;
  paymentTerms: string;
}

export interface BudgetRequest extends BudgetLineSelection {
  id: string;
  status: 'Pendente' | 'Em Andamento' | 'Aprovado';
  comments: string[];
  budgets: BudgetItem[];
  selectedBudget?: number;
  selectionReason?: string;
}

interface BudgetRequestState {
  requests: BudgetRequest[];
  counter: number;
  addRequest: (data: BudgetLineSelection) => void;
  updateStatus: (id: string, status: BudgetRequest['status']) => void;
  addComment: (id: string, comment: string) => void;
  addBudget: (id: string, budget: BudgetItem) => void;
  selectBudget: (id: string, index: number, reason: string) => void;
}

export const useBudgetRequests = create<BudgetRequestState>((set) => ({
  requests: [],
  counter: 1,
  addRequest: (data) =>
    set((state) => ({
      requests: [
        ...state.requests,
        {
          id: `BID-${String(state.counter).padStart(4, '0')}`,
          status: 'Pendente',
          comments: [],
          budgets: [],
          ...data,
        },
      ],
      counter: state.counter + 1,
    })),
  updateStatus: (id, status) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    })),
  addComment: (id, comment) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, comments: [...r.comments, comment] } : r
      ),
    })),
  addBudget: (id, budget) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, budgets: [...r.budgets, budget] } : r
      ),
    })),
  selectBudget: (id, index, reason) =>
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id
          ? { ...r, selectedBudget: index, selectionReason: reason, status: 'Aprovado' }
          : r
      ),
    })),
}));

