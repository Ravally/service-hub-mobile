import { create } from 'zustand';
import { subscribeToNetwork, setOnReconnect, fetchNetworkState } from '../services/networkMonitor';
import { initQueue, enqueue, processQueue, getQueueLength, clearQueue } from '../services/offlineQueue';

export const useOfflineSyncStore = create((set, get) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  _unsubscribeNetwork: null,
  _userId: null,

  initialize: async (userId) => {
    set({ _userId: userId });

    // Load persisted queue
    const count = await initQueue();
    set({ pendingCount: count });

    // Check initial network state
    const online = await fetchNetworkState();
    set({ isOnline: online });

    // Subscribe to network changes
    const unsub = subscribeToNetwork((nowOnline) => {
      set({ isOnline: nowOnline });
    });
    set({ _unsubscribeNetwork: unsub });

    // Set reconnect handler
    setOnReconnect(() => {
      const currentUserId = get()._userId;
      if (currentUserId) get().flushQueue(currentUserId);
    });

    // If online and queue has items, flush now
    if (online && count > 0) {
      get().flushQueue(userId);
    }
  },

  teardown: () => {
    const unsub = get()._unsubscribeNetwork;
    if (unsub) unsub();
    clearQueue();
    set({
      _unsubscribeNetwork: null,
      _userId: null,
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      lastSyncAt: null,
    });
  },

  enqueueMutation: async (item) => {
    await enqueue(item);
    set({ pendingCount: getQueueLength() });
  },

  flushQueue: async (userId) => {
    if (get().isSyncing) return;
    const count = getQueueLength();
    if (count === 0) return;

    set({ isSyncing: true });
    try {
      await processQueue(userId);
      set({
        pendingCount: getQueueLength(),
        lastSyncAt: new Date().toISOString(),
      });
    } catch {
      set({ pendingCount: getQueueLength() });
    } finally {
      set({ isSyncing: false });
    }
  },

  refreshPendingCount: () => {
    set({ pendingCount: getQueueLength() });
  },
}));
