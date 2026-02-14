import { create } from 'zustand';

let toastId = 0;

export const useUiStore = create((set, get) => ({
  toasts: [],
  globalLoading: false,

  showToast: (message, type = 'success') => {
    const id = ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => get().dismissToast(id), 3000);
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
