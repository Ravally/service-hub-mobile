import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../theme';
import { mediumImpact } from '../../utils/haptics';

const VARIANTS = {
  primary: { bg: colors.trellio, text: colors.white },
  secondary: { bg: colors.charcoal, text: colors.silver, border: colors.slate },
  danger: { bg: colors.coral, text: colors.white },
  ghost: { bg: 'transparent', text: colors.trellio, border: colors.slate },
};

export default function Button({
  title, onPress, variant = 'primary', loading = false,
  disabled = false, style,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: v.bg },
        v.border && { borderWidth: 1, borderColor: v.border },
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={() => { mediumImpact(); onPress?.(); }}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 16,
  },
  disabled: { opacity: 0.6 },
});
