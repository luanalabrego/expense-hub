import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useNotifications } from '@/stores/ui';
import * as XLSX from 'xlsx';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import * as requestsService from '@/services/requests';

const REQUIRED_COLUMNS = [
  'title',
  'description',
  'amount',
  'costCenterCode',
  'category',
  'vendorTaxId',
  'dueDate'
];

export const ImportRequestsModal = ({ open, onClose, userId, userName }) => {
  const [file, setFile] = useState(null);
  const { success, error } = useNotifications();

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      let imported = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const missing = REQUIRED_COLUMNS.filter((col) => !row[col]);
        if (missing.length) {
          console.warn(`Linha ${i + 2} com colunas ausentes: ${missing.join(', ')}`);
          continue;
        }

        const ccSnap = await getDocs(query(collection(db, 'cost-centers'), where('code', '==', row.costCenterCode)));
        if (ccSnap.empty) {
          console.warn(`Centro de custo não encontrado: ${row.costCenterCode}`);
          continue;
        }
        const costCenterId = ccSnap.docs[0].id;

        const catSnap = await getDocs(query(collection(db, 'categories'), where('name', '==', row.category)));
        if (catSnap.empty) {
          console.warn(`Categoria não encontrada: ${row.category}`);
          continue;
        }
        const categoryId = catSnap.docs[0].id;

        const vendorSnap = await getDocs(query(collection(db, 'vendors'), where('taxId', '==', row.vendorTaxId)));
        if (vendorSnap.empty) {
          console.warn(`Fornecedor não encontrado: ${row.vendorTaxId}`);
          continue;
        }
        const vendorDoc = vendorSnap.docs[0];

        await requestsService.createRequest({
          description: row.title || row.description,
          amount: parseFloat(row.amount),
          vendorId: vendorDoc.id,
          vendorName: vendorDoc.data().name,
          costCenterId,
          categoryId,
          dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
          requesterId: userId,
          requesterName: userName,
          priority: 'low',
          paymentMethod: 'transfer'
        });
        imported++;
      }

      success(`${imported} solicitações importadas com sucesso.`);
      onClose();
    } catch (err) {
      console.error('Erro ao importar solicitações:', err);
      error('Erro ao importar solicitações', err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Solicitações (XLSX)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input type="file" accept=".xlsx" onChange={handleFileChange} />
          <p className="text-sm text-gray-600">
            Colunas esperadas: {REQUIRED_COLUMNS.join(', ')}
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleImport} disabled={!file}>Importar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportRequestsModal;
