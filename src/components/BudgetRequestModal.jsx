import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { useBudgetRequests } from '@/stores/budget-requests';

const BudgetRequestModal = ({ open, onClose }) => {
  const addRequest = useBudgetRequests((s) => s.addRequest);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [explanation, setExplanation] = useState('');
  const [inBudget, setInBudget] = useState(false);
  const [budgetLine, setBudgetLine] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [supplierSuggestions, setSupplierSuggestions] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setExplanation('');
    setInBudget(false);
    setBudgetLine('');
    setAttachments([]);
    setSupplierSuggestions('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addRequest({
      title,
      description,
      explanation: inBudget ? '' : explanation,
      inBudget,
      budgetLine: inBudget ? budgetLine : '',
      attachments,
      supplierSuggestions,
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar Orçamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Descrição</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={inBudget} onCheckedChange={(v) => setInBudget(!!v)} id="inBudget" />
            <label htmlFor="inBudget" className="text-sm">Está em orçamento?</label>
          </div>
          {inBudget ? (
            <div>
              <label className="block text-sm font-medium">Linha de orçamento</label>
              <Input value={budgetLine} onChange={(e) => setBudgetLine(e.target.value)} />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium">Explicação</label>
              <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">Anexos</label>
            <Input type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files || []))} />
          </div>
          <div>
            <label className="block text-sm font-medium">Sugestão de fornecedores</label>
            <Textarea value={supplierSuggestions} onChange={(e) => setSupplierSuggestions(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Enviar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetRequestModal;

