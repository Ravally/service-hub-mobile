import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import { userCollection } from '../services/firestore';
import {
  offlineAddUserDoc,
  offlineUpdateUserDoc,
} from '../services/offlineFirestore';

/**
 * Valid quote status transitions.
 * Key = current status, value = array of allowed next statuses.
 */
const VALID_TRANSITIONS = {
  Draft: ['Sent', 'Awaiting Response', 'Archived'],
  Sent: ['Awaiting Response', 'Archived', 'Draft'],
  'Awaiting Response': ['Approved', 'Changes Requested', 'Archived', 'Draft'],
  Approved: ['Converted', 'Archived'],
  'Changes Requested': ['Draft', 'Archived'],
  Converted: [],
  Archived: ['Draft'],
};

export const useQuotesStore = create((set, get) => ({
  quotes: [],
  loading: true,
  error: null,
  _unsubscribe: null,

  subscribe: (userId) => {
    const existing = get()._unsubscribe;
    if (existing) existing();

    const ref = userCollection(userId, 'quotes');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const quotes = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
          });
        set({ quotes, loading: false, error: null });
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
    set({ _unsubscribe: null, quotes: [], loading: true, error: null });
  },

  // --- Getters ---

  getQuoteById: (quoteId) => {
    return get().quotes.find((q) => q.id === quoteId) || null;
  },

  getQuotesByClient: (clientId) => {
    return get().quotes.filter((q) => q.clientId === clientId && !q.archived);
  },

  getQuotesByStatus: (status) => {
    return get().quotes.filter((q) => q.status === status && !q.archived);
  },

  // --- Mutations ---

  createQuote: async (userId, quoteData) => {
    const now = new Date().toISOString();
    const data = {
      ...quoteData,
      status: quoteData.status || 'Draft',
      createdAt: now,
      updatedAt: now,
    };
    return await offlineAddUserDoc(userId, 'quotes', data);
  },

  updateQuote: async (userId, quoteId, updates) => {
    set((state) => ({
      quotes: state.quotes.map((q) =>
        q.id === quoteId
          ? { ...q, ...updates, updatedAt: new Date().toISOString() }
          : q,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'quotes', quoteId, updates);
  },

  updateQuoteStatus: async (userId, quoteId, newStatus) => {
    const quote = get().getQuoteById(quoteId);
    if (!quote) return;

    const allowed = VALID_TRANSITIONS[quote.status] || [];
    if (!allowed.includes(newStatus)) return;

    const updates = { status: newStatus };
    if (newStatus === 'Sent') updates.sentAt = new Date().toISOString();
    if (newStatus === 'Approved') updates.approvedAt = new Date().toISOString();
    if (newStatus === 'Converted')
      updates.convertedAt = new Date().toISOString();
    if (newStatus === 'Archived') {
      updates.archived = true;
      updates.archivedAt = new Date().toISOString();
    }

    set((state) => ({
      quotes: state.quotes.map((q) =>
        q.id === quoteId
          ? { ...q, ...updates, updatedAt: new Date().toISOString() }
          : q,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'quotes', quoteId, updates);
  },

  duplicateQuote: async (userId, quoteId) => {
    const source = get().getQuoteById(quoteId);
    if (!source) return null;

    const clone = { ...source };
    delete clone.id;
    delete clone.quoteNumber;
    delete clone.createdAt;
    delete clone.updatedAt;
    delete clone.sentAt;
    delete clone.approvedAt;
    delete clone.convertedAt;
    delete clone.archivedAt;
    delete clone.archived;
    delete clone.publicApprovalToken;
    delete clone.approvalStatus;
    delete clone.approvedByName;

    const now = new Date().toISOString();
    const data = { ...clone, status: 'Draft', createdAt: now, updatedAt: now };
    return await offlineAddUserDoc(userId, 'quotes', data);
  },

  deleteQuote: async (userId, quoteId) => {
    set((state) => ({
      quotes: state.quotes.filter((q) => q.id !== quoteId),
    }));
    await offlineUpdateUserDoc(userId, 'quotes', quoteId, {
      _deleted: true,
      archived: true,
      status: 'Archived',
    });
  },
}));
