/**
 * Input validation utilities
 */

export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function isPositive(value) {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

export function isNonNegative(value) {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

export function isLengthValid(value, min = 0, max = Infinity) {
  if (!value) return min === 0;
  const length = value.length;
  return length >= min && length <= max;
}

export function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isFutureDate(date) {
  if (!date) return false;
  return new Date(date) > new Date();
}

export function isPastDate(date) {
  if (!date) return false;
  return new Date(date) < new Date();
}

export function isValidPercentage(value) {
  const num = Number(value);
  return !isNaN(num) && num >= 0 && num <= 100;
}
