import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ClampIcon from './ClampIcon';
import { colors, fonts, spacing } from '../../theme';

export default function ClampActionCard({ card, onNavigate }) {
  if (!card) return null;

  const label = card.label || `Go to ${card.view || 'dashboard'}`;

  return (
    <View style={styles.container}>
      <ClampIcon size={14} color={colors.clamp} />
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onNavigate(card)}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.clampSoft,
    borderWidth: 1,
    borderColor: colors.clampBorder,
    borderRadius: 12,
    padding: 10,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 12,
    color: colors.clamp,
    flex: 1,
  },
  button: {
    backgroundColor: colors.clamp,
    borderRadius: 20,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 12,
    color: colors.midnight,
  },
});
