import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import * as authService from '../services/auth';

export const useAuthStore = create((set) => ({
  user: null,
  userId: null,
  userProfile: null,
  pushToken: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  /**
   * Initialize auth state listener — call once on app start.
   * Returns unsubscribe function.
   */
  initialize: () => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          set({
            user: firebaseUser,
            userId: firebaseUser.uid,
            userProfile: userDocSnap.exists() ? userDocSnap.data() : null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          set({
            user: firebaseUser,
            userId: firebaseUser.uid,
            userProfile: null,
            isAuthenticated: true,
            isLoading: false,
            error: err.message,
          });
        }
      } else {
        set({
          user: null,
          userId: null,
          userProfile: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    });
  },

  signIn: async (email, password) => {
    try {
      set({ error: null });
      await authService.signIn(email, password);
    } catch (err) {
      const message = authService.getAuthErrorMessage(err.code);
      set({ error: message });
      throw err;
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
    } catch (err) {
      set({ error: err.message });
    }
  },

  resetPassword: async (email) => {
    try {
      set({ error: null });
      await authService.resetPassword(email);
    } catch (err) {
      const message = authService.getAuthErrorMessage(err.code);
      set({ error: message });
      throw err;
    }
  },

  setPushToken: (token) => set({ pushToken: token }),
  clearError: () => set({ error: null }),
}));
