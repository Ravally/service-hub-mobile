/**
 * Scaffld brand color tokens for React Native
 * Source: brand/tokens.json
 */

export const colors = {
  // Primary
  scaffld: '#0EA5A0',
  scaffldDeep: '#087F7A',
  scaffldLight: '#B2F0ED',
  scaffldGlow: 'rgba(14, 165, 160, 0.2)',
  scaffldSubtle: 'rgba(14, 165, 160, 0.08)',

  // Clamp (AI assistant)
  clamp: '#F59E0B',
  clampDeep: '#D97706',
  clampSoft: 'rgba(245, 158, 11, 0.10)',
  clampBorder: 'rgba(245, 158, 11, 0.25)',
  clampHover: 'rgba(245, 158, 11, 0.20)',

  // Accent
  coral: '#F7845E',
  coralDeep: '#E56840',
  coralLight: '#FFDCC8',
  amber: '#FFAA5C',
  amberDeep: '#FF9633',
  amberLight: '#FFE8CC',

  // Neutrals
  midnight: '#0C1220',
  charcoal: '#1A2332',
  slate: '#2D3B4E',
  muted: '#6B7F96',
  silver: '#A3B4C8',
  white: '#FFFFFF',
  cream: '#FFF9F5',

  // Semantic
  success: '#0EA5A0',
  warning: '#FFAA5C',
  error: '#F7845E',
  info: '#B2F0ED',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderMedium: 'rgba(255, 255, 255, 0.15)',
  borderFocus: '#0EA5A0',
};

/** Convert hex to rgba */
export function withOpacity(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Status color map for React Native (replaces Tailwind-based STATUS_COLORS) */
export const STATUS_COLORS_RN = {
  Draft: { bg: '#1A2332', text: '#FFAA5C', border: 'rgba(255,170,92,0.2)' },
  Sent: { bg: '#1A2332', text: '#60A5FA', border: 'rgba(59,130,246,0.2)' },
  'Awaiting Approval': { bg: '#1A2332', text: '#FFAA5C', border: 'rgba(255,170,92,0.3)' },
  Approved: { bg: 'rgba(14,165,160,0.1)', text: '#0EA5A0', border: 'rgba(14,165,160,0.3)' },
  Converted: { bg: 'rgba(168,85,247,0.1)', text: '#C084FC', border: 'rgba(168,85,247,0.2)' },
  Archived: { bg: '#1A2332', text: '#6B7F96', border: 'rgba(45,59,78,0.3)' },
  Unpaid: { bg: '#1A2332', text: '#FFAA5C', border: 'rgba(255,170,92,0.3)' },
  'Partially Paid': { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', border: 'rgba(59,130,246,0.2)' },
  Paid: { bg: 'rgba(14,165,160,0.1)', text: '#0EA5A0', border: 'rgba(14,165,160,0.3)' },
  Overdue: { bg: 'rgba(247,132,94,0.1)', text: '#F7845E', border: 'rgba(247,132,94,0.3)' },
  Void: { bg: '#1A2332', text: '#6B7F96', border: 'rgba(45,59,78,0.3)' },
  Unscheduled: { bg: '#1A2332', text: '#A3B4C8', border: 'rgba(45,59,78,0.3)' },
  Scheduled: { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', border: 'rgba(59,130,246,0.2)' },
  'In Progress': { bg: 'rgba(255,170,92,0.1)', text: '#FFAA5C', border: 'rgba(255,170,92,0.3)' },
  Completed: { bg: 'rgba(14,165,160,0.1)', text: '#0EA5A0', border: 'rgba(14,165,160,0.3)' },
  Active: { bg: 'rgba(14,165,160,0.1)', text: '#0EA5A0', border: 'rgba(14,165,160,0.3)' },
  Inactive: { bg: '#1A2332', text: '#6B7F96', border: 'rgba(45,59,78,0.3)' },
  Lead: { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', border: 'rgba(59,130,246,0.2)' },
};
