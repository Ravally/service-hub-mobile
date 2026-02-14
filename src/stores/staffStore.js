import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import { userCollection } from '../services/firestore';

export const useStaffStore = create((set, get) => ({
  staff: [],
  loading: true,
  error: null,
  _unsubscribe: null,

  subscribe: (userId) => {
    const existing = get()._unsubscribe;
    if (existing) existing();

    const ref = userCollection(userId, 'staff');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const staff = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        set({ staff, loading: false, error: null });
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
    set({ _unsubscribe: null, staff: [], loading: true, error: null });
  },

  // --- Getters ---

  getStaffById: (staffId) => {
    return get().staff.find((s) => s.id === staffId) || null;
  },

  getActiveStaff: () => {
    return get().staff.filter((s) => s.status !== 'Inactive');
  },
}));
