const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a single form field value against its definition.
 * Returns an error message string, or null if valid.
 */
export function validateField(field, value) {
  const { type, required, validation } = field;

  // Required check
  if (required) {
    if (value === undefined || value === null || value === '') return 'This field is required';
    if (type === 'multiselect' && Array.isArray(value) && value.length === 0) return 'Select at least one option';
  }

  // Skip further checks if empty and not required
  if (value === undefined || value === null || value === '') return null;

  const v = validation || {};

  switch (type) {
    case 'text':
    case 'textarea': {
      const str = String(value);
      if (v.minLength && str.length < v.minLength) return `Minimum ${v.minLength} characters`;
      if (v.maxLength && str.length > v.maxLength) return `Maximum ${v.maxLength} characters`;
      if (v.pattern) {
        try { if (!new RegExp(v.pattern).test(str)) return v.message || 'Invalid format'; } catch { /* ignore bad regex */ }
      }
      return null;
    }
    case 'email':
      return EMAIL_REGEX.test(String(value)) ? null : 'Enter a valid email address';
    case 'phone':
      return String(value).replace(/\D/g, '').length >= 7 ? null : 'Enter a valid phone number';
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return 'Enter a valid number';
      if (v.min !== undefined && v.min !== null && num < v.min) return `Minimum value is ${v.min}`;
      if (v.max !== undefined && v.max !== null && num > v.max) return `Maximum value is ${v.max}`;
      return null;
    }
    default:
      return null;
  }
}

/**
 * Validate all fields in a form.
 * Returns { valid: boolean, errors: { [fieldId]: errorMessage } }
 */
export function validateForm(fields, responses) {
  const errors = {};
  for (const field of fields) {
    if (field.type === 'section_header') continue;
    const error = validateField(field, responses[field.id]);
    if (error) errors[field.id] = error;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
