import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJobsStore } from '../../stores/jobsStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useAuthStore } from '../../stores/authStore';
import { useDashboardSelectors, useCategorySections } from '../../stores/dashboardStore';
import { resolveJobCoordinates } from '../../utils/routeUtils';
import { formatCurrency } from '../../utils/formatters';
import { colors, typeScale, fonts, spacing, shadows } from '../../theme';
import StatusPill from '../../components/common/StatusPill';
import SyncStatusBadge from '../../components/ui/SyncStatusBadge';
import Card from '../../components/ui/Card';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import CategorySectionList from '../../components/home/CategorySectionList';

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatFriendlyDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(start, end) {
  if (!start || !end) return '';
  const ms = new Date(end) - new Date(start);
  const hrs = Math.round(ms / 3600000 * 10) / 10;
  return `${hrs}hr`;
}

export default function HomeScreen({ navigation }) {
  const loading = useJobsStore((s) => s.loading);
  const userId = useAuthStore((s) => s.userId);
  const getClientById = useClientsStore((s) => s.getClientById);
  const [refreshing, setRefreshing] = useState(false);

  const {
    todayJobs, todayRevenue, completedToday, nextUp, activeJob,
    timeTracked, weekStats, isAdmin,
  } = useDashboardSelectors();
  const categorySections = useCategorySections();

  // Live timer tick
  const [tick, setTick] = useState(0);
  const tickRef = useRef(null);
  useEffect(() => {
    if (timeTracked.hasActiveTimer) {
      tickRef.current = setInterval(() => setTick((t) => t + 1), 30000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timeTracked.hasActiveTimer]);

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    useJobsStore.getState().subscribe(userId);
    setTimeout(() => setRefreshing(false), 800);
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Home</Text>
        </View>
        <LoadingSkeleton count={4} variant="card" />
      </SafeAreaView>
    );
  }

  const displayJob = activeJob || nextUp;
  const clientName = displayJob ? (getClientById(displayJob.clientId)?.name || 'Client') : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.scaffld} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Home</Text>
          <SyncStatusBadge />
        </View>

        {/* SECTION 1: Daily Summary Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroDate}>{formatFriendlyDate()}</Text>
          <Text style={styles.heroRevenue}>
            {todayJobs.length} {todayJobs.length === 1 ? 'job' : 'jobs'} worth {formatCurrency(todayRevenue)}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: todayJobs.length > 0 ? `${(completedToday / todayJobs.length) * 100}%` : '0%' },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {completedToday} of {todayJobs.length} jobs completed
          </Text>
        </View>

        {/* SECTION 2: Map Preview */}
        <TouchableOpacity
          style={styles.mapPreview}
          onPress={() => navigation.navigate('Schedule')}
          activeOpacity={0.8}
        >
          <Ionicons name="map-outline" size={32} color={colors.scaffld} />
          <View style={styles.mapPreviewText}>
            <Text style={styles.mapTitle}>
              {todayJobs.length > 0 ? `${todayJobs.length} jobs on the map` : 'No jobs today'}
            </Text>
            <Text style={styles.mapSubtitle}>Tap to open schedule</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>

        {/* SECTION 3: Next Up / Active Card */}
        {displayJob ? (
          <TouchableOpacity
            style={styles.nextUpCard}
            onPress={() => navigation.navigate('JobDetail', { jobId: displayJob.id })}
            activeOpacity={0.8}
          >
            <Text style={styles.sectionLabel}>
              {activeJob ? 'IN PROGRESS' : 'NEXT UP'}
            </Text>
            <View style={styles.nextUpRow}>
              <View style={styles.nextUpInfo}>
                <Text style={styles.nextUpClient} numberOfLines={1}>{clientName}</Text>
                <Text style={styles.nextUpTitle} numberOfLines={1}>{displayJob.title}</Text>
                <Text style={styles.nextUpTime}>
                  {formatTime(displayJob.start)}
                  {displayJob.end ? ` – ${formatTime(displayJob.end)} (${formatDuration(displayJob.start, displayJob.end)})` : ''}
                </Text>
              </View>
              <View style={styles.nextUpRight}>
                {displayJob.total ? (
                  <Text style={styles.nextUpAmount}>{formatCurrency(displayJob.total)}</Text>
                ) : null}
                {activeJob && timeTracked.hasActiveTimer && (
                  <View style={styles.timerBadge}>
                    <View style={styles.timerDot} />
                    <Text style={styles.timerText}>{formatElapsed(timeTracked.totalSeconds)}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <Card style={styles.doneCard}>
            <Text style={styles.doneText}>You're all done for today!</Text>
            <Text style={styles.doneSubtext}>No more jobs scheduled.</Text>
          </Card>
        )}

        {/* SECTION 4: Category Sections (Jobber-style collapsible) */}
        {isAdmin && (
          <CategorySectionList sections={categorySections} navigation={navigation} />
        )}

        {/* SECTION 5: Quick Stats */}
        {isAdmin && weekStats && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={18} color={colors.scaffld} />
              <Text style={styles.statLabel}>This Week</Text>
              <Text style={styles.statValue}>{formatCurrency(weekStats.revenue)}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="hourglass-outline" size={18} color={colors.amber} />
              <Text style={styles.statLabel}>Outstanding</Text>
              <Text style={styles.statValue}>{formatCurrency(weekStats.outstanding)}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="briefcase-outline" size={18} color={colors.silver} />
              <Text style={styles.statLabel}>Active Jobs</Text>
              <Text style={styles.statValue}>{weekStats.activeJobs}</Text>
            </View>
          </View>
        )}

        {/* Time tracked card (all users) */}
        <Card style={styles.timeCard}>
          <View style={styles.timeRow}>
            <View>
              <Text style={styles.sectionLabel}>TIME TRACKED TODAY</Text>
              <Text style={styles.timeValue}>{formatElapsed(timeTracked.totalSeconds)}</Text>
            </View>
            {timeTracked.hasActiveTimer && (
              <View style={styles.timerActiveBadge}>
                <View style={styles.timerDot} />
                <Text style={styles.timerActiveText}>Timer running</Text>
              </View>
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing['2xl'] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  screenTitle: { ...typeScale.h1, color: colors.white },

  // Hero
  heroCard: {
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  heroDate: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
  },
  heroRevenue: {
    fontFamily: fonts.primary.bold,
    fontSize: 24,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.slate,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.scaffld,
    borderRadius: 4,
  },
  progressLabel: {
    fontFamily: fonts.primary.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },

  // Map preview
  mapPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  mapPreviewText: { flex: 1 },
  mapTitle: { fontFamily: fonts.primary.semiBold, fontSize: 14, color: colors.white },
  mapSubtitle: { fontFamily: fonts.primary.regular, fontSize: 12, color: colors.muted, marginTop: 2 },

  // Next Up
  nextUpCard: {
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.scaffldGlow,
    ...shadows.md,
  },
  nextUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nextUpInfo: { flex: 1, marginRight: spacing.sm },
  nextUpClient: { fontFamily: fonts.primary.semiBold, fontSize: 16, color: colors.white },
  nextUpTitle: { fontFamily: fonts.primary.regular, fontSize: 14, color: colors.silver, marginTop: 2 },
  nextUpTime: { fontFamily: fonts.data.regular, fontSize: 13, color: colors.muted, marginTop: 4 },
  nextUpRight: { alignItems: 'flex-end' },
  nextUpAmount: { fontFamily: fonts.primary.bold, fontSize: 18, color: colors.white },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(14,165,160,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.scaffld },
  timerText: { fontFamily: fonts.data.medium, fontSize: 12, color: colors.scaffld },

  // Done card
  doneCard: { marginBottom: spacing.sm, alignItems: 'center', paddingVertical: spacing.lg },
  doneText: { fontFamily: fonts.primary.semiBold, fontSize: 16, color: colors.white },
  doneSubtext: { fontFamily: fonts.primary.regular, fontSize: 14, color: colors.muted, marginTop: 4 },

  // Section label
  sectionLabel: {
    fontFamily: fonts.data.medium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.sm,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  statLabel: {
    fontFamily: fonts.data.medium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 4,
  },
  statValue: {
    fontFamily: fonts.primary.bold,
    fontSize: 16,
    color: colors.white,
    marginTop: 2,
  },

  // Time card
  timeCard: { marginBottom: spacing.sm },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeValue: { fontFamily: fonts.primary.bold, fontSize: 20, color: colors.white, marginTop: 4 },
  timerActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(14,165,160,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timerActiveText: { fontFamily: fonts.data.medium, fontSize: 12, color: colors.scaffld },
});
