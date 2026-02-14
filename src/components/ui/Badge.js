import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS_RN, colors, fonts } from '../../theme';

export default function Badge({ status, style }) {
  const statusColors = STATUS_COLORS_RN[status] || {
    bg: colors.charcoal,
    text: colors.muted,
    border: colors.slate,
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusColors.bg,
          borderColor: statusColors.border,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: statusColors.text }]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    minWidth: 60,
    alignItems: 'center',
  },
  text: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
