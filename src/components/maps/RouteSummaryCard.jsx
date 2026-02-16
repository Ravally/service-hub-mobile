import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { formatDistance } from '../../utils/routeUtils';
import { openInMaps, openRouteInMaps } from '../../utils/mapUtils';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

/**
 * Route summary card displayed below the map.
 *
 * @param {Array} optimizedJobs - ordered jobs with lat, lng, distanceFromPrev
 * @param {number} totalDistance - total route distance in km
 * @param {number} activeJobIndex - which job is "current"
 * @param {Function} onJobPress - navigate to job detail
 * @param {Function} onAdvance - advance to next job
 */
export default function RouteSummaryCard({
  optimizedJobs = [], totalDistance = 0, activeJobIndex = 0,
  onJobPress, onAdvance, unroutableCount = 0,
}) {
  if (optimizedJobs.length === 0) return null;

  const activeJob = optimizedJobs[activeJobIndex];

  const handleStartRoute = () => {
    const waypoints = optimizedJobs.map((j) => ({ lat: j.lat, lng: j.lng }));
    openRouteInMaps(waypoints);
  };

  const handleNextJob = () => {
    if (activeJob) openInMaps(activeJob.lat, activeJob.lng, activeJob.title);
    onAdvance?.();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stats}>
          <Text style={styles.statValue}>{optimizedJobs.length}</Text>
          <Text style={styles.statLabel}>stops</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stats}>
          <Text style={styles.statValue}>{formatDistance(totalDistance) || '—'}</Text>
          <Text style={styles.statLabel}>total</Text>
        </View>
        {unroutableCount > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.stats}>
              <Text style={[styles.statValue, { color: colors.amber }]}>{unroutableCount}</Text>
              <Text style={styles.statLabel}>no GPS</Text>
            </View>
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Navigate All" onPress={handleStartRoute} style={styles.actionBtn} />
        <Button title="Next Job" variant="secondary" onPress={handleNextJob} style={styles.actionBtn} />
      </View>

      {/* Job list */}
      <ScrollView style={styles.list} nestedScrollEnabled>
        {optimizedJobs.map((job, i) => (
          <TouchableOpacity
            key={job.id}
            style={[styles.jobRow, i === activeJobIndex && styles.activeRow]}
            onPress={() => onJobPress?.(job)}
            activeOpacity={0.7}
          >
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>{i + 1}</Text>
            </View>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle} numberOfLines={1}>{job.title || 'Untitled'}</Text>
              {job.distanceFromPrev > 0 && (
                <Text style={styles.jobDist}>
                  <Ionicons name="car-outline" size={11} color={colors.muted} />{' '}
                  {formatDistance(job.distanceFromPrev)}
                </Text>
              )}
            </View>
            <Badge status={job.status} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.charcoal, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderColor: colors.slate, borderBottomWidth: 0,
    paddingTop: spacing.md, maxHeight: 320,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  stats: { alignItems: 'center', paddingHorizontal: spacing.md },
  statValue: { fontFamily: fonts.data.bold, fontSize: 18, color: colors.white },
  statLabel: { fontFamily: fonts.data.regular, fontSize: 11, color: colors.muted, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.slate },
  actions: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  actionBtn: { flex: 1 },
  list: { paddingHorizontal: spacing.md },
  jobRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    minHeight: 48, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.slate,
  },
  activeRow: { backgroundColor: colors.scaffldSubtle, borderRadius: 10, paddingHorizontal: 8 },
  orderBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.scaffld,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  orderText: { fontFamily: fonts.data.bold, fontSize: 12, color: colors.white },
  jobInfo: { flex: 1, marginRight: spacing.sm },
  jobTitle: { ...typeScale.bodySm, color: colors.silver },
  jobDist: { ...typeScale.bodySm, color: colors.muted, fontSize: 11, marginTop: 2 },
});
