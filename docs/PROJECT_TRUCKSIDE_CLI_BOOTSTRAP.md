# Project Truckside — Mobile Repo Bootstrap & Execution Prompt

> **How to use:** Open Claude Code CLI in your `service-hub-mobile` directory and paste the prompt below.
> It will create the full Claude Code infrastructure (CLAUDE.md, skills, settings, slash command),
> then begin executing Project Truckside tasks one-by-one.
>
> After the first session, just type: `/truckside`

---

## Understanding the System (For You, Not the CLI)

Your web app repo has a 6-layer Claude Code setup. The mobile repo has none of it.
This prompt creates the equivalent system for mobile, tailored to Expo/React Native patterns
instead of React/Vite/Tailwind patterns. Here's the mapping:

| Layer | Web App (Service-Hub) | Mobile App (service-hub-mobile) |
|-------|----------------------|-------------------------------|
| Project Brain | `CLAUDE.md` (Trellio-branded) | → Creates `CLAUDE.md` (Scaffld-branded) |
| Skills | 5 web-focused skills | → Creates 3 mobile-focused skills |
| Settings | `.claude/settings.json` | → Creates `.claude/settings.json` |
| Slash Commands | `.claude/commands/next-task.md` | → Creates `.claude/commands/truckside.md` |
| Brand Reference | `brand/TRELLIO_BRAND.md` | → References `src/constants/theme.js` |
| Design Reference | `design/mockups/*.html` | → References web app mockups via brand doc |
| Roadmap | `docs/ROADMAP.md` | → `docs/PROJECT_TRUCKSIDE.md` (already local) |

---

## The Prompt

````
You are bootstrapping "Project Truckside" — transforming the Scaffld mobile app from a
field-worker tracking tool into a full business management platform.

This is a TWO-PHASE operation: first SET UP the Claude Code infrastructure for this repo,
then BEGIN EXECUTING the roadmap. Do both in this session.

╔═══════════════════════════════════════════════════════════════╗
║  PHASE 0: READ EVERYTHING BEFORE TOUCHING ANYTHING          ║
╚═══════════════════════════════════════════════════════════════╝

Read these files in this exact order. Do NOT skip any.

1. app.config.js — understand the app identity and Expo config
2. App.js — understand navigation structure and entry point
3. src/constants/theme.js — THE design token bible (colors, fonts, spacing, shadows)
4. src/stores/jobsStore.js — THE Zustand + onSnapshot pattern to replicate
5. src/stores/authStore.js — THE auth pattern
6. src/services/offlineFirestore.js — THE offline write wrapper (use for ALL writes)
7. src/services/offlineQueue.js — THE mutation queue
8. src/services/networkMonitor.js — connectivity detection
9. src/screens/jobs/JobDetailScreen.js — THE screen layout pattern to replicate
10. src/screens/jobs/TodayJobsScreen.js — THE list screen pattern
11. src/components/common/ — list ALL available reusable components
12. src/navigation/ — understand current nav structure
13. src/components/forms/FormFieldRenderer.js — dynamic form pattern
14. docs/PROJECT_TRUCKSIDE.md — THE roadmap (your work order)

After reading all files, note:
- The Zustand store pattern (create, subscribe, mutate via offlineFirestore)
- The screen layout pattern (SafeAreaView, ScrollView, StyleSheet.create with theme tokens)
- Available common components (Button, Card, Badge, Input, Toast, etc.)
- The navigation structure (bottom tabs + stack navigators)
- The offline pattern (offlineFirestore wraps all mutations → queues → auto-flush)

╔═══════════════════════════════════════════════════════════════╗
║  PHASE 0.5: CREATE CLAUDE CODE INFRASTRUCTURE                ║
╚═══════════════════════════════════════════════════════════════╝

Create each of these files exactly as specified. This is the 6-layer system
that makes every future task brand-consistent and token-efficient.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 1: CLAUDE.md (Project Brain — always loaded)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create CLAUDE.md in the project root. Keep it LEAN — under 80 lines.
Claude Code reads this EVERY session, so every line costs tokens.

Contents must include:
- App identity: "Scaffld" (scaffld.com), field service management mobile app
- Stack: Expo SDK 54, React Native, Firebase/Firestore, Zustand 5, React Navigation 7
- Architecture rules:
  • State: Zustand stores with onSnapshot listeners (pattern: src/stores/jobsStore.js)
  • Writes: ALWAYS use src/services/offlineFirestore.js — never raw Firestore
  • Styling: StyleSheet.create() with tokens from src/constants/theme.js — NEVER hardcode
  • Touch targets: minimum 44px
  • Haptics: expo-haptics on submit, delete, status transitions
  • Errors: try/catch ALL async, show Toast on failure
  • Offline: every create/update MUST work offline via offlineQueue
- Firestore paths: everything under users/{userId}/ — list the collections:
  clients, quotes, quoteTemplates, invoices, jobs, staff, notifications,
  formTemplates, formResponses, settings/companyDetails, settings/invoiceSettings
- File conventions:
  • Screens: src/screens/{domain}/{ScreenName}.js
  • Stores: src/stores/{name}Store.js
  • Services: src/services/{name}.js
  • Components: src/components/{domain}/{Name}.js
  • Common UI: src/components/common/{Name}.js
- Brand quick-ref (just the essentials — full brand is in theme.js):
  • Teal: #0EA5A0 | Deep Teal: #087F7A | Coral: #F7845E | Amber: #FFAA5C
  • Dark BG: #0C1220 | Cards: #1A2332 | Text: #A3B4C8
  • Fonts: DM Sans (UI), JetBrains Mono (data)
  • Voice: "crew" not "team", "jobs" not "tasks", "get paid" not "process payments"
- Protected files (modify carefully, never delete):
  App.js, src/constants/theme.js, src/services/offline*.js, src/stores/authStore.js
- Current roadmap: docs/PROJECT_TRUCKSIDE.md — find next ⬜ task

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 2: SKILLS (On-demand playbooks — loaded when relevant)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create 3 skill files. Each has a YAML header (name + description) that Claude reads
at startup. The full content only loads when a matching task is detected.
This saves tokens — skills can be long and detailed without always consuming context.

SKILL A: .claude/skills/scaffld-mobile-screen/SKILL.md
- name: scaffld-mobile-screen
- description: "Triggers when creating screens, pages, views, or UI components for the
  mobile app. Covers: React Native screen patterns, navigation wiring, Zustand store
  connection, StyleSheet.create with theme tokens, loading/empty/error states."
- Content should specify:
  • Screen template structure: imports → component → styles → export
  • SafeAreaView wrapper, ScrollView vs FlatList decision (FlatList for lists >20 items)
  • How to connect to Zustand stores (useStore with selectors)
  • How to receive navigation params (route.params)
  • Required states: loading (LoadingSkeleton), empty (EmptyState component), error (ErrorBoundary)
  • Pull-to-refresh pattern using RefreshControl
  • StyleSheet.create pattern using theme.js tokens
  • How to add to navigation: which navigator file to modify, stack vs tab
  • Status badge pattern (use Badge component from common/)
  • Money formatting: formatCurrency() util
  • Date formatting conventions
  • Haptic feedback: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) on key actions
  • Line items pattern: FlatList with add/remove, running total at bottom

SKILL B: .claude/skills/scaffld-mobile-data/SKILL.md
- name: scaffld-mobile-data
- description: "Triggers when creating Zustand stores, Firestore subscriptions,
  offline mutations, or data services. Covers: store creation pattern, onSnapshot
  subscriptions, offlineFirestore wrappers, mutation queue, selectors."
- Content should specify:
  • Complete store template matching jobsStore.js pattern exactly
  • onSnapshot subscription setup with cleanup
  • How to scope queries: collection(`db, 'users', userId, '{collection}')
  • Mutation functions using offlineFirestore.setDocument / updateDocument / deleteDocument
  • Status transition validation pattern (define allowed transitions, throw on invalid)
  • Selector functions (getByClient, getByStatus, etc.)
  • Store hydration on auth state change, cleanup on sign-out
  • Optimistic UI updates
  • How deferred photo uploads work (store local URI, upload on sync)

SKILL C: .claude/skills/scaffld-code-review/SKILL.md
- name: scaffld-code-review
- description: "Triggers on 'review', 'check', 'audit', or after completing a task.
  Read-only audit for mobile app quality. Checks: theme token usage, offline safety,
  Firestore scoping, touch targets, component reuse, brand compliance."
- Content should specify a checklist:
  • [ ] No hardcoded colors/fonts/spacing — all from theme.js
  • [ ] All Firestore writes go through offlineFirestore
  • [ ] All queries scoped to users/{userId}/
  • [ ] Touch targets ≥ 44px on all interactive elements
  • [ ] try/catch on every async operation
  • [ ] Toast shown on errors
  • [ ] Loading, empty, and error states present
  • [ ] Uses existing common/ components (Button, Card, Badge, Input) — no duplication
  • [ ] Haptic feedback on status transitions and destructive actions
  • [ ] No "Trellio" references anywhere — all "Scaffld"
  • [ ] Navigation properly wired (can reach screen, back button works)
  • [ ] FlatList used for lists >20 items (not ScrollView with map)
  • Output format: 🔴 Blockers / 🟡 Warnings / 🟢 Good

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 3: SETTINGS (Permissions — no prompts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create .claude/settings.json:
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Write(src/**)",
      "Write(docs/**)",
      "Write(CLAUDE.md)",
      "Write(App.js)",
      "Write(app.config.js)",
      "Bash(npm install *)",
      "Bash(npx expo install *)",
      "Bash(find *)",
      "Bash(grep *)",
      "Bash(cat *)",
      "Bash(wc *)",
      "Bash(ls *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push *)",
      "Write(.env*)"
    ]
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 4: SLASH COMMAND (One-command workflow trigger)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create .claude/commands/truckside.md:

```
Read docs/PROJECT_TRUCKSIDE.md. Find the next task marked "⬜ Not Started".

Before building:
1. Read the task's full description and acceptance criteria
2. Read referenced files (stores/screens to match patterns from)
3. Check src/constants/theme.js for any tokens you need
4. Check src/components/common/ for components to reuse
5. State your plan: what files you'll create/modify and why

Build the feature:
1. Stores first (data layer), then screens (UI layer), then navigation wiring
2. ALL writes through offlineFirestore — no exceptions
3. ALL styling from theme.js — no hardcoded values
4. Include: loading state, empty state, error handling, haptic feedback
5. Match existing patterns exactly (jobsStore.js for stores, JobDetailScreen.js for screens)

After building:
1. Run the scaffld-code-review skill checklist
2. Update docs/PROJECT_TRUCKSIDE.md: change ⬜ to ✅, add files to tracker table
3. Print summary: task name, files created, files modified
4. Move to the next ⬜ task without asking — keep building

Stop only when: you hit a task requiring external setup (Stripe SDK, Twilio, etc.)
or when you've completed an entire Phase.
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 5: BRAND ENFORCEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The mobile app's brand tokens live in src/constants/theme.js.
This is the ONLY source of truth for colors, fonts, spacing, and shadows.

After creating the infrastructure above, verify theme.js has Scaffld branding:
- If it still says "trellio" anywhere, update to "scaffld"
- Confirm primary color is #0EA5A0 (Scaffld Teal)
- Confirm font family references DM Sans and JetBrains Mono
- Confirm spacing uses the base-8 scale (4, 8, 16, 24, 32, 48, 64, 96)

DO NOT create a separate brand/ directory in the mobile repo.
theme.js IS the brand file for mobile. Keep it as the single source.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 6: CROSS-REPO REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The web app (Service-Hub repo) has HTML mockups in design/mockups/ and a full
brand spec in brand/SCAFFLD_BRAND.md. The mobile app shares Firestore collections
with the web app — same data, same paths, same field names.

When building mobile screens that mirror web features (quotes, invoices):
- The Firestore document schema MUST match what the web app reads/writes
- Field names, status strings, and data types must be identical
- Check the web app's equivalent handler if unsure about a field name

╔═══════════════════════════════════════════════════════════════╗
║  PHASE 1: EXECUTE PROJECT TRUCKSIDE                          ║
╚═══════════════════════════════════════════════════════════════╝

Infrastructure is set up. Now open docs/PROJECT_TRUCKSIDE.md.

EXECUTION RULES (for token efficiency):

1. BUILD STORES IN BATCHES — Tasks 1.1 (quotesStore) and 1.5 (invoicesStore)
   are structurally identical. Build 1.1 thoroughly, then template 1.5 from it.
   Same for screens: build QuoteCreateScreen, then template InvoiceCreateScreen.

2. DON'T RE-READ FILES — Once you've read jobsStore.js in Phase 0, don't read
   it again. You have the pattern memorized.

3. DON'T ASK BETWEEN TASKS — After completing one task, update the tracker and
   immediately start the next. Only stop at Phase boundaries or external blockers.

4. REUSE COMMON COMPONENTS — Before building any UI element, check if
   Button, Card, Badge, Input, Toast, LoadingSpinner, LoadingSkeleton, or
   EmptyState already handles it. Never duplicate what exists.

5. NAVIGATION CHANGES — Accumulate nav changes. Don't restructure navigation
   after every screen. Build all Phase 1 screens, then wire navigation once
   at the end of the phase (or do it as Task 5.2 specifies).

6. SELF-REVIEW AFTER EACH PHASE — Run the scaffld-code-review checklist after
   completing all tasks in a phase, not after every individual task.

Begin now. Start with Task 1.1 (Quotes Store) from docs/PROJECT_TRUCKSIDE.md.
````

---

## After First Session: The `/truckside` Loop

Once the infrastructure exists, every future CLI session is just:

```
/truckside
```

Claude Code will:
1. Read CLAUDE.md (auto-loaded, knows brand + conventions)
2. Load the relevant skill (scaffld-mobile-screen or scaffld-mobile-data)
3. Read PROJECT_TRUCKSIDE.md, find next ⬜ task
4. Build it following exact patterns
5. Update the tracker
6. Move to next task

No re-explaining. No context lost. No brand drift.

---

## Quick Reference: What Gets Created

```
service-hub-mobile/
├── CLAUDE.md                                    ← NEW (project brain)
├── .claude/
│   ├── settings.json                            ← NEW (permissions)
│   ├── skills/
│   │   ├── scaffld-mobile-screen/SKILL.md       ← NEW (screen building playbook)
│   │   ├── scaffld-mobile-data/SKILL.md         ← NEW (store/data playbook)
│   │   └── scaffld-code-review/SKILL.md         ← NEW (quality checklist)
│   └── commands/
│       └── truckside.md                         ← NEW (slash command)
├── docs/
│   ├── PROJECT_TRUCKSIDE.md                     ← ALREADY LOCAL (roadmap)
│   └── SCAFFLD_VS_JOBBER_MOBILE_APP.md          ← OPTIONAL (comparison context)
├── App.js                                       ← EXISTS (will be modified for nav)
├── src/
│   ├── constants/theme.js                       ← EXISTS (brand tokens, may need rebrand)
│   ├── stores/                                  ← EXISTS (new stores added here)
│   ├── screens/                                 ← EXISTS (new screens added here)
│   ├── services/                                ← EXISTS (new services added here)
│   ├── components/                              ← EXISTS (new components added here)
│   └── navigation/                              ← EXISTS (modified for new screens)
```

---

## Why This Works

**Token efficiency:**
- CLAUDE.md is lean (~60-80 lines) — loaded every session but doesn't waste tokens
- Skills only load when relevant — the screen skill doesn't load during store work
- Slash command means zero re-explaining after setup
- Batch execution (don't ask between tasks) saves conversation overhead
- Template approach (build one, clone for similar) halves screen-building time

**Brand consistency:**
- CLAUDE.md embeds brand rules in the always-loaded layer
- Every skill references theme.js as the single token source
- Code review skill catches any hardcoded values or Trellio references
- No separate brand files to fall out of sync — theme.js is the truth

**Pattern consistency:**
- Phase 0 reads actual code files, not descriptions of patterns
- Skills contain templates derived from YOUR existing code
- Every new store mirrors jobsStore.js exactly
- Every new screen mirrors JobDetailScreen.js exactly
- Cross-repo Firestore schema is explicitly called out

**Autonomous operation:**
- settings.json pre-allows all needed file operations
- Slash command says "don't ask between tasks"
- Self-review runs at phase boundaries, not per-task
- Stops only at external blockers (Stripe SDK, Twilio setup)
