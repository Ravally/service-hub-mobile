import AsyncStorage from '@react-native-async-storage/async-storage';
import { addUserDoc, updateUserDoc, setUserDoc, userDoc } from './firestore';
import { uploadImage } from './imageService';
import { getDoc } from 'firebase/firestore';

const QUEUE_KEY = '@scaffld/offline_queue';
const DEAD_LETTER_KEY = '@scaffld/offline_dead_letter';
const MAX_RETRIES = 5;

let queue = [];

/** Load queue from AsyncStorage into memory */
export async function initQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    queue = raw ? JSON.parse(raw) : [];
  } catch {
    queue = [];
  }
  return queue.length;
}

/** Persist current in-memory queue to AsyncStorage */
async function persistQueue() {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Silent fail — queue is still in memory
  }
}

/** Add a mutation to the queue */
export async function enqueue(item) {
  const entry = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...item,
    timestamp: new Date().toISOString(),
    retries: 0,
  };
  queue.push(entry);
  await persistQueue();
  return entry.id;
}

/** Remove a processed item from the queue */
export async function dequeue(id) {
  queue = queue.filter((item) => item.id !== id);
  await persistQueue();
}

/** Get current queue length */
export function getQueueLength() {
  return queue.length;
}

/** Get full queue (for debugging) */
export function getQueue() {
  return [...queue];
}

/** Move item to dead-letter storage */
async function moveToDeadLetter(item) {
  try {
    const raw = await AsyncStorage.getItem(DEAD_LETTER_KEY);
    const dead = raw ? JSON.parse(raw) : [];
    dead.push({ ...item, failedAt: new Date().toISOString() });
    await AsyncStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(dead));
  } catch {
    // Silent fail
  }
}

/** Upload any pending photos for a queue item, replacing local URIs with URLs */
async function uploadPendingPhotos(userId, item) {
  if (!item.photoUris || item.photoUris.length === 0) return item.data;

  const data = { ...item.data };
  for (const photo of item.photoUris) {
    const path = `users/${userId}/${item.collection}/${photo.fieldId}_${Date.now()}.jpg`;
    const url = await uploadImage(photo.localUri, path);
    if (url && photo.fieldId && data.responses) {
      data.responses[photo.fieldId] = url;
    }
  }
  return data;
}

/** Check if server doc has newer data (stale detection) */
async function isStale(userId, item) {
  if (item.type !== 'update' || !item.docId) return false;
  try {
    const ref = userDoc(userId, item.collection, item.docId);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().updatedAt > item.timestamp) {
      return true;
    }
  } catch {
    // Can't check — proceed with write
  }
  return false;
}

/** Process a single queue item */
async function processItem(userId, item) {
  // Stale detection
  if (await isStale(userId, item)) return 'stale';

  // Upload pending photos
  const data = await uploadPendingPhotos(userId, item);

  // Execute the Firestore write
  if (item.type === 'update') {
    await updateUserDoc(userId, item.collection, item.docId, data);
  } else if (item.type === 'add') {
    await addUserDoc(userId, item.collection, data);
  } else if (item.type === 'set') {
    await setUserDoc(userId, item.collection, item.docId, data);
  }

  return 'success';
}

/**
 * Process all queued mutations in FIFO order.
 * @returns {{ processed: number, failed: number, stale: number }}
 */
export async function processQueue(userId) {
  const snapshot = [...queue];
  let processed = 0;
  let failed = 0;
  let stale = 0;

  for (const item of snapshot) {
    try {
      const result = await processItem(userId, item);
      if (result === 'stale') {
        stale++;
      } else {
        processed++;
      }
      await dequeue(item.id);
    } catch {
      item.retries = (item.retries || 0) + 1;
      if (item.retries >= MAX_RETRIES) {
        await moveToDeadLetter(item);
        await dequeue(item.id);
      } else {
        await persistQueue();
      }
      failed++;
    }
  }

  return { processed, failed, stale };
}

/** Clear the entire queue (used on sign out) */
export async function clearQueue() {
  queue = [];
  await AsyncStorage.removeItem(QUEUE_KEY);
}
