# CLAMP — AI Feature Registry

Before starting ANY task that touches AI features, read this file first.
This is the single source of truth for what AI exists, where it lives, and how it works.

## Cloud Function: `scaffldAI`

Lives in the web app repo (`../service-hub-app/functions/ai.js`).
Firebase callable function using claude-sonnet-4-20250514 via @anthropic-ai/sdk.
System prompts are in `../service-hub-app/functions/prompts.js`.

### Actions

| Action | Input | Output |
|--------|-------|--------|
| `quoteWriter` | Free-text job description | JSON array: `[{description, quantity, unit, unitPrice}]` |
| `noteRewrite` | `Tone: {tone}\n\n{notes}` | Rewritten text |
| `emailDraft` | Template context + prompt | Email body text |
| `invoiceDescription` | Brief line item descriptions | JSON array of improved strings |
| `jobSummary` | Job data summary | Completion summary text |

## Mobile AI Integration Points

| Feature | File | How it calls AI |
|---------|------|-----------------|
| AI Quote Writer | `src/screens/quotes/QuoteCreateScreen.js` | `generateQuote()` from aiService |
| AI Job Summary | `src/screens/jobs/JobDetailScreen.js` (NotesTab) | `generateJobSummary()` from aiService |

### Frontend Service

**File:** `src/services/aiService.js`
**Protocol:** `fetch(FUNCTIONS_BASE_URL/scaffldAI)` with `Authorization: Bearer {idToken}` + body `{ data: { action, input } }`
**Methods:** `generateQuote()`, `generateJobSummary()`, `rewriteNotes()`

## On My Way — Dual Send

**File:** `src/components/jobs/OnMyWayButton.js`

Two send paths:
1. **Send via Scaffld** — writes `{ onMyWay: true, onMyWayTechName, onMyWayEta }` to job doc -> triggers `onMyWayNotification` Cloud Function -> sends via Twilio (if configured)
2. **Open SMS App** — opens native SMS via `expo-linking` with pre-filled message -> logs to `messages` collection

The Cloud Function (`../service-hub-app/functions/sms.js`) reads Twilio credentials from `users/{uid}/settings/companyDetails` -> `integrations.twilio`.

## Rules

1. **Never duplicate AI logic.** All AI calls go through `aiService.js` -> `scaffldAI` Cloud Function -> Anthropic API.
2. **Never hardcode prompts.** System prompts live in `../service-hub-app/functions/prompts.js` only.
3. **AI UI styling:** Purple theme (`#A78BFA`). Use the Card with `borderColor: 'rgba(167,139,250,0.25)'` pattern. Sparkles icon for triggers.
4. **Error handling:** Always try/catch, show feedback via `useUiStore.showToast()`. Never expose raw API errors.
5. **Offline:** AI features require network. Do not attempt AI calls when offline — check `getIsConnected()` first if adding new AI features.
6. **Adding a new AI action:** Update `functions/prompts.js` + `functions/ai.js` in the web app repo, then add the wrapper to `src/services/aiService.js` here.
