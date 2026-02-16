# scaffld-code-review

Review Scaffld Mobile code for quality, offline safety, brand compliance, and React Native best practices.

## When to Use
After completing a feature, before committing, when reviewing code quality, or when asked to audit.

## Checklist

### Architecture
- [ ] Screens under 200 lines
- [ ] No raw Firestore calls in screens or components
- [ ] Zustand store follows subscribe/unsubscribe pattern
- [ ] New stores registered in App.js

### Offline Safety
- [ ] All writes use `offlineFirestore.js` wrappers
- [ ] Optimistic local state updates before async calls
- [ ] try/catch around all async operations
- [ ] Toast feedback on success and error

### Brand Compliance
- [ ] Colors from `src/theme/colors.js` — no hardcoded hex
- [ ] Fonts from `src/theme/typography.js` — DM Sans primary, JetBrains Mono data
- [ ] Spacing from `src/theme/spacing.js` — base-8 scale
- [ ] Touch targets minimum 48px
- [ ] Dark theme: midnight background, charcoal cards

### React Native
- [ ] StyleSheet.create() at file bottom (not inline styles)
- [ ] FlatList for lists (not ScrollView + map)
- [ ] useMemo/useCallback for expensive computations and callbacks
- [ ] ErrorBoundary wrapping in navigation stacks
- [ ] SafeAreaView for root screens

### Data Integrity
- [ ] Money in cents (integers)
- [ ] Firestore paths scoped to `users/{userId}/`
- [ ] Timestamps as ISO strings
- [ ] No PII in console.log
