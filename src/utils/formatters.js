/**
 * Utility functions for formatting values (currency, dates, etc.)
 */

export function formatCurrency(value, code = 'USD') {
  const num = Number(value || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code
    }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

export function formatDate(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString();
}

export function formatDateTime(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString();
}

export function toDateInput(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toISOString().slice(0, 10);
}

export function toIsoDate(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toISOString();
}

export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatNumber(value, decimals = 2) {
  const num = Number(value || 0);
  return num.toFixed(decimals);
}

export function formatCompactCurrency(value) {
  const num = Number(value || 0);
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return formatCurrency(num);
}
