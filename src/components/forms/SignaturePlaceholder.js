import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, fonts, spacing } from '../../theme';

export default function SignaturePlaceholder({ field }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>
      <View style={styles.box}>
        <Ionicons name="create-outline" size={24} color={colors.muted} />
        <Text style={styles.text}>Signature capture coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.xs },
  box: { backgroundColor: colors.midnight, borderWidth: 1, borderColor: colors.slate, borderRadius: 10, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  text: { ...typeScale.bodySm, color: colors.muted, marginTop: spacing.xs },
});
