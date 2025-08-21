import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useBudgetRequests } from '@/stores/budget-requests';

const BudgetRequestDetailsModal = ({ request, open, onClose }) => {
  const updateStatus = useBudgetRequests((s) => s.updateStatus);
  const addComment = useBudgetRequests((s) => s.addComment);
  const addBudget = useBudgetRequests((s) => s.addBudget);
  const selectBudget = useBudgetRequests((s) => s.selectBudget);

  const [comment, setComment] = useState('');
  const [budgetForm, setBudgetForm] = useState({
    supplierName: '',
    cnpj: '',
    value: '',
    paymentMethod: '',
    paymentTerms: '',
    attachment: null,
  });
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');

  if (!request) return null;

  const handleAddComment = () => {
    if (comment.trim()) {
      addComment(request.id, comment.trim());
      setComment('');
    }
  };

  const handleAddBudget = () => {
    if (request.budgets.length >= 3) return;
    addBudget(request.id, {
      supplierName: budgetForm.supplierName,
      cnpj: budgetForm.cnpj,
      value: parseFloat(budgetForm.value) || 0,
      paymentMethod: budgetForm.paymentMethod,
      paymentTerms: budgetForm.paymentTerms,
      attachment: budgetForm.attachment,
    });
    setBudgetForm({ supplierName: '', cnpj: '', value: '', paymentMethod: '', paymentTerms: '', attachment: null });
  };

  const handleApprove = () => {
    if (selected === null) return;
    selectBudget(request.id, selected, reason);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl space-y-4">
        <DialogHeader>
          <DialogTitle>Detalhes {request.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Comentários</h3>
            <ul className="mb-2 list-disc list-inside">
              {request.comments.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <div className="flex space-x-2">
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Novo comentário" />
              <Button type="button" onClick={handleAddComment}>Adicionar</Button>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Orçamentos</h3>
            {request.budgets.map((b, i) => (
              <div key={i} className="border p-2 rounded mb-2 flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <input type="radio" name="winner" checked={selected === i} onChange={() => setSelected(i)} />
                  <span className="font-medium">{`Orçamento ${i + 1}`}</span>
                </div>
                <span>Fornecedor: {b.supplierName}</span>
                <span>CNPJ: {b.cnpj}</span>
                <span>Valor: {b.value}</span>
                <span>Forma de pagamento: {b.paymentMethod}</span>
                <span>Prazo de pagamento: {b.paymentTerms}</span>
              </div>
            ))}
            {request.budgets.length < 3 && (
              <div className="border p-2 rounded space-y-2">
                <Input placeholder="Fornecedor" value={budgetForm.supplierName} onChange={(e) => setBudgetForm({ ...budgetForm, supplierName: e.target.value })} />
                <Input placeholder="CNPJ" value={budgetForm.cnpj} onChange={(e) => setBudgetForm({ ...budgetForm, cnpj: e.target.value })} />
                <Input placeholder="Valor" value={budgetForm.value} onChange={(e) => setBudgetForm({ ...budgetForm, value: e.target.value })} />
                <Input placeholder="Forma de pagamento" value={budgetForm.paymentMethod} onChange={(e) => setBudgetForm({ ...budgetForm, paymentMethod: e.target.value })} />
                <Input placeholder="Prazo de pagamento" value={budgetForm.paymentTerms} onChange={(e) => setBudgetForm({ ...budgetForm, paymentTerms: e.target.value })} />
                <Input type="file" onChange={(e) => setBudgetForm({ ...budgetForm, attachment: e.target.files?.[0] || null })} />
                <Button type="button" onClick={handleAddBudget}>Adicionar Orçamento</Button>
              </div>
            )}
          </div>
          {request.status !== 'Aprovado' && (
            <div className="space-y-2">
              <h3 className="font-medium">Seleção do vencedor</h3>
              <Textarea placeholder="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button type="button" onClick={handleApprove} disabled={selected === null}>
                Aprovar
              </Button>
            </div>
          )}
          {request.status === 'Pendente' && (
            <Button type="button" onClick={() => updateStatus(request.id, 'Em Andamento')}>Marcar como Em Andamento</Button>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetRequestDetailsModal;

