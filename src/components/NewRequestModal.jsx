import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { useActiveVendors } from '@/hooks/useVendors';
import { useActiveCostCenters } from '@/hooks/useCostCenters';
import { useCreateRequest } from '@/hooks/useRequests';
import { useAuth } from '@/contexts/AuthContext';

export const NewRequestModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const { data: vendorsData } = useActiveVendors();
  const { data: costCentersData } = useActiveCostCenters();
  const createRequest = useCreateRequest();

  const vendors = vendorsData?.data || vendorsData || [];
  const costCenters = costCentersData?.data || costCentersData || [];

  const [expenseName, setExpenseName] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [costType, setCostType] = useState('OPEX');
  const [costCenterId, setCostCenterId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [competenceDate, setCompetenceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isExtraordinary, setIsExtraordinary] = useState(false);
  const [reason, setReason] = useState('');

  const resetForm = () => {
    setExpenseName('');
    setVendorId('');
    setVendorName('');
    setCostType('OPEX');
    setCostCenterId('');
    setInvoiceDate('');
    setCompetenceDate('');
    setDueDate('');
    setIsExtraordinary(false);
    setReason('');
  };

  const selectedVendor = vendors.find((v) => v.id === vendorId);

  useEffect(() => {
    if (!isExtraordinary && selectedVendor && invoiceDate) {
      const days = parseInt(selectedVendor.paymentTerms || '0', 10) || 0;
      const date = new Date(invoiceDate);
      date.setDate(date.getDate() + days);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [selectedVendor, invoiceDate, isExtraordinary]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createRequest.mutate({
      description: expenseName,
      amount: 0,
      vendorId: isExtraordinary ? '' : vendorId,
      vendorName: isExtraordinary ? vendorName : selectedVendor?.name || '',
      costCenterId,
      categoryId: costType,
      costType,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
      competenceDate: competenceDate ? new Date(`${competenceDate}-01`) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes: isExtraordinary ? reason : '',
      isExtraordinary,
      extraordinaryReason: isExtraordinary ? reason : '',
      requesterId: user.id,
      requesterName: user.name,
      priority: 'low',
      paymentMethod: 'transfer',
    }, {
      onSuccess: () => {
        resetForm();
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Solicitação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da despesa</label>
            <Input value={expenseName} onChange={(e) => setExpenseName(e.target.value)} required />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="extra" checked={isExtraordinary} onCheckedChange={(v) => setIsExtraordinary(!!v)} />
            <label htmlFor="extra" className="text-sm">Solicitação extraordinária</label>
          </div>
          {isExtraordinary ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Fornecedor</label>
                <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Motivo da solicitação</label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Fornecedor</label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de custo</label>
            <Select value={costType} onValueChange={setCostType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAPEX">CAPEX</SelectItem>
                <SelectItem value="OPEX">OPEX</SelectItem>
                <SelectItem value="CPO">CPO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Centro de custo</label>
            <Select value={costCenterId} onValueChange={setCostCenterId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {costCenters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data de emissão</label>
            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Competência</label>
            <Input type="month" value={competenceDate} onChange={(e) => setCompetenceDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data de vencimento</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} readOnly={!isExtraordinary} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewRequestModal;
