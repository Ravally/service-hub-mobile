# Project Truckside — Mobile App Launch Roadmap

> **"Run your business from the truck."**
> This roadmap transforms Scaffld's mobile app from a field-worker tracking tool into a full business operations platform. Every task is sequenced so the CLI can build them one-by-one. No task should be skipped — each one gets Scaffld closer to app store launch.

---

## How To Use This Roadmap

Paste this into the CLI or save it to `docs/PROJECT_TRUCKSIDE.md`:

```
Read docs/PROJECT_TRUCKSIDE.md. This is your mobile app development roadmap.
Find the next task marked "⬜ Not Started" and begin working on it.
Follow the existing mobile app patterns: Zustand stores, offlineFirestore wrappers,
React Navigation stacks, and the theme system in constants/theme.js.
When you complete a task, update its status to "✅ Done" in this file
and add a brief note of what files were created/modified.
Then move to the next task.
```

---

## Architecture Reference

**Read these files before starting any task:**
- `App.js` — Entry point, navigation structure
- `stores/authStore.js` — Auth pattern (Zustand + onSnapshot)
- `stores/jobsStore.js` — Data store pattern (subscribe, mutations, offlineFirestore)
- `services/offlineFirestore.js` — How to write offline-safe Firestore operations
- `services/offlineQueue.js` — Mutation queue for offline support
- `constants/theme.js` — Colors, typography, spacing, shadows
- `components/common/` — Reusable UI components (Button, Card, Badge, Input, Toast, etc.)

**Patterns to follow:**
- State: Zustand stores with `onSnapshot` listeners for real-time sync
- Writes: Always use `offlineFirestore` wrappers (never raw Firestore `setDoc`/`updateDoc`)
- Navigation: React Navigation 7 — stack navigators nested inside bottom tabs
- Styling: `StyleSheet.create()` using theme tokens — never hardcode colors/fonts
- Touch targets: Minimum 44px throughout
- Haptics: `expo-haptics` on significant user actions (submit, delete, status change)
- Errors: Try/catch on all async, show Toast on failure
- Offline: All create/update operations must work offline and queue for sync
- Firestore paths: Everything under `users/{userId}/` — match existing web app collections exactly

**Shared Firestore collections (already used by web app — mobile reads AND writes to these):**
```
users/{userId}/clients/
users/{userId}/quotes/
users/{userId}/quoteTemplates/
users/{userId}/invoices/
users/{userId}/jobs/
users/{userId}/staff/
users/{userId}/notifications/
users/{userId}/formTemplates/
users/{userId}/formResponses/
users/{userId}/settings/companyDetails
users/{userId}/settings/invoiceSettings
```

---

## Phase 1: Money — Quote, Invoice, Get Paid (P0)

> These are the dealbreakers. A service business can't launch without quoting, invoicing, and collecting payment from the field.

---

### 1.1 ✅ Quotes Store

**Create:** `stores/quotesStore.js`

- Zustand store subscribing to `users/{userId}/quotes` via onSnapshot
- Fields to sync: id, clientId, clientName, status, lineItems, subtotal, tax, total, discount, depositRequired, depositAmount, notes, validUntil, createdAt, updatedAt
- Mutations (all via offlineFirestore):
  - `createQuote(quoteData)` — status defaults to "draft"
  - `updateQuote(id, updates)`
  - `updateQuoteStatus(id, newStatus)` — enforce valid transitions: draft → sent → awaiting_approval → approved → converted → archived
  - `duplicateQuote(id)` — deep copy with new ID, reset to draft
- Also subscribe to `users/{userId}/quoteTemplates` for template list
- Include `getQuotesForClient(clientId)` selector

**Acceptance criteria:**
- Store hydrates on auth, cleans up on sign-out
- All mutations work offline and queue correctly
- Status transitions are validated (can't go backwards)
- Template list is available for quote creation

---

### 1.2 ✅ Quote Create Screen

**Create:** `screens/quotes/QuoteCreateScreen.js`

- Multi-step form OR single scrollable screen (match the complexity level of JobFormScreen.js):
  1. **Client selection** — searchable list from clientsStore, tap to select
  2. **Line items** — add/remove rows: description, quantity, unit price, amount (auto-calc). Prefill from template if selected.
  3. **Optional items** — toggle-able add-ons the client can choose
  4. **Discounts** — percentage or fixed amount
  5. **Tax** — auto-apply from company settings, allow override
  6. **Deposit** — toggle required, set amount or percentage
  7. **Notes** — free text for terms, scope of work
  8. **Valid until** — date picker, default 30 days
- "Use Template" button at top — loads line items from a quoteTemplate
- Running total displayed at bottom (subtotal, discount, tax, total)
- Save as Draft button + Send to Client button
- Send triggers: update status to "sent", call Cloud Function or generate share link

**Navigation:** Add to quotes stack: `QuoteCreateScreen` accessible from Quick Create FAB and from client detail

**Acceptance criteria:**
- Can create a quote from scratch with multiple line items
- Can create from template (pre-fills line items)
- Totals calculate correctly (quantity × price, discount, tax)
- Saves to Firestore via offlineFirestore (works offline)
- "Send" updates status and generates a shareable link or triggers email

---

### 1.3 ✅ Quote Detail Screen

**Create:** `screens/quotes/QuoteDetailScreen.js`

- Header: client name, quote number, status badge, total amount
- Status action bar (contextual buttons based on current status):
  - Draft → "Send to Client"
  - Sent → "Mark Awaiting Approval"
  - Awaiting Approval → "Mark Approved" / "Mark Declined"
  - Approved → "Convert to Job"
- Line items list (read-only view with descriptions, quantities, amounts)
- Optional items section
- Deposit info if required
- Notes section
- Actions: Edit (opens QuoteCreateScreen prefilled), Duplicate, Share Link, Delete
- "Convert to Job" → creates a job doc from this quote's data, updates quote status to "converted"

**Acceptance criteria:**
- All status transitions work with haptic feedback
- Convert to Job creates a proper job document matching web app's job schema
- Edit navigates back to create screen with all fields prefilled
- Duplicate creates a new draft quote

---

### 1.4 ✅ Quotes List Screen

**Create:** `screens/quotes/QuotesListScreen.js`

- List of all quotes with status filter tabs: All | Draft | Sent | Approved | Archived
- Each row: client name, quote number, total, status badge, date
- Sort by: most recent first
- Tap → navigate to QuoteDetailScreen
- Pull-to-refresh
- Empty state component when no quotes

**Navigation:** Add "Quotes" to bottom tab bar OR to the "More" menu. Consider restructuring tabs:
- Option A: Today | Quotes | Clock | Clients | More
- Option B: Keep current tabs, add Quotes as a section accessible from Home/More

**Acceptance criteria:**
- Lists all quotes with correct status badges
- Filter tabs work correctly
- Real-time updates when quotes change (onSnapshot)

---

### 1.5 ✅ Invoices Store

**Create:** `stores/invoicesStore.js`

- Zustand store subscribing to `users/{userId}/invoices` via onSnapshot
- Fields: id, clientId, clientName, jobId, quoteId, status, lineItems, subtotal, tax, total, discount, amountPaid, amountDue, dueDate, paymentTerms, notes, paymentPlanEnabled, paymentPlanInstallments, createdAt, updatedAt
- Mutations (all via offlineFirestore):
  - `createInvoice(invoiceData)` — status defaults to "draft"
  - `createInvoiceFromJob(jobId)` — pull line items + labour from job
  - `createInvoiceFromQuote(quoteId)` — pull line items from quote
  - `updateInvoice(id, updates)`
  - `updateInvoiceStatus(id, newStatus)` — draft → sent → unpaid → partially_paid → paid / overdue / void
  - `recordPayment(id, amount, method)` — update amountPaid, calculate amountDue, auto-transition status
- Include `getInvoicesForClient(clientId)` and `getInvoiceForJob(jobId)` selectors
- Auto-apply company defaults from `settings/invoiceSettings` (payment terms, tax rate, footer notes)

**Acceptance criteria:**
- Store hydrates on auth
- Create from job pulls correct line items and labour costs
- Create from quote pulls correct line items
- Payment recording correctly calculates remaining balance
- Status auto-transitions: amountDue === 0 → "paid", partial payment → "partially_paid"

---

### 1.6 ✅ Invoice Create Screen

**Create:** `screens/invoices/InvoiceCreateScreen.js`

- Creation modes (passed via navigation params):
  1. **From scratch** — client picker + manual line items
  2. **From job** — pre-fills client + line items + labour from job data
  3. **From quote** — pre-fills client + line items from quote data
- Form fields:
  - Client (pre-selected if from job/quote, otherwise searchable picker)
  - Line items (same editor pattern as QuoteCreateScreen)
  - Tax (auto from settings, override allowed)
  - Discount
  - Payment terms (due on receipt, net 15, net 30, net 60 — from invoiceSettings)
  - Due date (auto-calculated from payment terms)
  - Notes
- Running total at bottom: subtotal, discount, tax, total, amount due
- Save as Draft + Send to Client buttons
- Send: update status to "sent", generate Stripe payment link, trigger email/SMS via Cloud Function

**Acceptance criteria:**
- All three creation modes work correctly
- Company defaults auto-applied (tax rate, payment terms, notes)
- Stripe payment link generated on send
- Works offline (queues for sync)

---

### 1.7 ✅ Invoice Detail Screen

**Create:** `screens/invoices/InvoiceDetailScreen.js`

- Header: client name, invoice number, status badge, total, amount due
- Status action bar:
  - Draft → "Send"
  - Sent/Unpaid → "Record Payment" / "Collect Payment" (Tap to Pay)
  - Partially Paid → "Record Payment" / "Collect Payment" (shows remaining)
  - Paid → (no actions, show "Paid" confirmation)
- Line items list
- Payment history (list of recorded payments with date, amount, method)
- Actions: Edit, Void, Share Link, Resend
- Link to associated job/quote if applicable

**Acceptance criteria:**
- All status transitions work
- Payment recording updates balance in real-time
- Void marks invoice as void and prevents further actions

---

### 1.8 ✅ Invoices List Screen

**Create:** `screens/invoices/InvoicesListScreen.js`

- Same pattern as QuotesListScreen
- Filter tabs: All | Draft | Unpaid | Overdue | Paid
- Each row: client name, invoice number, total, amount due, status badge, due date
- Overdue invoices highlighted (red accent)
- Pull-to-refresh, empty state

---

### 1.9 ✅ Stripe Tap to Pay Integration (Tier 1 — Payment Links)

**Create:** `services/payments.js` and `screens/payments/CollectPaymentScreen.js`

- Integrate Stripe Terminal SDK for React Native (`@stripe/stripe-terminal-react-native`)
- OR use Stripe's Tap to Pay on iPhone / Tap to Pay on Android
- CollectPaymentScreen:
  - Shows invoice summary (client, amount due)
  - "Collect Payment" button initiates NFC/contactless reader
  - Amount field (default: full amount due, allow partial)
  - Optional: tip amount field
  - Processing state with spinner
  - Success state with confirmation + haptic
  - On success: call `invoicesStore.recordPayment()` with amount + method "card_present"
- Handle errors gracefully: declined, no NFC, timeout

**Dependencies:** Requires Stripe Terminal SDK. May need a Cloud Function for creating PaymentIntents. Check if existing Stripe integration in web app has a `functions/` endpoint for this.

**Acceptance criteria:**
- Can collect contactless payment on iOS and Android
- Payment recorded to invoice automatically
- Works with partial payments
- Error states handled (declined card, NFC unavailable)
- Success triggers haptic feedback

**Note:** If Stripe Terminal SDK adds too much complexity for initial launch, implement a simpler flow first: "Generate Payment Link" → copies Stripe payment link to clipboard or sends via SMS. Then add Tap to Pay in a follow-up.

---

## Phase 2: Communication — Text, Message, Notify (P1)

> Field workers need to communicate with clients through the app, not their personal phones.

---

### 2.1 ✅ "On My Way" Text Feature

**Create:** `components/jobs/OnMyWayButton.js` and `services/smsService.js`

- Button on JobDetailScreen (visible for today's scheduled jobs)
- Tap opens a pre-filled sheet:
  - Recipient: client's primary phone (from client record)
  - Message template: "Hi {clientName}, {workerName} from {companyName} is on the way! Estimated arrival in {minutes} minutes."
  - Minutes picker: 5, 10, 15, 20, 30, 45, 60
  - Callback number selector: "My number" or "Office number" (from companyDetails)
- Send options:
  - **Phase 1:** Use `Linking.openURL('sms:...')` to open native SMS with pre-filled message (zero backend needed)
  - **Phase 2:** Send via Cloud Function using Twilio (tracked in Firestore, visible in message history)
- Log to Firestore: `users/{userId}/messages/` — { type: "on_my_way", clientId, jobId, message, sentAt, sentBy }

**Acceptance criteria:**
- One-tap opens SMS with correct message and recipient
- Minutes selector changes the message dynamically
- Message sent confirmation with haptic
- Logged to Firestore for history

---

### 2.2 ✅ Messages Store & Service

**Create:** `stores/messagesStore.js`

- Subscribe to `users/{userId}/messages` (or a new collection if needed)
- Each message: id, clientId, direction (inbound/outbound), channel (sms/email), body, sentAt, readAt, jobId (optional)
- Mutations:
  - `sendMessage(clientId, body, channel)` — creates message doc + triggers Cloud Function
  - `markRead(messageId)`
- Group messages by client for conversation view
- Unread count selector for badge on Messages tab

**Note:** Full two-way SMS requires a Twilio-powered dedicated number and a Cloud Function webhook to receive inbound messages. For initial launch, start with outbound-only (On My Way + manual SMS via native `sms:` URI). Add inbound via Twilio in a fast-follow.

---

### 2.3 ✅ Message Center Screen

**Create:** `screens/messages/MessageListScreen.js` and `screens/messages/ConversationScreen.js`

- **MessageListScreen:** List of client conversations, most recent first. Each row: client name, last message preview, timestamp, unread badge.
- **ConversationScreen:** Chat-style thread for one client. Outbound messages on right, inbound on left. Input field at bottom for new message. Send button. Attach image button (uses existing image picker).
- Add "Messages" tab to bottom navigation (replace or augment existing tabs):
  - Suggested new tab bar: **Today | Clients | ➕ | Clock | Messages**
  - The ➕ is the Quick Create FAB (see task 3.1)

**Acceptance criteria:**
- Conversation list shows all clients with message history
- Chat view renders messages in chronological order
- Can send new outbound message
- Unread badge shows on Messages tab

---

### 2.4 ✅ Notification Expansion

**Modify:** `services/notificationService.js`

- Add push notification triggers for:
  - Quote approved by client (listen for status change to "approved")
  - Quote declined
  - Invoice paid (listen for status change to "paid")
  - Invoice overdue (daily check Cloud Function)
  - New booking received (if booking system wired to mobile)
  - Schedule change (job reassigned, rescheduled, cancelled)
  - New client message received (inbound SMS)
- Each notification should deep-link to the relevant screen (quote detail, invoice detail, job detail, conversation)
- Active timer reminder: if a timer has been running > 10 hours, send a "Did you forget to clock out?" notification

**Acceptance criteria:**
- At least 5 new notification types functional
- Each deep-links to correct screen
- Timer reminder fires for forgotten clock-outs

---

## Phase 3: Operations — Create, Dispatch, Track (P1)

> Make the app a creation tool, not just a viewer.

---

### 3.1 ✅ Quick Create Floating Action Button (FAB)

**Create:** `components/common/QuickCreateFAB.js`

- Floating action button (bottom-right, above tab bar)
- Tap expands to show options with icons:
  - ➕ New Quote
  - ➕ New Job
  - ➕ New Invoice
  - ➕ New Client
  - ➕ New Expense
- Each option navigates to the relevant create screen
- Animated expand/collapse (use `Animated` API or `react-native-reanimated`)
- Available on all main screens (Today, Clients, Quotes, Invoices)
- Respects user permissions (if RBAC is later enforced, hide options user can't access)

**Acceptance criteria:**
- FAB visible on all main tabs
- Expands with smooth animation
- Each option navigates to correct create screen
- Collapses on backdrop tap or option selection
- Haptic feedback on expand

---

### 3.2 ✅ Client Create Screen

**Create:** `screens/clients/ClientCreateScreen.js`

- Form fields:
  - First name, last name (or company name toggle)
  - Phone (with "import from contacts" button using `expo-contacts`)
  - Email
  - Property address (with Google Places autocomplete if possible, or manual entry)
  - Billing address (toggle "same as property")
  - Notes
  - Tags (optional, simple text input or picker from existing tags)
- "Import from Contacts" button: uses `expo-contacts` to pick a contact, prefills name + phone + email
- Save creates client in `users/{userId}/clients/` via offlineFirestore
- On save: navigate to ClientDetailScreen for the new client

**Acceptance criteria:**
- Can create client with minimal info (name + phone)
- Import from device contacts works
- Saves to Firestore, appears in client list immediately (optimistic UI)
- Works offline

---

### 3.3 ✅ Job Create Screen

**Create:** `screens/jobs/JobCreateScreen.js`

- Form fields:
  - Client picker (searchable)
  - Property (from selected client's properties, or manual)
  - Title / description
  - Scheduled date + time (date/time picker)
  - Assigned to (staff picker — from staff collection)
  - Line items (description, quantity, unit price)
  - Notes / instructions
  - Checklist template (optional — pick from formTemplates)
- Save creates job in `users/{userId}/jobs/` with status "scheduled"
- Option: "Create from Quote" (navigation param) — prefills client + line items

**Acceptance criteria:**
- Can create a job with client, date, and at least one line item
- Staff assignment works
- Creates valid job document matching web app schema
- Appears in Today screen if scheduled for today

---

### 3.4 ✅ Mobile Schedule View (Admin)

**Create:** `screens/schedule/ScheduleScreen.js`

- Day view showing all team members' jobs (not just current user's)
- Columns or sections per staff member
- Each job card: client name, time, address, status
- Tap job → navigate to JobDetailScreen
- Date picker to navigate between days
- Map toggle: show all today's jobs on map with staff-colored pins
- Only visible to admin/manager roles (check auth store for role)

**Note:** This is the admin/owner view. Regular field workers continue to see only their own jobs on the existing TodayJobsScreen.

**Acceptance criteria:**
- Shows all team members' scheduled jobs for selected day
- Can navigate between days
- Tapping a job opens its detail
- Map view shows all jobs geographically

---

### 3.5 ✅ Mobile Expense Entry

**Create:** `screens/expenses/ExpenseCreateScreen.js` and `stores/expensesStore.js`

- **expensesStore.js:** Subscribe to `users/{userId}/expenses` (or wherever web app stores them — check web app's ExpensesPage.jsx for the collection path)
- ExpenseCreateScreen form:
  - Amount (numeric input)
  - Category (picker: Materials, Fuel, Equipment, Subcontractor, Other — match web app categories)
  - Description
  - Date (default today)
  - Job association (optional job picker)
  - Receipt photo (camera/gallery via expo-image-picker, upload to Firebase Storage)
- Save via offlineFirestore
- Accessible from: Quick Create FAB + Job Detail screen ("Add Expense" button)

**Acceptance criteria:**
- Can log expense with amount, category, description
- Receipt photo captured and uploaded to Firebase Storage
- Job association optional but functional
- Works offline (photo queued for deferred upload like form photos)

---

## Phase 4: Polish — Timers, Signatures, Search (P2)

> Quality-of-life features that make the app feel complete and professional.

---

### 4.1 ✅ Geofence Auto-Timers

**Modify:** `services/location.js` + **Create:** `services/geofenceService.js`

- Use `expo-location` `startGeofencingAsync()` to register geofences around today's job addresses
- Two modes (configurable in settings):
  1. **Auto-start:** Timer starts automatically when entering geofence radius (~100m)
  2. **Reminder:** Push notification "You've arrived at {clientName}. Start timer?" with action buttons
- On exit geofence: auto-stop visit timer, resume general timer (or send reminder)
- Handle multiple jobs at same/nearby address: show picker "Which job are you starting?"
- Register geofences on app launch for today's scheduled jobs
- Re-register when schedule changes (listen to jobsStore)
- Background location permission required — handle permission flow gracefully

**Acceptance criteria:**
- Geofences registered for today's jobs on launch
- Auto-start mode triggers timer within ~100m of job address
- Reminder mode sends actionable push notification
- Timer stops on geofence exit
- Multiple nearby jobs show disambiguation picker
- Falls back to manual timers if location permission denied

---

### 4.2 ✅ Signature Capture (Real Implementation)

**Replace:** `components/forms/SignaturePlaceholder.js` → `components/forms/SignatureField.js`

- Use `react-native-signature-canvas` or `expo-drawing` (or a simple custom PanResponder-based canvas)
- White canvas area with black stroke
- Buttons: Clear, Undo, Done
- On "Done": capture as base64 PNG, upload to Firebase Storage, store URL in form response
- Integrate into FormFieldRenderer.js as the handler for `type: "signature"`
- Also make available standalone for quote/invoice approval (customer signs on device)

**Acceptance criteria:**
- Smooth drawing experience (no lag on stroke)
- Clear and undo functional
- Signature saved as image to Firebase Storage
- URL stored in form response document
- Replaces existing placeholder seamlessly

---

### 4.3 ✅ Photo Markup / Annotation

**Create:** `screens/common/PhotoMarkupScreen.js`

- Opens after taking/selecting a photo (optional step — "Markup" button on photo preview)
- Tools: freehand draw (red pen), text label, arrow, rectangle
- Color picker: red, blue, yellow, white, black
- Undo / redo
- Save: flatten annotations onto image, replace original photo in the upload queue
- Use `expo-drawing` or a canvas overlay approach
- Accessible from: job forms photo field, expense receipt, job detail notes

**Acceptance criteria:**
- Can draw on photo with at least freehand + text
- Annotations baked into saved image
- Undo works
- Doesn't block the non-markup flow (markup is optional)

---

### 4.4 ✅ Cross-Entity Search

**Modify:** Navigation to add a unified Search screen (or enhance existing client search)

**Create:** `screens/search/SearchScreen.js`

- Single search bar that queries across: Clients, Quotes, Jobs, Invoices
- Tab filters: All | Clients | Quotes | Jobs | Invoices
- Search by: name, email, phone, address, quote/invoice number, job title
- Results show entity type icon + primary info + status badge
- Tap result → navigate to appropriate detail screen
- Show 100 most recently updated items by default (before any search input)
- Replace current Search tab functionality or enhance it

**Acceptance criteria:**
- Searches across all four entity types
- Results are fast (client-side filtering from Zustand stores)
- Each result navigates to correct detail screen
- Tab filters work

---

### 4.5 ✅ Home Screen Dashboard

**Modify:** `screens/jobs/TodayJobsScreen.js` or **Create:** `screens/home/HomeScreen.js`

- Replace or enhance the Today screen with a proper home dashboard:
  - **Today's appointments** summary with next-up highlighted
  - **Time tracked today** card (total hours, current timer status)
  - **To-do list** for admins: items needing action
    - Quotes awaiting approval: {count}
    - Invoices overdue: {count}
    - Unread messages: {count}
    - Jobs needing invoicing: {count}
  - **Quick stats** bar: week's revenue, jobs completed this week
  - Tapping any to-do item navigates to the filtered list
- Regular workers see: today's jobs + time tracked
- Admins see: full dashboard with to-do list + stats

**Acceptance criteria:**
- Dashboard loads fast with data from existing stores
- To-do items are counts with tap-to-navigate
- Time tracked card shows real-time timer if active
- Role-based: admin sees more than field worker

---

### 4.6 ✅ App Icon Quick Actions

**Configure:** Quick actions / 3D Touch shortcuts

- Use `expo-quick-actions` or react-native equivalent
- Long-press app icon shows:
  - "Clock In/Out" → opens ClockInOutScreen
  - "Today's Schedule" → opens TodayJobsScreen
  - "New Quote" → opens QuoteCreateScreen
- Configure in `app.config.js`

**Acceptance criteria:**
- Three quick actions available on long-press
- Each navigates to correct screen on tap

---

## Phase 5: Launch Prep — Rebrand, Test, Ship (P0)

> Non-negotiable tasks before app store submission.

---

### 5.1 ✅ Complete Scaffld Rebrand

**Modify:** Multiple files across the mobile app

- `app.config.js`: Change bundle ID from `app.trellio.mobile` → `app.scaffld.mobile`, update app name to "Scaffld", update scheme
- `constants/theme.js`: Rename any "trellio" references to "scaffld"
- AsyncStorage keys: Change `@trellio/offline_queue` → `@scaffld/offline_queue` (add migration for existing data)
- Splash screen: Update with Scaffld logo
- App icon: Generate Scaffld-branded icon (use brand tokens — teal on midnight)
- Any hardcoded "Trellio" strings in UI text

**Acceptance criteria:**
- Zero instances of "Trellio" or "trellio" in the entire mobile codebase
- `grep -ri "trellio" . --include="*.js" --include="*.jsx" --include="*.json"` returns nothing
- App icon and splash screen show Scaffld branding
- AsyncStorage migration handles existing data gracefully

---

### 5.2 ✅ Navigation Restructure

**Modify:** Navigation setup to accommodate new screens

- New bottom tab bar: **Home | Schedule | ➕ | Clock | More**
  - Home: Dashboard (task 4.5) with today's jobs
  - Schedule: Calendar/day view (task 3.4 for admins, today's jobs for workers)
  - ➕: Quick Create FAB (not a tab — a center button that opens the FAB menu)
  - Clock: Timesheet / Clock In-Out (existing)
  - More: Clients, Quotes, Invoices, Messages, Expenses, Settings
- Stack navigators for each section:
  - Quotes stack: List → Detail → Create
  - Invoices stack: List → Detail → Create → Collect Payment
  - Messages stack: Conversation List → Conversation Detail
  - Expenses stack: List → Create
  - Clients stack: List → Detail → Create (add create)
  - Jobs stack: List → Detail → Create → Form → Form Response

**Acceptance criteria:**
- All new screens accessible through navigation
- Back buttons work correctly through all stacks
- Deep-linking from notifications routes to correct screen
- Tab bar icons match Scaffld brand (use teal for active state)

---

### 5.3 ✅ Offline Audit

**Review and test:** All new stores and screens for offline capability

- Test each create screen with airplane mode ON:
  - Create quote offline → comes back online → quote syncs to Firestore
  - Create invoice offline → syncs
  - Create client offline → syncs
  - Create expense offline → syncs (including deferred photo upload)
  - Record payment offline → syncs
  - Send On My Way → queues (or gracefully shows "no connection" for SMS)
- Verify offlineQueue handles all new mutation types
- Test conflict resolution: create item offline, modify same data on web, come back online
- Ensure no data loss scenarios

**Acceptance criteria:**
- All CRUD operations work offline
- All queued mutations flush on reconnect
- No duplicate records created
- Photos queue for deferred upload
- User gets clear feedback about offline state (SyncStatusBadge visible)

---

### 5.4 ✅ Error Boundaries & Edge Cases

- Add ErrorBoundary wrapper to all new screens
- Handle empty states for: no quotes, no invoices, no messages, no expenses
- Handle permission denied states: location, contacts, camera, notifications
- Handle Stripe errors: no NFC, payment declined, network error during payment
- Test on small screens (iPhone SE, small Android) — ensure nothing overflows
- Test with large datasets: 500+ clients, 200+ quotes, 300+ invoices — ensure list performance

**Acceptance criteria:**
- No unhandled JS crashes on any new screen
- Every empty state has a meaningful message + CTA
- Permission denials show helpful explanation + settings link
- Lists perform well with 500+ items (use FlatList correctly)

---

### 5.5 ⬜ App Store Preparation

- Generate app icons: 1024×1024 for iOS, 512×512 for Android (Scaffld branded)
- Create splash screen with Scaffld logo + loading indicator
- Write app store listing:
  - Title: "Scaffld — Field Service Management"
  - Subtitle: "Quote, schedule, invoice, get paid"
  - Description: Cover key features (quoting, scheduling, invoicing, payments, GPS, offline)
  - Keywords: field service, FSM, scheduling, invoicing, contractor, HVAC, plumbing, landscaping, cleaning
  - Screenshots: 6-8 showing key flows (home dashboard, quoting, invoicing, collect payment, route map, clock in)
- Privacy policy URL (required for both stores)
- Configure `app.config.js` for EAS Build:
  - iOS: bundleIdentifier, buildNumber, infoPlist permissions
  - Android: package, versionCode, permissions
- Run `eas build` for both platforms
- Submit to TestFlight (iOS) and Internal Testing (Android)

**Acceptance criteria:**
- Builds successfully for both iOS and Android
- No console warnings/errors in release build
- App store metadata complete
- Privacy policy accessible at URL
- TestFlight / Internal Testing build distributed to testers

---

## Phase Summary

| Phase | Tasks | Focus | Priority |
|-------|-------|-------|----------|
| **1: Money** | 1.1–1.9 | Quotes, Invoices, Payments | P0 — Dealbreaker |
| **2: Communication** | 2.1–2.4 | SMS, Messages, Notifications | P1 — Major |
| **3: Operations** | 3.1–3.5 | Create, Dispatch, Expenses | P1 — Major |
| **4: Polish** | 4.1–4.6 | Geofence, Signatures, Search, Dashboard | P2 — Important |
| **5: Launch** | 5.1–5.5 | Rebrand, Navigation, Offline, App Store | P0 — Required |

**Total tasks: 23**
**Estimated new files: ~35-45 screens, stores, services, components**
**Estimated timeline: 8-12 weeks**

---

## Task Status Tracker

| # | Task | Status | Files Created/Modified | Date |
|---|------|--------|----------------------|------|
| 1.1 | Quotes Store | ✅ Done | `stores/quotesStore.js` (created), `App.js` (modified — subscribe/unsubscribe) | 2026-02-14 |
| 1.2 | Quote Create Screen | ✅ Done | `screens/quotes/QuoteCreateScreen.js` (created) | 2026-02-14 |
| 1.3 | Quote Detail Screen | ✅ Done | `screens/quotes/QuoteDetailScreen.js` (created) | 2026-02-14 |
| 1.4 | Quotes List Screen | ✅ Done | `screens/quotes/QuotesListScreen.js` (created) | 2026-02-14 |
| 1.5 | Invoices Store | ✅ Done | `stores/invoicesStore.js` (created), `App.js` (modified — subscribe/unsubscribe) | 2026-02-14 |
| 1.6 | Invoice Create Screen | ✅ Done | `screens/invoices/InvoiceCreateScreen.js` (created) | 2026-02-14 |
| 1.7 | Invoice Detail Screen | ✅ Done | `screens/invoices/InvoiceDetailScreen.js` (created) | 2026-02-14 |
| 1.8 | Invoices List Screen | ✅ Done | `screens/invoices/InvoicesListScreen.js` (created) | 2026-02-14 |
| 1.9 | Stripe Tap to Pay | ✅ Done (Tier 1) | `services/paymentService.js` (created), `screens/invoices/CollectPaymentScreen.js` (created), `navigation/InvoiceStack.js` (modified), `InvoiceDetailScreen.js` (modified — Collect Payment action), `app.config.js` (modified — env vars), **web:** `functions/index.js` (modified — createPaymentIntent, createConnectionToken, payment_intent.succeeded webhook) | 2026-02-14 |
| 2.1 | On My Way Text | ✅ Done | `services/smsService.js` (created), `components/jobs/OnMyWayButton.js` (created), `screens/jobs/JobDetailScreen.js` (modified — added OnMyWay + quick actions row) | 2026-02-14 |
| 2.2 | Messages Store | ✅ Done | `stores/messagesStore.js` (created), `stores/index.js` (modified — barrel export), `App.js` (modified — subscribe/unsubscribe) | 2026-02-14 |
| 2.3 | Message Center Screen | ✅ Done | `screens/messages/MessageListScreen.js` (created), `screens/messages/ConversationScreen.js` (created), `navigation/MessageStack.js` (created), `navigation/MoreStack.js` (created), `navigation/MainTabs.js` (modified — More tab uses MoreStack), `screens/settings/SettingsScreen.js` (modified — Messages menu item with unread badge) | 2026-02-14 |
| 2.4 | Notification Expansion | ✅ Done | `services/notificationService.js` (modified — deep-links for quotes/invoices/messages, showLocalNotification, scheduleTimerReminder/cancelTimerReminder, identifier-based scheduling), `services/notificationTriggers.js` (created — store subscriptions for quote approved/declined, invoice paid/overdue, new inbound message), `screens/time/ClockInOutScreen.js` (modified — timer reminder on clock-in/out), `App.js` (modified — startNotificationTriggers) | 2026-02-14 |
| 3.1 | Quick Create FAB | ✅ Done | `components/common/QuickCreateFAB.js` (created — animated FAB with spring expansion, backdrop overlay, 4 options: New Quote/Invoice/Client/Job), `navigation/MainTabs.js` (modified — wrapped Tab.Navigator with View, added FAB overlay) | 2026-02-14 |
| 3.2 | Client Create Screen | ✅ Done | `screens/clients/ClientCreateScreen.js` (created — form with first/last name, company, phone, email, property address, notes; expo-contacts import; saves via offlineFirestore), `stores/clientsStore.js` (modified — added createClient/updateClient mutations), `navigation/ClientStack.js` (modified — added ClientCreate screen), `expo-contacts` installed | 2026-02-14 |
| 3.3 | Job Create Screen | ✅ Done | `screens/jobs/JobCreateScreen.js` (created — client picker, date/time picker, staff assignment, line items, notes), `stores/jobsStore.js` (modified — added createJob mutation via offlineFirestore), `navigation/JobStack.js` (modified — added JobCreate screen), `app.config.js` (modified — added datetimepicker plugin), `@react-native-community/datetimepicker` installed | 2026-02-14 |
| 3.4 | Mobile Schedule View | ✅ Done | `screens/schedule/ScheduleScreen.js` (created — day view with date nav, SectionList grouped by staff, job cards with status/time/client/address, Today FAB), `navigation/MoreStack.js` (modified — added Schedule screen), `screens/settings/SettingsScreen.js` (modified — Team Schedule menu row, admin/owner gated) | 2026-02-14 |
| 3.5 | Mobile Expense Entry | ✅ Done | `screens/expenses/ExpenseCreateScreen.js` (created — job picker, amount, 6 category chips, date picker, receipt photo via camera/gallery with Firebase Storage upload, notes), `stores/jobsStore.js` (modified — added addExpenseToJob mutation), `navigation/MoreStack.js` (modified — added ExpenseCreate screen), `components/common/QuickCreateFAB.js` (modified — added New Expense option), `screens/jobs/JobDetailScreen.js` (modified — expenses section + Add Expense button) | 2026-02-14 |
| 4.1 | Geofence Auto-Timers | ✅ Done | `services/geofenceService.js` (created — SCAFFLD_GEOFENCE_TASK background task, registerTodayGeofences with 120m radius, enter/exit handlers with local notifications), `services/location.js` (modified — added requestBackgroundLocationPermission), `app.config.js` (modified — expo-location plugin with background config, ACCESS_BACKGROUND_LOCATION), `App.js` (modified — geofence lifecycle with jobs store subscription, 2s debounced re-registration, cleanup on sign-out), `expo-task-manager` installed | 2026-02-14 |
| 4.2 | Signature Capture | ✅ Done | `components/forms/SignatureField.js` (created — full-screen modal with react-native-signature-canvas, white pen on dark bg, undo/clear/done, base64 PNG output, preview with redo/remove), `components/forms/FormFieldRenderer.js` (modified — replaced SignaturePlaceholder with SignatureField, passes onChange), `screens/jobs/JobFormScreen.js` (modified — uploads signature base64 to Firebase Storage on submit), `react-native-signature-canvas` + `react-native-webview` installed | 2026-02-14 |
| 4.3 | Photo Markup | ✅ Done | `screens/common/PhotoMarkupScreen.js` (created — WebView HTML5 canvas overlay on photo, freehand draw/arrow/text tools, 5 color picker, undo, exports annotated base64 PNG), `components/forms/PhotoFormField.js` (modified — added Markup button below preview, navigates to PhotoMarkupScreen with callback), `navigation/JobStack.js` (modified — added PhotoMarkup screen), `react-native-view-shot` installed | 2026-02-14 |
| 4.4 | Cross-Entity Search | ✅ Done | `screens/search/SearchScreen.js` (created — unified search across clients/jobs/quotes/invoices, tab filters All/Clients/Jobs/Quotes/Invoices, entity type icons + status badges, cross-tab navigation to detail screens, 50-result cap, 2-char min query), `navigation/MoreStack.js` (modified — added Search screen), `screens/settings/SettingsScreen.js` (modified — added Search menu row) | 2026-02-14 |
| 4.5 | Home Screen Dashboard | ✅ Done | `components/home/DashboardCards.js` (created — Next Up job card, Time Tracked Today with live timer dot, admin Action Items with tap-to-navigate: quotes awaiting response, overdue invoices, unread messages, jobs needing invoicing; admin Quick Stats: week's revenue + jobs completed), `screens/jobs/TodayJobsScreen.js` (modified — integrated DashboardCards as FlatList ListHeaderComponent, title changed to "Home"), `navigation/JobStack.js` (modified — screen title to "Home"), `navigation/MainTabs.js` (modified — tab icon to home, label to "Home") | 2026-02-14 |
| 4.6 | App Icon Quick Actions | ✅ Done | `services/quickActionsService.js` (created — registerQuickActions, handleQuickAction, getInitialQuickAction; 3 actions: Clock In/Out, Today's Schedule, New Quote; SF Symbols on iOS), `app.config.js` (modified — added expo-quick-actions plugin), `App.js` (modified — registers actions on auth, handles cold-launch + warm-launch quick action events), `navigation/MoreStack.js` (modified — added ClockInOut screen), `expo-quick-actions` installed | 2026-02-14 |
| 5.1 | Scaffld Rebrand | ✅ Done | `app.config.js`, `theme/colors.js`, `theme/typography.js`, `navigation/RootNavigator.js`, `services/offlineQueue.js` (all modified) | 2026-02-14 |
| 5.2 | Navigation Restructure | ✅ Done | `navigation/QuoteStack.js`, `navigation/InvoiceStack.js` (created), `navigation/MainTabs.js` (modified — 5 tabs: Today, Clients, Quotes, Invoices, More) | 2026-02-14 |
| 5.3 | Offline Audit | ✅ Done | **Audit results:** All 28 store mutations across 6 stores use offlineFirestore wrappers (100% safe). **Fixes applied:** `screens/quotes/QuoteCreateScreen.js` (modified — offline-aware toast + getIsConnected), `screens/invoices/InvoiceCreateScreen.js` (modified — offline-aware toast), `screens/clients/ClientCreateScreen.js` (modified — offline-aware toast + null docId fallback nav), `screens/jobs/JobCreateScreen.js` (modified — offline-aware toast + null docId fallback nav), `screens/expenses/ExpenseCreateScreen.js` (modified — defers receipt photo upload when offline, stores local URI + pendingReceiptUpload flag, offline toast), `screens/invoices/CollectPaymentScreen.js` (modified — online gate for payment link generation with warning toast, offline-aware manual payment toast). SyncStatusBadge verified on Home + ClockInOut screens. | 2026-02-14 |
| 5.4 | Error Boundaries & Edge Cases | ✅ Done | **Audit results:** 25/27 screens wrapped with ErrorBoundary (only LoginScreen + ForgotPasswordScreen in AuthStack missing — acceptable). All 5 list screens have meaningful empty states with icons + messages. All permission denials handled without crashes. **Fixes applied:** `services/imageService.js` (modified — camera + photo library permission denial now shows Alert with "Open Settings" link), `services/location.js` (modified — location permission denial now shows Alert with "Open Settings" link explaining clock-in/job check-in use case). Permission pattern: Alert.alert with Cancel + Open Settings buttons using Linking.openSettings(). | 2026-02-14 |
| 5.5 | App Store Preparation | ⬜ Not Started | | |

---

*Project Truckside — Run your business from the truck. 🚛*
