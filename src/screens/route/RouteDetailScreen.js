import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouteStore } from '../../stores/routeStore';
import { useJobsStore } from '../../stores/jobsStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { formatDistance } from '../../utils/routeUtils';
import { openInMaps, openRouteInMaps } from '../../utils/mapUtils';
import JobMapView from '../../components/maps/JobMapView';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function RouteDetailScreen({ navigation }) {
  const optimizedJobs = useRouteStore((s) => s.optimizedJobs);
  const totalDistance = useRouteStore((s) => s.totalDistance);
  const activeJobIndex = useRouteStore((s) => s.activeJobIndex);
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);

  const activeJob = optimizedJobs[activeJobIndex];

  const handleNavigateAll = useCallback(() => {
    const waypoints = optimizedJobs.map((j) => ({ lat: j.lat, lng: j.lng }));
    openRouteInMaps(waypoints);
  }, [optimizedJobs]);

  const handleNavigateNext = useCallback(() => {
    if (activeJob) openInMaps(activeJob.lat, activeJob.lng, activeJob.title);
  }, [activeJob]);

  const handleCompleteJob = useCallback(async (job) => {
    try {
      await useJobsStore.getState().updateJobStatus(userId, job.id, 'Completed');
      useRouteStore.getState().advanceToNext();
      showToast('Job marked complete', 'success');
    } catch {
      showToast('Failed to update status', 'error');
    }
  }, [userId, showToast]);

  const handleJobPress = useCallback((job) => {
    navigation.navigate('JobDetail', { jobId: job.id });
  }, [navigation]);

  if (optimizedJobs.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['top']}>
        <Ionicons name="navigate-outline" size={48} color={colors.muted} />
        <Text style={styles.emptyText}>No route planned</Text>
        <Text style={styles.emptyHint}>Go to Today's Jobs and tap the route button</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map (top half) */}
      <View style={styles.mapSection}>
        <JobMapView
          jobs={optimizedJobs}
          optimizedRoute={optimizedJobs}
          onJobPress={handleJobPress}
          onNavigatePress={(job) => openInMaps(job.lat, job.lng, job.title)}
        />
      </View>

      {/* Route info + job list (bottom half) */}
      <View style={styles.listSection}>
        {/* Summary bar */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {optimizedJobs.length} stops  ·  {formatDistance(totalDistance)}
          </Text>
          <View style={styles.summaryActions}>
            <Button title="Navigate All" onPress={handleNavigateAll} style={styles.navBtn} />
            {activeJob && (
              <Button
                title="Next"
                variant="secondary"
                onPress={handleNavigateNext}
                style={styles.navBtn}
              />
            )}
          </View>
        </View>

        {/* Job list */}
        <ScrollView style={styles.jobList} contentContainerStyle={styles.jobListContent}>
          {optimizedJobs.map((job, i) => {
            const isActive = i === activeJobIndex;
            const isCompleted = job.status === 'Completed';
            return (
              <TouchableOpacity
                key={job.id}
                style={[styles.jobRow, isActive && styles.activeRow]}
                onPress={() => handleJobPress(job)}
                activeOpacity={0.7}
              >
                <View style={[styles.orderBadge, isCompleted && styles.completedBadge]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  ) : (
                    <Text style={styles.orderText}>{i + 1}</Text>
                  )}
                </View>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle} numberOfLines={1}>
                    {job.title || 'Untitled'}
                  </Text>
                  <View style={styles.jobMeta}>
                    {job.distanceFromPrev > 0 && (
                      <Text style={styles.jobDist}>{formatDistance(job.distanceFromPrev)}</Text>
                    )}
                    {job.address ? (
                      <Text style={styles.jobAddr} numberOfLines={1}>{job.address}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.jobActions}>
                  <Badge status={job.status} />
                  {!isCompleted && (
                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => handleCompleteJob(job)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark-circle-outline" size={22} color={colors.scaffld} />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  emptyContainer: {
    flex: 1, backgroundColor: colors.midnight,
    alignItems: 'center', justifyContent: 'center', padding: spacing.lg,
  },
  emptyText: { ...typeScale.h3, color: colors.muted, marginTop: spacing.md },
  emptyHint: { ...typeScale.bodySm, color: colors.muted, marginTop: spacing.sm, textAlign: 'center' },
  mapSection: { flex: 1 },
  listSection: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.charcoal },
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.slate,
  },
  summaryText: { fontFamily: fonts.data.medium, fontSize: 13, color: colors.silver },
  summaryActions: { flexDirection: 'row', gap: spacing.sm },
  navBtn: { paddingHorizontal: spacing.md, minHeight: 36, paddingVertical: 6 },
  jobList: { flex: 1 },
  jobListContent: { paddingBottom: spacing.xl },
  jobRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    paddingHorizontal: spacing.md, minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.slate,
  },
  activeRow: { backgroundColor: colors.scaffldSubtle },
  orderBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.scaffld,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  completedBadge: { backgroundColor: colors.muted },
  orderText: { fontFamily: fonts.data.bold, fontSize: 12, color: colors.white },
  jobInfo: { flex: 1, marginRight: spacing.sm },
  jobTitle: { ...typeScale.bodySm, color: colors.silver },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  jobDist: { fontFamily: fonts.data.regular, fontSize: 11, color: colors.scaffld },
  jobAddr: { ...typeScale.bodySm, color: colors.muted, fontSize: 11, flex: 1 },
  jobActions: { alignItems: 'flex-end', gap: 6 },
  completeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
