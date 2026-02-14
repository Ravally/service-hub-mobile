import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import { userCollection } from '../services/firestore';
import { offlineAddUserDoc } from '../services/offlineFirestore';

export const useFormResponsesStore = create((set, get) => ({
  responses: [],
  loading: true,
  error: null,
  _unsubscribe: null,

  subscribe: (userId) => {
    const existing = get()._unsubscribe;
    if (existing) existing();

    const ref = userCollection(userId, 'formResponses');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const responses = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const dateA = a.submittedAt ? new Date(a.submittedAt) : new Date(0);
            const dateB = b.submittedAt ? new Date(b.submittedAt) : new Date(0);
            return dateB - dateA;
          });
        set({ responses, loading: false, error: null });
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
    set({ _unsubscribe: null, responses: [], loading: true, error: null });
  },

  getResponseById: (id) => {
    return get().responses.find((r) => r.id === id) || null;
  },

  getResponsesByJob: (jobId) => {
    return get().responses.filter((r) => r.jobId === jobId);
  },

  getResponsesByTemplate: (templateId) => {
    return get().responses.filter((r) => r.templateId === templateId);
  },

  submitResponse: async (userId, response, photoUris = []) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const data = {
      ...response,
      submittedAt: new Date().toISOString(),
      offline: true,
      syncedAt: null,
    };
    // Optimistic local add
    set((state) => ({
      responses: [{ id: tempId, ...data }, ...state.responses],
    }));
    const docId = await offlineAddUserDoc(userId, 'formResponses', data, photoUris);
    return docId || tempId;
  },
}));
