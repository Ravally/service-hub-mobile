import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import { userCollection } from '../services/firestore';

export const useFormTemplatesStore = create((set, get) => ({
  templates: [],
  loading: true,
  error: null,
  _unsubscribe: null,

  subscribe: (userId) => {
    const existing = get()._unsubscribe;
    if (existing) existing();

    const ref = userCollection(userId, 'formTemplates');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const templates = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((t) => t.active !== false);
        set({ templates, loading: false, error: null });
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
    set({ _unsubscribe: null, templates: [], loading: true, error: null });
  },

  getTemplateById: (id) => {
    return get().templates.find((t) => t.id === id) || null;
  },

  getTemplatesByType: (type) => {
    return get().templates.filter((t) => t.type === type);
  },
}));
