import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../theme';

export default function SectionHeader({ field }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{field.label}</Text>
      {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.md, marginBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.slate, paddingBottom: spacing.sm },
  title: { fontFamily: fonts.primary.semiBold, fontSize: 16, color: colors.white },
  help: { fontFamily: fonts.primary.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
});
