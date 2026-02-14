import { collection, doc, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get a Firestore collection reference scoped to a user (multi-tenant)
 */
export function userCollection(userId, collectionName) {
  return collection(db, `users/${userId}/${collectionName}`);
}

/**
 * Get a Firestore document reference scoped to a user
 */
export function userDoc(userId, collectionName, docId) {
  return doc(db, `users/${userId}/${collectionName}`, docId);
}

/**
 * Add a document to a user-scoped collection
 */
export async function addUserDoc(userId, collectionName, data) {
  const ref = userCollection(userId, collectionName);
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

/**
 * Update a document in a user-scoped collection
 */
export async function updateUserDoc(userId, collectionName, docId, updates) {
  const ref = userDoc(userId, collectionName, docId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a document from a user-scoped collection
 */
export async function deleteUserDoc(userId, collectionName, docId) {
  const ref = userDoc(userId, collectionName, docId);
  await deleteDoc(ref);
}

/**
 * Set (merge) a document in a user-scoped collection
 */
export async function setUserDoc(userId, collectionName, docId, data) {
  const ref = userDoc(userId, collectionName, docId);
  await setDoc(ref, {
    ...data,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
