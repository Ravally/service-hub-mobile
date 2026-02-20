import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../theme';

export default function ClampQuickChips({ chips = [], onSelect, disabled = false }) {
  if (chips.length === 0) return null;

  return (
    <View style={styles.container}>
      {chips.map((chip) => (
        <TouchableOpacity
          key={chip}
          style={[styles.chip, disabled && styles.chipDisabled]}
          onPress={() => onSelect(chip)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.chipText}>{chip}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.clampSoft,
    borderWidth: 1,
    borderColor: colors.clampBorder,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipDisabled: { opacity: 0.4 },
  chipText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 13,
    color: colors.clamp,
  },
});
