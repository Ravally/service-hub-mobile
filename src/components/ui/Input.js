import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../theme';

export default function Input({ label, error, style, inputStyle, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
          inputStyle,
        ]}
        placeholderTextColor={colors.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.midnight,
    borderWidth: 1,
    borderColor: colors.slate,
    borderRadius: 10,
    padding: spacing.md,
    minHeight: 48,
    color: colors.white,
    fontFamily: fonts.primary.regular,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: colors.trellio,
  },
  inputError: {
    borderColor: colors.coral,
  },
  errorText: {
    color: colors.coral,
    fontFamily: fonts.primary.regular,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
