import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, spacing } from '../../theme';

export default function EmptyState({
  icon = 'document-text-outline',
  title = 'Nothing here yet',
  message,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={48} color={colors.muted} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typeScale.h4,
    color: colors.silver,
    marginTop: spacing.md,
  },
  message: {
    ...typeScale.bodySm,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
