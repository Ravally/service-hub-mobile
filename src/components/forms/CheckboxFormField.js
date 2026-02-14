import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, spacing } from '../../theme';

export default function CheckboxFormField({ field, value, error, onChange }) {
  const checked = !!value;

  return (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={() => onChange(!checked)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={checked ? 'checkbox' : 'square-outline'}
          size={24}
          color={checked ? colors.trellio : colors.muted}
        />
        <Text style={styles.label}>
          {field.label}{field.required ? ' *' : ''}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, marginBottom: spacing.md },
  label: { ...typeScale.body, color: colors.white, marginLeft: spacing.sm, flex: 1 },
  error: { color: colors.coral, fontSize: 12, marginTop: -8, marginBottom: spacing.md },
});
