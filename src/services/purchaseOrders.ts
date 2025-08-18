// Serviços para geração, envio e conciliação de pedidos de compra
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  PurchaseOrder,
  Invoice,
  Discrepancy
} from '../types';

const COLLECTION_NAME = 'purchase-orders';

// Criar pedido de compra
export const createPurchaseOrder = async (
  data: Omit<PurchaseOrder, 'id' | 'status' | 'total' | 'createdAt' | 'sentAt' | 'reconciledAt'>
): Promise<PurchaseOrder> => {
  const total = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const order = {
    ...data,
    total,
    status: 'generated' as const,
    createdAt: Timestamp.now()
  };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), order);
  return {
    id: docRef.id,
    ...order,
    createdAt: order.createdAt.toDate()
  } as PurchaseOrder;
};

// Enviar pedido de compra por email ou API externa
export const sendPurchaseOrder = async (
  id: string,
  options: { method: 'email' | 'api'; recipient: string; apiUrl?: string }
): Promise<void> => {
  const order = await getPurchaseOrderById(id);
  if (!order) throw new Error('Pedido não encontrado');

  if (options.method === 'email') {
    await fetch(options.apiUrl || '/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: options.recipient, order })
    });
  } else {
    await fetch(options.apiUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  }

  await updateDoc(doc(db, COLLECTION_NAME, id), {
    status: 'sent',
    sentAt: Timestamp.now()
  });
};

// Obter pedido pelo ID
export const getPurchaseOrderById = async (
  id: string
): Promise<PurchaseOrder | null> => {
  const snap = await getDoc(doc(db, COLLECTION_NAME, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    sentAt: data.sentAt?.toDate() || undefined,
    reconciledAt: data.reconciledAt?.toDate() || undefined
  } as PurchaseOrder;
};

// Confrontar pedido com NF
export const compareOrderAndInvoice = (
  order: PurchaseOrder,
  invoice: Invoice
): { reconciled: boolean; discrepancies: Discrepancy[] } => {
  const discrepancies: Discrepancy[] = [];
  const orderItems = new Map(
    order.items.map(it => [it.description.toLowerCase(), it])
  );
  invoice.items.forEach(item => {
    const key = item.description.toLowerCase();
    const orderItem = orderItems.get(key);
    if (!orderItem) {
      discrepancies.push({
        type: 'missing_item',
        itemDescription: item.description
      });
    } else {
      if (orderItem.quantity !== item.quantity) {
        discrepancies.push({
          type: 'quantity_mismatch',
          itemDescription: item.description,
          expected: orderItem.quantity,
          found: item.quantity
        });
      }
      if (orderItem.unitPrice !== item.unitPrice) {
        discrepancies.push({
          type: 'price_mismatch',
          itemDescription: item.description,
          expected: orderItem.unitPrice,
          found: item.unitPrice
        });
      }
    }
  });
  if (order.total !== invoice.total) {
    discrepancies.push({
      type: 'total_mismatch',
      expected: order.total,
      found: invoice.total
    });
  }
  return { reconciled: discrepancies.length === 0, discrepancies };
};

// Conciliação e liberação para pagamento
export const reconcilePurchaseOrder = async (
  orderId: string,
  invoice: Invoice
): Promise<{ reconciled: boolean; discrepancies: Discrepancy[] }> => {
  const order = await getPurchaseOrderById(orderId);
  if (!order) throw new Error('Pedido não encontrado');

  const result = compareOrderAndInvoice(order, invoice);
  if (result.reconciled) {
    await updateDoc(doc(db, COLLECTION_NAME, orderId), {
      status: 'reconciled',
      reconciledAt: Timestamp.now()
    });
  }
  return result;
};

export const canReleasePayment = async (
  orderId: string,
  invoice: Invoice
): Promise<{ allowed: boolean; discrepancies: Discrepancy[] }> => {
  const { reconciled, discrepancies } = await reconcilePurchaseOrder(
    orderId,
    invoice
  );
  return { allowed: reconciled, discrepancies };
};
