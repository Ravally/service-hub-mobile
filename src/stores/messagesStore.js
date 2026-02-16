import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import { userCollection } from '../services/firestore';
import {
  offlineAddUserDoc,
  offlineUpdateUserDoc,
} from '../services/offlineFirestore';

export const useMessagesStore = create((set, get) => ({
  messages: [],
  loading: true,
  error: null,
  _unsubscribe: null,

  subscribe: (userId) => {
    const existing = get()._unsubscribe;
    if (existing) existing();

    const ref = userCollection(userId, 'messages');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const messages = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const dateA = a.sentAt ? new Date(a.sentAt) : new Date(0);
            const dateB = b.sentAt ? new Date(b.sentAt) : new Date(0);
            return dateB - dateA;
          });
        set({ messages, loading: false, error: null });
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
    set({ _unsubscribe: null, messages: [], loading: true, error: null });
  },

  // --- Getters ---

  getMessageById: (messageId) => {
    return get().messages.find((m) => m.id === messageId) || null;
  },

  getMessagesForClient: (clientId) => {
    return get()
      .messages.filter((m) => m.clientId === clientId)
      .sort((a, b) => {
        const dateA = a.sentAt ? new Date(a.sentAt) : new Date(0);
        const dateB = b.sentAt ? new Date(b.sentAt) : new Date(0);
        return dateA - dateB; // chronological for conversation view
      });
  },

  getConversations: () => {
    const msgs = get().messages;
    const map = new Map();
    for (const m of msgs) {
      if (!m.clientId) continue;
      const existing = map.get(m.clientId);
      if (!existing || new Date(m.sentAt) > new Date(existing.sentAt)) {
        map.set(m.clientId, m);
      }
    }
    return Array.from(map.entries())
      .map(([clientId, lastMessage]) => ({ clientId, lastMessage }))
      .sort((a, b) => new Date(b.lastMessage.sentAt) - new Date(a.lastMessage.sentAt));
  },

  getUnreadCount: () => {
    return get().messages.filter((m) => m.direction === 'inbound' && !m.readAt).length;
  },

  // --- Mutations ---

  sendMessage: async (userId, { clientId, body, channel = 'sms', jobId, phone, type = 'manual' }) => {
    const now = new Date().toISOString();
    const data = {
      clientId,
      direction: 'outbound',
      channel,
      type,
      body,
      phone: phone || null,
      jobId: jobId || null,
      sentAt: now,
      readAt: null,
    };
    return await offlineAddUserDoc(userId, 'messages', data);
  },

  markRead: async (userId, messageId) => {
    const now = new Date().toISOString();
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, readAt: now } : m,
      ),
    }));
    await offlineUpdateUserDoc(userId, 'messages', messageId, { readAt: now });
  },

  markConversationRead: async (userId, clientId) => {
    const unread = get().messages.filter(
      (m) => m.clientId === clientId && m.direction === 'inbound' && !m.readAt,
    );
    const now = new Date().toISOString();
    set((state) => ({
      messages: state.messages.map((m) =>
        m.clientId === clientId && m.direction === 'inbound' && !m.readAt
          ? { ...m, readAt: now }
          : m,
      ),
    }));
    for (const msg of unread) {
      await offlineUpdateUserDoc(userId, 'messages', msg.id, { readAt: now });
    }
  },
}));
