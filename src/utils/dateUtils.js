/**
 * Date manipulation and range calculation utilities
 */

export function inRange(date, start, end) {
  if (!start || !end) return true;
  const d = new Date(date || 0);
  return d >= start && d <= end;
}

export function lastNDays(n) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - n);
  return { start, end: now };
}

export function last30ExcludingToday() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return { start, end };
}

export function monthRange(offset = 0) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function yearRange(year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

export function periodRange(period, customRange = {}) {
  switch (period) {
    case 'this_month': return monthRange(0);
    case 'last_month': return monthRange(-1);
    case 'this_year': return yearRange(new Date().getFullYear());
    case 'last_year': return yearRange(new Date().getFullYear() - 1);
    case 'last_7_days': return lastNDays(7);
    case 'last_30_days': return lastNDays(30);
    case 'last_90_days': return lastNDays(90);
    case 'custom':
      return {
        start: customRange.start ? new Date(customRange.start) : null,
        end: customRange.end ? new Date(customRange.end) : null,
      };
    default: return { start: null, end: null };
  }
}

export function getPreviousRange(start, end) {
  const duration = end - start;
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { start: prevStart, end: prevEnd };
}

export function rangeLabel(period, customRange = {}) {
  switch (period) {
    case 'this_month': return 'This Month';
    case 'last_month': return 'Last Month';
    case 'this_year': return 'This Year';
    case 'last_year': return 'Last Year';
    case 'last_7_days': return 'Last 7 Days';
    case 'last_30_days': return 'Last 30 Days';
    case 'last_90_days': return 'Last 90 Days';
    case 'custom':
      if (customRange.start && customRange.end) {
        return `${new Date(customRange.start).toLocaleDateString()} - ${new Date(customRange.end).toLocaleDateString()}`;
      }
      return 'Custom Range';
    case 'all':
    default: return 'All Time';
  }
}

export function daysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
