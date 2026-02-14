import { addUserDoc, updateUserDoc, setUserDoc } from './firestore';
import { getIsConnected } from './networkMonitor';
import { useOfflineSyncStore } from '../stores/offlineSyncStore';

/**
 * Offline-aware wrapper for updateUserDoc.
 * If offline or write fails, enqueues the mutation for later sync.
 */
export async function offlineUpdateUserDoc(userId, collection, docId, data) {
  if (!getIsConnected()) {
    useOfflineSyncStore.getState().enqueueMutation({
      type: 'update',
      collection,
      docId,
      data,
      photoUris: [],
    });
    return;
  }

  try {
    await updateUserDoc(userId, collection, docId, data);
  } catch {
    useOfflineSyncStore.getState().enqueueMutation({
      type: 'update',
      collection,
      docId,
      data,
      photoUris: [],
    });
  }
}

/**
 * Offline-aware wrapper for addUserDoc.
 * Supports deferred photo uploads via photoUris.
 */
export async function offlineAddUserDoc(userId, collection, data, photoUris = []) {
  if (!getIsConnected()) {
    useOfflineSyncStore.getState().enqueueMutation({
      type: 'add',
      collection,
      docId: null,
      data,
      photoUris,
    });
    return null;
  }

  try {
    return await addUserDoc(userId, collection, data);
  } catch {
    useOfflineSyncStore.getState().enqueueMutation({
      type: 'add',
      collection,
      docId: null,
      data,
      photoUris,
    });
    return null;
  }
}

/**
 * Offline-aware wrapper for setUserDoc.
 */
export async function offlineSetUserDoc(userId, collection, docId, data) {
  if (!getIsConnected()) {
    useOfflineSyncStore.getState().enqueueMutation({
      type: 'set',
      collection,
      docId,
      data,
      photoUris: [],
    });
    return;
  }

  try {
    await setUserDoc(userId, collection, docId, data);
  } catch {
    useOfflineSyncStore.getState().enqueueMutation({
      type: 'set',
      collection,
      docId,
      data,
      photoUris: [],
    });
  }
}
