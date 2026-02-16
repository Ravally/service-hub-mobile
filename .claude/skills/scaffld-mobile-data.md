# scaffld-mobile-data

Build Zustand stores, offline-capable data handlers, and Firestore integrations for Scaffld Mobile.

## When to Use
Creating new data stores, adding mutations, building new Firestore collection handlers, offline sync logic.

## Rules
1. Follow the Zustand subscribe/unsubscribe pattern (see CLAUDE.md)
2. All writes through `offlineFirestore.js` wrappers — never direct Firestore calls from stores
3. Optimistic local updates: `set()` immediately, then `await offlineXxxUserDoc()`
4. Collection paths always `users/{userId}/{collection}` via `userCollection()`/`userDoc()`
5. Sort data in the `onSnapshot` callback
6. Register new stores in `App.js` useEffect (subscribe on userId, unsubscribe on logout)
7. Money values stored as integers (cents)

## Store Creation Checklist
- [ ] Create `src/stores/xxxStore.js` following the pattern
- [ ] Add `subscribe(userId)` and `unsubscribe()` calls in `App.js`
- [ ] Add getters (getById, getByStatus, getByClient, etc.)
- [ ] Add mutations with optimistic updates + offline wrappers
- [ ] Barrel export if creating new utils

## Offline Wrapper Usage
```js
import { offlineUpdateUserDoc, offlineAddUserDoc } from '../services/offlineFirestore';

// In a store mutation:
updateItem: async (userId, itemId, data) => {
  set((state) => ({
    items: state.items.map((i) =>
      i.id === itemId ? { ...i, ...data, updatedAt: new Date().toISOString() } : i
    ),
  }));
  await offlineUpdateUserDoc(userId, 'collectionName', itemId, data);
},
```
