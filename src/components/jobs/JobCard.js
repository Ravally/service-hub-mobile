import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, fonts, spacing } from '../../theme';
import Badge from '../ui/Badge';

function formatTimeRange(start, end) {
  const fmt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const s = fmt(start);
  const e = fmt(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  return '';
}

function getAddress(job) {
  const snap = job.propertySnapshot;
  if (snap) {
    return [snap.street1, snap.city].filter(Boolean).join(', ') || snap.label || '';
  }
  return '';
}

export default function JobCard({ job, clientName, onPress }) {
  const timeStr = formatTimeRange(job.start, job.end);
  const address = getAddress(job);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <Badge status={job.status} />
        {timeStr ? (
          <Text style={styles.time}>{timeStr}</Text>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={1}>{job.title || 'Untitled Job'}</Text>

      {clientName ? (
        <View style={styles.row}>
          <Ionicons name="person-outline" size={14} color={colors.muted} />
          <Text style={styles.meta} numberOfLines={1}>{clientName}</Text>
        </View>
      ) : null}

      {address ? (
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.meta} numberOfLines={1}>{address}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minHeight: 80,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  time: {
    fontFamily: fonts.data.regular,
    fontSize: 13,
    color: colors.silver,
    letterSpacing: 0.3,
  },
  title: {
    ...typeScale.h4,
    color: colors.white,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  meta: {
    ...typeScale.bodySm,
    color: colors.muted,
    marginLeft: 6,
    flex: 1,
  },
});
