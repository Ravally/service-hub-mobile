import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../../stores/uiStore';
import { colors, fonts, spacing } from '../../theme';

const TYPE_COLORS = {
  success: { bg: 'rgba(14,165,160,0.95)', text: colors.white },
  error: { bg: 'rgba(247,132,94,0.95)', text: colors.white },
  warning: { bg: 'rgba(255,170,92,0.95)', text: colors.midnight },
};

export default function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + spacing.sm }]}>
      {toasts.map((toast) => {
        const typeColor = TYPE_COLORS[toast.type] || TYPE_COLORS.success;
        return (
          <TouchableOpacity
            key={toast.id}
            style={[styles.toast, { backgroundColor: typeColor.bg }]}
            onPress={() => dismissToast(toast.id)}
            activeOpacity={0.9}
          >
            <Text style={[styles.text, { color: typeColor.text }]}>
              {toast.message}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.primary.medium,
    fontSize: 14,
  },
});
