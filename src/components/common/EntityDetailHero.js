import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing, shadows } from '../../theme';
import StatusPill from './StatusPill';
import { formatCurrency } from '../../utils/formatters';

export default function EntityDetailHero({
  title,
  subtitle,
  status,
  amount,
  primaryAction,
  secondaryAction,
  onSubtitlePress,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <StatusPill status={status} />
        {amount != null && (
          <Text style={styles.amount}>{formatCurrency(amount)}</Text>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      {subtitle && (
        <TouchableOpacity
          disabled={!onSubtitlePress}
          onPress={onSubtitlePress}
          activeOpacity={0.7}
        >
          <Text style={[styles.subtitle, onSubtitlePress && styles.subtitleLink]}>
            {subtitle}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        {primaryAction && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={primaryAction.onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryText}>{primaryAction.label}</Text>
          </TouchableOpacity>
        )}
        {secondaryAction && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={secondaryAction.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryText}>{secondaryAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  amount: {
    fontFamily: fonts.primary.bold,
    fontSize: 24,
    color: colors.white,
  },
  title: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 20,
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  subtitleLink: {
    color: colors.scaffld,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.scaffld,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 16,
    color: colors.white,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.scaffld,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 16,
    color: colors.scaffld,
  },
});
