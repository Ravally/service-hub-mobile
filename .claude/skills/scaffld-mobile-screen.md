# scaffld-mobile-screen

Build React Native screens for Scaffld Mobile following existing patterns and brand tokens.

## When to Use
Creating new screens, modifying screen layouts, adding navigation routes, building list/detail views.

## Rules
1. Import colors, typeScale, spacing, fonts from `../../theme`
2. Use Zustand stores for data — never raw Firestore calls in screens
3. Wrap exported screens with `withErrorBoundary()` in the navigation stack
4. All async operations in try/catch with `useUiStore.showToast()` feedback
5. Touch targets minimum 48px (minHeight: 48)
6. Use `StyleSheet.create()` at bottom of file
7. Max 200 lines per screen — extract sub-components if needed
8. Background color: `colors.midnight`, card backgrounds: `colors.charcoal`

## Screen Template
```jsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, typeScale, spacing } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function XxxScreen({ route, navigation }) {
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Screen content */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
});
```

## Navigation Registration
Add to the relevant stack navigator in `src/navigation/`:
```jsx
const SafeXxx = withErrorBoundary(XxxScreen);
<Stack.Screen name="Xxx" component={SafeXxx} options={{ title: 'Xxx' }} />
```
