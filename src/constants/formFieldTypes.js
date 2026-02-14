/**
 * Form Field Type Definitions (shared with web app)
 */

export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  EMAIL: 'email',
  PHONE: 'phone',
  DATE: 'date',
  TIME: 'time',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  PHOTO: 'photo',
  SIGNATURE: 'signature',
  SECTION_HEADER: 'section_header',
};

export const FIELD_TYPE_METADATA = {
  [FIELD_TYPES.TEXT]: {
    label: 'Text Input',
    description: 'Single line text input',
    supportsValidation: true,
    supportsPlaceholder: true,
  },
  [FIELD_TYPES.NUMBER]: {
    label: 'Number',
    description: 'Numeric input with min/max validation',
    supportsValidation: true,
    supportsPlaceholder: true,
  },
  [FIELD_TYPES.EMAIL]: {
    label: 'Email',
    description: 'Email address with validation',
    supportsValidation: true,
    supportsPlaceholder: true,
  },
  [FIELD_TYPES.PHONE]: {
    label: 'Phone Number',
    description: 'Phone number input',
    supportsValidation: true,
    supportsPlaceholder: true,
  },
  [FIELD_TYPES.DATE]: {
    label: 'Date',
    description: 'Date picker',
    supportsValidation: true,
    supportsPlaceholder: false,
  },
  [FIELD_TYPES.TIME]: {
    label: 'Time',
    description: 'Time picker',
    supportsValidation: false,
    supportsPlaceholder: false,
  },
  [FIELD_TYPES.TEXTAREA]: {
    label: 'Long Text',
    description: 'Multi-line text area',
    supportsValidation: true,
    supportsPlaceholder: true,
  },
  [FIELD_TYPES.SELECT]: {
    label: 'Dropdown',
    description: 'Single selection dropdown',
    supportsValidation: false,
    supportsPlaceholder: false,
    requiresOptions: true,
  },
  [FIELD_TYPES.MULTISELECT]: {
    label: 'Multi-Select',
    description: 'Multiple selection checkboxes',
    supportsValidation: false,
    supportsPlaceholder: false,
    requiresOptions: true,
  },
  [FIELD_TYPES.CHECKBOX]: {
    label: 'Checkbox',
    description: 'Single checkbox (yes/no)',
    supportsValidation: false,
    supportsPlaceholder: false,
  },
  [FIELD_TYPES.RADIO]: {
    label: 'Radio Buttons',
    description: 'Single selection radio buttons',
    supportsValidation: false,
    supportsPlaceholder: false,
    requiresOptions: true,
  },
  [FIELD_TYPES.PHOTO]: {
    label: 'Photo Upload',
    description: 'Photo capture or upload',
    supportsValidation: false,
    supportsPlaceholder: false,
  },
  [FIELD_TYPES.SIGNATURE]: {
    label: 'Signature',
    description: 'Digital signature capture',
    supportsValidation: false,
    supportsPlaceholder: false,
  },
  [FIELD_TYPES.SECTION_HEADER]: {
    label: 'Section Header',
    description: 'Visual section divider with title',
    supportsValidation: false,
    supportsPlaceholder: false,
  },
};

export const DEFAULT_VALIDATION = {
  [FIELD_TYPES.TEXT]: { minLength: null, maxLength: 255, pattern: null },
  [FIELD_TYPES.NUMBER]: { min: null, max: null, decimals: 0 },
  [FIELD_TYPES.EMAIL]: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', message: 'Please enter a valid email address' },
  [FIELD_TYPES.PHONE]: { pattern: null, message: 'Please enter a valid phone number' },
  [FIELD_TYPES.DATE]: { minDate: null, maxDate: null },
  [FIELD_TYPES.TEXTAREA]: { minLength: null, maxLength: 2000 },
};

export const TEMPLATE_TYPES = {
  JOB_FORM: 'job_form',
  CHECKLIST: 'checklist',
  INSPECTION: 'inspection',
  SITE_SURVEY: 'site_survey',
  WORK_ORDER: 'work_order',
};

export const TEMPLATE_TYPE_METADATA = {
  [TEMPLATE_TYPES.JOB_FORM]: { label: 'Job Form', description: 'General purpose job completion form' },
  [TEMPLATE_TYPES.CHECKLIST]: { label: 'Checklist', description: 'Task checklist for standardized procedures' },
  [TEMPLATE_TYPES.INSPECTION]: { label: 'Inspection', description: 'Detailed inspection form with photos' },
  [TEMPLATE_TYPES.SITE_SURVEY]: { label: 'Site Survey', description: 'On-site assessment and measurements' },
  [TEMPLATE_TYPES.WORK_ORDER]: { label: 'Work Order', description: 'Detailed work order with materials and labor' },
};

export function getFieldTypesRequiringOptions() {
  return Object.keys(FIELD_TYPE_METADATA).filter(
    (type) => FIELD_TYPE_METADATA[type].requiresOptions
  );
}

export function validateFieldConfig(field) {
  const errors = [];
  if (!field.type || !FIELD_TYPES[field.type.toUpperCase()]) {
    errors.push('Invalid field type');
  }
  if (!field.label || field.label.trim() === '') {
    errors.push('Field label is required');
  }
  const metadata = FIELD_TYPE_METADATA[field.type];
  if (metadata?.requiresOptions && (!field.options || field.options.length === 0)) {
    errors.push(`${metadata.label} requires at least one option`);
  }
  return { valid: errors.length === 0, errors };
}
