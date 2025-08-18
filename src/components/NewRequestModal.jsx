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
import { useUploadDocument } from '@/hooks/useDocuments';
import * as requestsService from '@/services/requests';
import * as quotationsService from '@/services/quotations';

export const NewRequestModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const { data: vendors = [] } = useActiveVendors();
  const { data: costCenters = [] } = useActiveCostCenters();
  const createRequest = useCreateRequest();

  const [expenseName, setExpenseName] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [costType, setCostType] = useState('OPEX');
  const [purchaseType, setPurchaseType] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [scope, setScope] = useState('');
  const [justification, setJustification] = useState('');
  const [inBudget, setInBudget] = useState(false);
  const [costCenterId, setCostCenterId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [competenceDate, setCompetenceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isExtraordinary, setIsExtraordinary] = useState(false);
  const [reason, setReason] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [boletoFile, setBoletoFile] = useState(null);
  const [nfFile, setNfFile] = useState(null);
  const [quotationFiles, setQuotationFiles] = useState([]);
  const [isRecurring, setIsRecurring] = useState(false);

  const resetForm = () => {
    setExpenseName('');
    setVendorId('');
    setVendorName('');
    setCostType('OPEX');
    setPurchaseType('');
    setServiceType('');
    setScope('');
    setJustification('');
    setInBudget(false);
    setCostCenterId('');
    setInvoiceDate('');
    setCompetenceDate('');
    setDueDate('');
    setIsExtraordinary(false);
    setReason('');
    setInvoiceNumber('');
    setAmount('');
    setBoletoFile(null);
    setNfFile(null);
    setQuotationFiles([]);
    setIsRecurring(false);
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

  useEffect(() => {
    if (!isExtraordinary && selectedVendor) {
      setServiceType(selectedVendor.serviceType || '');
      setScope(selectedVendor.scope || '');
    } else if (isExtraordinary) {
      setServiceType('');
      setScope('');
    }
  }, [selectedVendor, isExtraordinary]);

  const uploadDocument = useUploadDocument();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const requiredQuotations = (!isRecurring && (parseFloat(amount) || 0) > 10000) ? 3 : 1;
      if (quotationFiles.length < requiredQuotations) {
        alert(`É necessário anexar pelo menos ${requiredQuotations} orçamento(s).`);
        return;
      }
      const newRequest = await createRequest.mutateAsync({
        description: expenseName,
        amount: parseFloat(amount) || 0,
        invoiceNumber,
        vendorId: isExtraordinary ? '' : vendorId,
        vendorName: isExtraordinary ? vendorName : selectedVendor?.name || '',
        costCenterId,
        categoryId: costType,
        costType,
        purchaseType,
        serviceType,
        scope,
        justification,
        inBudget,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
        competenceDate: competenceDate ? new Date(`${competenceDate}-01`) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: isExtraordinary ? reason : '',
        isExtraordinary,
        isRecurring,
        extraordinaryReason: isExtraordinary ? reason : '',
        requesterId: user.id,
        requesterName: user.name,
        priority: 'low',
        paymentMethod: 'transfer',
      });

      const attachments = [];
      if (boletoFile) {
        const doc = await uploadDocument.mutateAsync({
          file: boletoFile,
          category: 'boleto',
          relatedEntityType: 'request',
          relatedEntityId: newRequest.id,
          userId: user.id,
        });
        attachments.push(doc.id);
      }
      if (nfFile) {
        const doc = await uploadDocument.mutateAsync({
          file: nfFile,
          category: 'nf',
          relatedEntityType: 'request',
          relatedEntityId: newRequest.id,
          userId: user.id,
        });
        attachments.push(doc.id);
      }
      for (const file of quotationFiles) {
        const doc = await uploadDocument.mutateAsync({
          file,
          category: 'quotation',
          relatedEntityType: 'request',
          relatedEntityId: newRequest.id,
          userId: user.id,
        });
        await quotationsService.createQuotation({
          requestId: newRequest.id,
          documentId: doc.id,
          createdBy: user.id,
        });
      }
      if (attachments.length > 0) {
        await requestsService.updateRequest(newRequest.id, {
          attachments,
        });
      }

      resetForm();
      onClose();
    } catch (err) {
      console.error('Erro ao criar solicitação:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Solicitação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Nome da despesa</label>
            <Input value={expenseName} onChange={(e) => setExpenseName(e.target.value)} required />
          </div>
          <div className="flex items-center space-x-2 sm:col-span-2">
            <Checkbox id="extra" checked={isExtraordinary} onCheckedChange={(v) => setIsExtraordinary(!!v)} />
            <label htmlFor="extra" className="text-sm">Solicitação extraordinária</label>
          </div>
          {isExtraordinary ? (
            <>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Fornecedor</label>
                <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Motivo da solicitação</label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
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
          {!isExtraordinary && selectedVendor && (
            <div className="sm:col-span-2 text-sm">
              Contrato: {selectedVendor.hasContract ? 'Sim' : 'Não'}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Número da NF</label>
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor bruto</label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
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
            <label className="block text-sm font-medium mb-1">Tipo de compra</label>
            <Select value={purchaseType} onValueChange={setPurchaseType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uso">Uso</SelectItem>
                <SelectItem value="consumo">Consumo</SelectItem>
                <SelectItem value="insumos">Insumos</SelectItem>
                <SelectItem value="imobilizado">Imobilizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de serviço</label>
            <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} readOnly={!isExtraordinary} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Escopo</label>
            <Textarea value={scope} onChange={(e) => setScope(e.target.value)} readOnly={!isExtraordinary} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Justificativa</label>
            <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} />
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
          <div className="flex items-center space-x-2 sm:col-span-2">
            <Checkbox id="inBudget" checked={inBudget} onCheckedChange={(v) => setInBudget(!!v)} />
            <label htmlFor="inBudget" className="text-sm">Dentro do orçamento</label>
          </div>
          <div className="flex items-center space-x-2 sm:col-span-2">
            <Checkbox id="recurring" checked={isRecurring} onCheckedChange={(v) => setIsRecurring(!!v)} />
            <label htmlFor="recurring" className="text-sm">Lançamento recorrente</label>
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
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Boleto</label>
            <Input type="file" onChange={(e) => setBoletoFile(e.target.files?.[0] || null)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">NF</label>
            <Input type="file" onChange={(e) => setNfFile(e.target.files?.[0] || null)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Orçamentos</label>
            <Input type="file" multiple onChange={(e) => setQuotationFiles(Array.from(e.target.files || []))} />
          </div>
          <DialogFooter className="sm:col-span-2">
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
