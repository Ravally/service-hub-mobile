import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import { userCollection } from '../services/firestore';
import {
  offlineAddUserDoc,
  offlineUpdateUserDoc,
} from '../services/offlineFirestore';

/**
 * Valid invoice status transitions.
 */
const VALID_TRANSITIONS = {
  Draft: ['Sent', 'Void'],
  Sent: ['Unpaid', 'Partially Paid', 'Paid', 'Void', 'Draft'],
  Unpaid: ['Partially Paid', 'Paid', 'Overdue', 'Void'],
  'Partially Paid': ['Paid', 'Overdue', 'Void'],
  Paid: ['Void'],
  Overdue: ['Partially Paid', 'Paid', 'Void'],
  Void: [],
};

export const useInvoicesStore = create((set, get) => ({
  invoices: [],
  loading: true,
  error: null,
  _unsubscribe: null,

  subscribe: (userId) => {
    const existing = get()._unsubscribe;
    if (existing) existing();

    const ref = userCollection(userId, 'invoices');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const invoices = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
          });
        set({ invoices, loading: false, error: null });
      },
      (err) => {
        set({ error: err.message, loading: false });
      },
    );

    set({ _unsubscribe: unsubscribe });
    return unsubscribe;
  },

  unsubscribe: () => {
    const unsub = get()._unsubscribe;
    if (unsub) unsub();
    set({ _unsubscribe: null, invoices: [], loading: true, error: null });
  },

  // --- Getters ---

  getInvoiceById: (invoiceId) => {
    return get().invoices.find((inv) => inv.id === invoiceId) || null;
  },

  getInvoicesByClient: (clientId) => {
    return get().invoices.filter(
      (inv) => inv.clientId === clientId && inv.status !== 'Void',
    );
  },

  getInvoicesByStatus: (status) => {
    return get().invoices.filter((inv) => inv.status === status);
  },

  getInvoiceForJob: (jobId) => {
    return get().invoices.find((inv) => inv.jobId === jobId) || null;
  },

  getOverdueInvoices: () => {
    const now = new Date();
    return get().invoices.filter((inv) => {
      if (inv.status === 'Paid' || inv.status === 'Void') return false;
      if (!inv.dueDate) return false;
      return new Date(inv.dueDate) < now;
    });
  },

  // --- Mutations ---

  createInvoice: async (userId, invoiceData) => {
    const now = new Date().toISOString();
    const data = {
      ...invoiceData,
      status: invoiceData.status || 'Draft',
      payments: invoiceData.payments || [],
      createdAt: now,
      updatedAt: now,
    };
    return await offlineAddUserDoc(userId, 'invoices', data);
  },

  updateInvoice: async (userId, invoiceId, updates) => {
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, ...updates, updatedAt: new Date().toISOString() }
          : inv,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'invoices', invoiceId, updates);
  },

  updateInvoiceStatus: async (userId, invoiceId, newStatus) => {
    const invoice = get().getInvoiceById(invoiceId);
    if (!invoice) return;

    const allowed = VALID_TRANSITIONS[invoice.status] || [];
    if (!allowed.includes(newStatus)) return;

    const updates = { status: newStatus };
    if (newStatus === 'Sent') updates.sentAt = new Date().toISOString();
    if (newStatus === 'Paid') updates.paidAt = new Date().toISOString();

    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, ...updates, updatedAt: new Date().toISOString() }
          : inv,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'invoices', invoiceId, updates);
  },

  recordPayment: async (userId, invoiceId, amount, method = 'Manual') => {
    const invoice = get().getInvoiceById(invoiceId);
    if (!invoice) return;

    const now = new Date().toISOString();
    const payment = { amount, method, createdAt: now, tip: 0 };
    const payments = [...(invoice.payments || []), payment];
    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
    const invoiceTotal = Number(invoice.total || 0);
    const newStatus =
      totalPaid >= invoiceTotal ? 'Paid' : 'Partially Paid';

    const updates = { payments, status: newStatus };
    if (newStatus === 'Paid') updates.paidAt = now;

    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, ...updates, updatedAt: now }
          : inv,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'invoices', invoiceId, updates);
  },

  createInvoiceFromJob: async (userId, job, quote = null) => {
    const lineItems =
      job.lineItems?.length > 0
        ? job.lineItems
        : quote?.lineItems || [
            { type: 'line_item', name: job.title, qty: 1, price: 0 },
          ];

    const now = new Date().toISOString();
    const data = {
      clientId: job.clientId,
      jobId: job.id,
      quoteId: quote?.id || job.quoteId || '',
      status: 'Draft',
      subject: job.title || 'For services rendered',
      lineItems,
      taxRate: quote?.taxRate ?? 15,
      payments: [],
      createdAt: now,
      updatedAt: now,
    };
    return await offlineAddUserDoc(userId, 'invoices', data);
  },

  createInvoiceFromQuote: async (userId, quote) => {
    const now = new Date().toISOString();
    const data = {
      clientId: quote.clientId,
      quoteId: quote.id,
      status: 'Draft',
      subject: quote.title || 'For services rendered',
      lineItems: quote.lineItems || [],
      taxRate: quote.taxRate ?? 15,
      quoteDiscountType: quote.quoteDiscountType || 'amount',
      quoteDiscountValue: quote.quoteDiscountValue || 0,
      payments: [],
      createdAt: now,
      updatedAt: now,
    };
    return await offlineAddUserDoc(userId, 'invoices', data);
  },
}));
