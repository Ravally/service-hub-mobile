import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import { userCollection } from '../services/firestore';
import {
  offlineAddUserDoc,
  offlineUpdateUserDoc,
} from '../services/offlineFirestore';

export const useClientsStore = create((set, get) => ({
  clients: [],
  loading: true,
  error: null,
  _unsubscribe: null,

  subscribe: (userId) => {
    const existing = get()._unsubscribe;
    if (existing) existing();

    const ref = userCollection(userId, 'clients');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const clients = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        set({ clients, loading: false, error: null });
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
    set({ _unsubscribe: null, clients: [], loading: true, error: null });
  },

  // --- Getters ---

  getClientById: (clientId) => {
    return get().clients.find((c) => c.id === clientId) || null;
  },

  searchClients: (term) => {
    const lower = (term || '').toLowerCase().trim();
    if (!lower) return get().clients;
    return get().clients.filter((c) => {
      const fields = [c.name, c.email, c.phone, c.address].filter(Boolean);
      return fields.some((f) => f.toLowerCase().includes(lower));
    });
  },

  getClientsByStatus: (status) => {
    return get().clients.filter((c) => c.status === status);
  },

  // --- Mutations ---

  createClient: async (userId, clientData) => {
    const now = new Date().toISOString();
    const data = {
      ...clientData,
      status: clientData.status || 'Active',
      createdAt: now,
      updatedAt: now,
    };
    return await offlineAddUserDoc(userId, 'clients', data);
  },

  updateClient: async (userId, clientId, updates) => {
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === clientId
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'clients', clientId, updates);
  },
}));
