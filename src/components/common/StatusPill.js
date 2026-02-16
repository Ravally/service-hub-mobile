import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../theme';

const STATUS_PILL_COLORS = {
  Draft: { bg: 'rgba(255,255,255,0.1)', text: '#A3B4C8' },
  Sent: { bg: 'rgba(14,165,160,0.15)', text: '#0EA5A0' },
  Pending: { bg: 'rgba(14,165,160,0.15)', text: '#0EA5A0' },
  'Awaiting Payment': { bg: 'rgba(14,165,160,0.15)', text: '#0EA5A0' },
  'Awaiting Approval': { bg: 'rgba(14,165,160,0.15)', text: '#0EA5A0' },
  Approved: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  Paid: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  Completed: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
  'Changes Requested': { bg: 'rgba(247,132,94,0.15)', text: '#F7845E' },
  Overdue: { bg: 'rgba(247,132,94,0.15)', text: '#F7845E' },
  Declined: { bg: 'rgba(247,132,94,0.15)', text: '#F7845E' },
  Late: { bg: 'rgba(247,132,94,0.15)', text: '#F7845E' },
  Active: { bg: 'rgba(255,170,92,0.15)', text: '#FFAA5C' },
  Today: { bg: 'rgba(255,170,92,0.15)', text: '#FFAA5C' },
  'In Progress': { bg: 'rgba(255,170,92,0.15)', text: '#FFAA5C' },
  Scheduled: { bg: 'rgba(255,170,92,0.15)', text: '#FFAA5C' },
  Archived: { bg: 'rgba(163,180,200,0.1)', text: '#6B7F95' },
  Converted: { bg: 'rgba(163,180,200,0.1)', text: '#6B7F95' },
  Void: { bg: 'rgba(163,180,200,0.1)', text: '#6B7F95' },
  Unpaid: { bg: 'rgba(255,170,92,0.15)', text: '#FFAA5C' },
  'Partially Paid': { bg: 'rgba(14,165,160,0.15)', text: '#0EA5A0' },
};

const FALLBACK = { bg: 'rgba(255,255,255,0.1)', text: '#A3B4C8' };

export default function StatusPill({ status, style }) {
  const color = STATUS_PILL_COLORS[status] || FALLBACK;

  return (
    <View style={[styles.pill, { backgroundColor: color.bg }, style]}>
      <Text style={[styles.text, { color: color.text }]}>
        {status}
      </Text>
    </View>
  );
}

export { STATUS_PILL_COLORS };

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.data.medium,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
