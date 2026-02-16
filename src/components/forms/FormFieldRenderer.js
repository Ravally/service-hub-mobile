import React from 'react';
import TextFormField from './TextFormField';
import NumberFormField from './NumberFormField';
import DateFormField from './DateFormField';
import SelectFormField from './SelectFormField';
import MultiSelectFormField from './MultiSelectFormField';
import CheckboxFormField from './CheckboxFormField';
import PhotoFormField from './PhotoFormField';
import SignatureField from './SignatureField';
import SectionHeader from './SectionHeader';

const FIELD_MAP = {
  text: TextFormField,
  email: TextFormField,
  phone: TextFormField,
  textarea: TextFormField,
  number: NumberFormField,
  date: DateFormField,
  time: DateFormField,
  select: SelectFormField,
  radio: SelectFormField,
  multiselect: MultiSelectFormField,
  checkbox: CheckboxFormField,
  photo: PhotoFormField,
  signature: SignatureField,
  section_header: SectionHeader,
};

/**
 * Renders the correct form field component based on field.type.
 * Props: field, value, error, onChange
 */
export default function FormFieldRenderer({ field, value, error, onChange }) {
  const type = (field.type || '').toLowerCase();
  const Component = FIELD_MAP[type];

  if (!Component) return null;

  if (type === 'section_header') {
    return <Component field={field} />;
  }

  return <Component field={field} value={value} error={error} onChange={onChange} />;
}
