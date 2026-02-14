import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJobsStore } from '../../stores/jobsStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useRouteStore } from '../../stores/routeStore';
import { useAuthStore } from '../../stores/authStore';
import { colors, typeScale, spacing } from '../../theme';
import { resolveJobCoordinates } from '../../utils/routeUtils';
import { openInMaps } from '../../utils/mapUtils';
import JobCard from '../../components/jobs/JobCard';
import JobMapView from '../../components/maps/JobMapView';
import RouteSummaryCard from '../../components/maps/RouteSummaryCard';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import { scheduleDailyJobReminder } from '../../services/notificationService';
import SyncStatusBadge from '../../components/ui/SyncStatusBadge';

export default function TodayJobsScreen({ navigation }) {
  const loading = useJobsStore((s) => s.loading);
  const jobs = useJobsStore((s) => s.jobs);
  const clients = useClientsStore((s) => s.clients);
  const getClientById = useClientsStore((s) => s.getClientById);
  const userId = useAuthStore((s) => s.userId);

  const optimizedJobs = useRouteStore((s) => s.optimizedJobs);
  const totalDistance = useRouteStore((s) => s.totalDistance);
  const activeJobIndex = useRouteStore((s) => s.activeJobIndex);
  const isOptimizing = useRouteStore((s) => s.isOptimizing);

  const [viewMode, setViewMode] = useState('list');
  const [refreshing, setRefreshing] = useState(false);

  const todayJobs = useMemo(() => {
    const today = new Date().toDateString();
    return jobs.filter((job) => {
      if (job.archived) return false;
      const isToday = job.start && new Date(job.start).toDateString() === today;
      const isInProgress = job.status === 'In Progress';
      const isScheduledToday = isToday && (job.status === 'Scheduled' || job.status === 'In Progress');
      return isScheduledToday || isInProgress;
    });
  }, [jobs]);

  /** Build clientId → client lookup for coordinate resolution. */
  const clientsMap = useMemo(() => {
    const map = {};
    for (const c of clients) map[c.id] = c;
    return map;
  }, [clients]);

  /** Jobs with resolved GPS coordinates for the map. */
  const mappableJobs = useMemo(() => {
    return todayJobs
      .map((job) => {
        const coords = resolveJobCoordinates(job, clientsMap);
        if (!coords) return null;
        const client = getClientById(job.clientId);
        const snap = job.propertySnapshot;
        const address = snap
          ? [snap.street1, snap.city].filter(Boolean).join(', ')
          : client?.address || '';
        return { ...job, lat: coords.lat, lng: coords.lng, clientName: client?.name, address };
      })
      .filter(Boolean);
  }, [todayJobs, clientsMap, getClientById]);

  const unroutableCount = todayJobs.length - mappableJobs.length;

  useEffect(() => {
    scheduleDailyJobReminder(todayJobs.length);
  }, [todayJobs.length]);

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    useJobsStore.getState().subscribe(userId);
    setTimeout(() => setRefreshing(false), 800);
  }, [userId]);

  const handlePlanRoute = useCallback(() => {
    useRouteStore.getState().planRoute(todayJobs, clientsMap);
  }, [todayJobs, clientsMap]);

  const handleJobPress = useCallback((job) => {
    navigation.navigate('JobDetail', { jobId: job.id });
  }, [navigation]);

  const handleNavigatePress = useCallback((job) => {
    openInMaps(job.lat, job.lng, job.title);
  }, []);

  const renderItem = useCallback(({ item }) => {
    const client = getClientById(item.clientId);
    return (
      <JobCard
        job={item}
        clientName={client?.name || 'Unknown Client'}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      />
    );
  }, [getClientById, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.headerTitle}>Today's Jobs</Text>
        <LoadingSkeleton count={4} variant="card" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header row with view toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Today's Jobs</Text>
        <View style={styles.headerActions}>
          {viewMode === 'map' && mappableJobs.length > 0 && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handlePlanRoute}
              activeOpacity={0.7}
              disabled={isOptimizing}
            >
              <Ionicons
                name="navigate-outline"
                size={20}
                color={isOptimizing ? colors.muted : colors.trellio}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setViewMode((m) => (m === 'list' ? 'map' : 'list'))}
            activeOpacity={0.7}
          >
            <Ionicons
              name={viewMode === 'list' ? 'map-outline' : 'list-outline'}
              size={20}
              color={colors.trellio}
            />
          </TouchableOpacity>
        </View>
      </View>

      <SyncStatusBadge />
      <Text style={styles.count}>
        {todayJobs.length} {todayJobs.length === 1 ? 'job' : 'jobs'} scheduled
      </Text>

      {viewMode === 'list' ? (
        <FlatList
          data={todayJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={todayJobs.length === 0 ? styles.emptyList : styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No jobs today"
              message="No jobs are scheduled for today. Enjoy the downtime!"
            />
          }
        />
      ) : (
        <View style={styles.mapContainer}>
          <JobMapView
            jobs={optimizedJobs.length > 0 ? optimizedJobs : mappableJobs}
            optimizedRoute={optimizedJobs.length > 1 ? optimizedJobs : undefined}
            onJobPress={handleJobPress}
            onNavigatePress={handleNavigatePress}
          />
          {optimizedJobs.length > 0 && (
            <RouteSummaryCard
              optimizedJobs={optimizedJobs}
              totalDistance={totalDistance}
              activeJobIndex={activeJobIndex}
              unroutableCount={unroutableCount}
              onJobPress={handleJobPress}
              onAdvance={() => useRouteStore.getState().advanceToNext()}
            />
          )}
          {optimizedJobs.length === 0 && mappableJobs.length === 0 && (
            <View style={styles.noMapData}>
              <Ionicons name="location-outline" size={32} color={colors.muted} />
              <Text style={styles.noMapText}>No jobs with GPS coordinates</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
  },
  headerTitle: { ...typeScale.h1, color: colors.white },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: colors.charcoal, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.slate,
  },
  count: {
    ...typeScale.bodySm, color: colors.muted,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md, marginTop: 4,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyList: { flex: 1 },
  separator: { height: spacing.sm },
  mapContainer: { flex: 1 },
  noMapData: {
    position: 'absolute', top: '40%', alignSelf: 'center', alignItems: 'center',
  },
  noMapText: { ...typeScale.bodySm, color: colors.muted, marginTop: spacing.sm },
});
