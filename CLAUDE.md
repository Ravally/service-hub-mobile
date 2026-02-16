# Scaffld Mobile

Native mobile companion for the Scaffld field service management platform.
**Stack:** Expo SDK 54 | React Native 0.81.5 | Firebase 12.3 | Zustand 5.0 | React Navigation 7
**Web App:** `../service-hub-app` (React 18 + Vite + Tailwind)

## Key Rules

- **Multi-tenant:** Every Firestore path is `users/{userId}/{collection}` — use `userCollection()` and `userDoc()` helpers
- **Money:** Always integers (cents) in storage/calculations, display via `formatCurrency(cents / 100)`
- **Offline-first:** All writes go through `offlineFirestore.js` wrappers — never call `updateUserDoc` directly from stores
- **Stores:** Zustand with `subscribe(userId)` / `unsubscribe()` pattern — optimistic local updates + offline enqueue
- **Screens:** Max 200 lines, delegate logic to stores/utils, wrap with `withErrorBoundary()`
- **Touch targets:** Min 48px (field workers in gloves/sunlight)
- **Brand:** Use `colors` from `src/theme/colors.js` — scaffld teal (#0EA5A0), signal coral, harvest amber, midnight, charcoal — never hardcode hex
- **Fonts:** DM Sans (primary), JetBrains Mono (data) — loaded in App.js via expo-google-fonts
- **Navigation:** React Navigation 7 native stack — add screens to existing stacks or create new Tab.Screen
- **Errors:** Always try/catch async operations, show feedback via `useUiStore.showToast()`

## Architecture

```
src/
  stores/        → Zustand stores (subscribe/unsubscribe pattern)
  services/      → Firebase, offline queue, network monitor, notifications
  screens/       → Screen components (by domain: jobs/, clients/, auth/, etc.)
  components/
    ui/          → Reusable primitives (Button, Card, Badge, Input, etc.)
    forms/       → Form field renderers (Text, Number, Photo, etc.)
    maps/        → Map components (JobMapView, RouteSummaryCard)
    jobs/        → Job-specific components (JobCard)
  navigation/    → React Navigation stacks and tabs
  theme/         → Design tokens (colors, typography, spacing, shadows)
  utils/         → Pure functions (formatters, calculations, validation, route)
```

## Store Pattern (copy this for new stores)

```js
import { create } from 'zustand';
import { onSnapshot } from 'firebase/firestore';
import { userCollection } from '../services/firestore';
import { offlineUpdateUserDoc } from '../services/offlineFirestore';

export const useXxxStore = create((set, get) => ({
  items: [],
  loading: true,
  error: null,
  _unsubscribe: null,

  subscribe: (userId) => {
    const existing = get()._unsubscribe;
    if (existing) existing();
    const ref = userCollection(userId, 'xxx');
    const unsubscribe = onSnapshot(ref,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        set({ items, loading: false, error: null });
      },
      (err) => set({ error: err.message, loading: false }),
    );
    set({ _unsubscribe: unsubscribe });
    return unsubscribe;
  },

  unsubscribe: () => {
    const unsub = get()._unsubscribe;
    if (unsub) unsub();
    set({ _unsubscribe: null, items: [], loading: true, error: null });
  },

  getById: (id) => get().items.find((i) => i.id === id) || null,
}));
```

## Cross-Repo Reference

The web app at `../service-hub-app` is the source of truth for:
- Firestore collections and document shapes (check `src/constants/initialStates.js`)
- Status constants (check `src/constants/statusConstants.js`)
- Calculation logic (check `src/utils/calculations.js`)
- Brand design system (check `brand/SCAFFLD_BRAND.md`)

When adding a new feature to mobile, check the web app first for existing data models and business logic.

## Current Status

- Phase 2.1: Mobile App Core — Complete (auth, jobs, clients, clock, forms, offline sync)
- Phase 2.2: GPS & Route Optimization — Complete (maps, route planning, navigation)
- Project Truckside: In Progress (quotes, invoices, scheduling, notifications on mobile)
