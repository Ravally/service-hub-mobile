import React from 'react';
import Input from '../ui/Input';

const KEYBOARD_MAP = {
  text: 'default',
  email: 'email-address',
  phone: 'phone-pad',
  textarea: 'default',
};

export default function TextFormField({ field, value, error, onChange }) {
  const isMultiline = field.type === 'textarea';

  return (
    <Input
      label={field.label + (field.required ? ' *' : '')}
      placeholder={field.placeholder || ''}
      value={value || ''}
      onChangeText={onChange}
      error={error}
      keyboardType={KEYBOARD_MAP[field.type] || 'default'}
      autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
      multiline={isMultiline}
      numberOfLines={isMultiline ? 4 : 1}
      inputStyle={isMultiline ? { minHeight: 100, textAlignVertical: 'top' } : undefined}
    />
  );
}
