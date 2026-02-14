import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Input from '../ui/Input';
import { colors, fonts } from '../../theme';

export default function NumberFormField({ field, value, error, onChange }) {
  const v = field.validation || {};
  const hint = [
    v.min !== undefined && v.min !== null ? `Min: ${v.min}` : null,
    v.max !== undefined && v.max !== null ? `Max: ${v.max}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <Input
        label={field.label + (field.required ? ' *' : '')}
        placeholder={field.placeholder || ''}
        value={value !== undefined && value !== null ? String(value) : ''}
        onChangeText={onChange}
        error={error}
        keyboardType="numeric"
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  hint: { fontFamily: fonts.primary.regular, fontSize: 12, color: colors.muted, marginTop: -12, marginBottom: 12 },
});
