import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJobsStore } from '../../stores/jobsStore';
import { useStaffStore } from '../../stores/staffStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing, shadows } from '../../theme';
import { formatCurrency } from '../../utils';
import { getCurrentLocation } from '../../services/location';
import { successNotification, mediumImpact } from '../../utils/haptics';
import StatusPill from '../../components/common/StatusPill';
import Card from '../../components/ui/Card';
import SyncStatusBadge from '../../components/ui/SyncStatusBadge';
import { scheduleTimerReminder, cancelTimerReminder } from '../../services/notificationService';

function formatElapsed(startIso) {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
  const h = String(Math.floor(diff / 3600)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const s = String(diff % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function ClockInOutScreen() {
  const { userId, userProfile } = useAuthStore();
  const jobs = useJobsStore((s) => s.jobs);
  const getJobById = useJobsStore((s) => s.getJobById);

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
  const staff = useStaffStore((s) => s.staff);
  const showToast = useUiStore((s) => s.showToast);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const timerRef = useRef(null);

  const currentStaffId = useMemo(() => {
    const match = staff.find(
      (s) => s.email === userProfile?.email || s.userId === userId,
    );
    return match?.id || userId;
  }, [staff, userProfile, userId]);

  const currentStaff = staff.find((s) => s.id === currentStaffId);

  const activeInfo = useMemo(() => {
    for (const job of todayJobs) {
      const entry = (job.laborEntries || []).find(
        (e) => e.staffId === currentStaffId && !e.end,
      );
      if (entry) return { jobId: job.id, entry };
    }
    return null;
  }, [todayJobs, currentStaffId]);

  useEffect(() => {
    if (activeInfo && selectedJobId !== activeInfo.jobId) {
      setSelectedJobId(activeInfo.jobId);
    }
  }, [activeInfo, selectedJobId]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeInfo?.entry) {
      setElapsed(formatElapsed(activeInfo.entry.start));
      timerRef.current = setInterval(() => {
        setElapsed(formatElapsed(activeInfo.entry.start));
      }, 1000);
    } else {
      setElapsed('00:00:00');
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeInfo?.entry?.start]);

  const selectedJob = selectedJobId ? getJobById(selectedJobId) : null;

  const handleClockIn = async () => {
    if (!selectedJobId) { showToast('Select a job first', 'warning'); return; }
    setIsProcessing(true);
    mediumImpact();
    try {
      const loc = await getCurrentLocation();
      setLocationStatus(loc ? 'captured' : 'denied');
      const newEntry = {
        id: `time_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        staffId: currentStaffId,
        staffName: currentStaff?.name || userProfile?.firstName || 'Staff',
        start: new Date().toISOString(),
        end: null,
        hours: 0,
        rate: currentStaff?.hourlyRate || 0,
        cost: 0,
        note: '',
        billable: true,
        createdAt: new Date().toISOString(),
        location: { clockIn: loc, clockOut: null },
      };
      const entries = [...(selectedJob?.laborEntries || []), newEntry];
      await useJobsStore.getState().updateJobLaborEntries(userId, selectedJobId, entries);
      scheduleTimerReminder();
      successNotification();
      showToast('Clocked in!', 'success');
    } catch {
      showToast('Failed to clock in', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeInfo) return;
    setIsProcessing(true);
    mediumImpact();
    try {
      const loc = await getCurrentLocation();
      setLocationStatus(loc ? 'captured' : 'denied');
      const now = new Date();
      const start = new Date(activeInfo.entry.start);
      const hours = Math.round(((now - start) / 3600000) * 100) / 100;
      const rate = activeInfo.entry.rate || 0;
      const cost = Math.round(hours * rate);

      const job = getJobById(activeInfo.jobId);
      const entries = (job?.laborEntries || []).map((e) =>
        e.id === activeInfo.entry.id
          ? {
              ...e,
              end: now.toISOString(),
              hours,
              cost,
              location: { ...e.location, clockOut: loc },
            }
          : e,
      );
      await useJobsStore.getState().updateJobLaborEntries(userId, activeInfo.jobId, entries);
      cancelTimerReminder();
      successNotification();
      showToast(`Clocked out — ${hours.toFixed(1)}h`, 'success');
    } catch {
      showToast('Failed to clock out', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const completedEntries = useMemo(() => {
    const entries = [];
    for (const job of todayJobs) {
      for (const e of job.laborEntries || []) {
        if (e.staffId === currentStaffId && e.end) {
          entries.push({ ...e, jobTitle: job.title });
        }
      }
    }
    return entries;
  }, [todayJobs, currentStaffId]);

  const totalHours = completedEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const totalCost = completedEntries.reduce((sum, e) => sum + (e.cost || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Timesheet</Text>
          <SyncStatusBadge />
        </View>

        {/* TIMER HERO */}
        <View style={[styles.timerCard, activeInfo && styles.timerCardActive]}>
          <View style={styles.timerStatusRow}>
            <View style={[styles.statusDot, activeInfo && styles.statusDotActive]} />
            <Text style={[styles.timerStatus, activeInfo && styles.timerStatusActive]}>
              {activeInfo ? 'CLOCKED IN' : 'NOT CLOCKED IN'}
            </Text>
          </View>
          <Text style={[styles.timerValue, activeInfo && styles.timerValueActive]}>{elapsed}</Text>
          {activeInfo && (
            <Text style={styles.timerInfo}>
              Started {new Date(activeInfo.entry.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}

          {/* Location Indicator */}
          {locationStatus && (
            <View style={styles.locationRow}>
              <Ionicons
                name={locationStatus === 'captured' ? 'location' : 'location-outline'}
                size={14}
                color={locationStatus === 'captured' ? colors.scaffld : colors.muted}
              />
              <Text style={[styles.locationText, locationStatus === 'captured' && styles.locationCaptured]}>
                {locationStatus === 'captured' ? 'GPS captured' : 'No location'}
              </Text>
            </View>
          )}
        </View>

        {/* CLOCK BUTTON */}
        {activeInfo ? (
          <TouchableOpacity
            style={styles.clockOutBtn}
            onPress={handleClockOut}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Ionicons name="stop-circle-outline" size={22} color={colors.coral} />
            <Text style={styles.clockOutText}>
              {isProcessing ? 'Clocking Out...' : 'Clock Out'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.clockInBtn, !selectedJobId && styles.clockBtnDisabled]}
            onPress={handleClockIn}
            disabled={isProcessing || !selectedJobId}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle-outline" size={22} color={colors.white} />
            <Text style={styles.clockInText}>
              {isProcessing ? 'Clocking In...' : 'Clock In'}
            </Text>
          </TouchableOpacity>
        )}

        {/* JOB PICKER */}
        <Text style={styles.sectionLabel}>SELECT JOB</Text>
        {todayJobs.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
            {todayJobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              const isLocked = !!activeInfo && !isSelected;
              return (
                <TouchableOpacity
                  key={job.id}
                  style={[styles.jobChip, isSelected && styles.jobChipActive, isLocked && styles.jobChipLocked]}
                  onPress={() => !activeInfo && setSelectedJobId(job.id)}
                  activeOpacity={isLocked ? 1 : 0.7}
                >
                  <Text style={[styles.jobChipTitle, isSelected && styles.jobChipTitleActive]} numberOfLines={1}>
                    {job.title || 'Untitled'}
                  </Text>
                  <StatusPill status={job.status} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={colors.muted} />
            <Text style={styles.emptyText}>No jobs scheduled today</Text>
          </Card>
        )}

        {/* TODAY'S SUMMARY */}
        {completedEntries.length > 0 && (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
                <Text style={styles.summaryLabel}>Total Hours</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{completedEntries.length}</Text>
                <Text style={styles.summaryLabel}>Entries</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
                <Text style={styles.summaryLabel}>Labor Cost</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>TODAY'S ENTRIES</Text>
            {completedEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryIcon}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.scaffld} />
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryJob} numberOfLines={1}>{entry.jobTitle || 'Job'}</Text>
                  <Text style={styles.entryMeta}>
                    {new Date(entry.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    {' – '}
                    {new Date(entry.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.entryRight}>
                  <Text style={styles.entryHours}>{entry.hours?.toFixed(1)}h</Text>
                  <Text style={styles.entryCost}>{formatCurrency(entry.cost)}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.md, paddingBottom: spacing['2xl'] },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  screenTitle: { ...typeScale.h1, color: colors.white },

  // Timer hero
  timerCard: {
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  timerCardActive: {
    borderColor: colors.scaffld,
    ...shadows.glowTeal,
  },
  timerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
  },
  statusDotActive: {
    backgroundColor: colors.scaffld,
  },
  timerStatus: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.muted,
  },
  timerStatusActive: {
    color: colors.scaffld,
  },
  timerValue: {
    fontFamily: fonts.data.regular,
    fontSize: 48,
    color: colors.slate,
    letterSpacing: 2,
  },
  timerValueActive: {
    color: colors.white,
  },
  timerInfo: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  locationText: {
    fontFamily: fonts.primary.regular,
    fontSize: 12,
    color: colors.muted,
  },
  locationCaptured: { color: colors.scaffld },

  // Clock buttons
  clockInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.scaffld,
    borderRadius: 10,
    paddingVertical: 16,
    minHeight: 56,
    marginBottom: spacing.lg,
    ...shadows.glowTeal,
  },
  clockBtnDisabled: {
    opacity: 0.4,
  },
  clockInText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 18,
    color: colors.white,
  },
  clockOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.coral,
    borderRadius: 10,
    paddingVertical: 16,
    minHeight: 56,
    marginBottom: spacing.lg,
  },
  clockOutText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 18,
    color: colors.coral,
  },

  // Section labels
  sectionLabel: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.sm,
    paddingLeft: 4,
  },

  // Job picker
  picker: { marginBottom: spacing.lg },
  jobChip: {
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: spacing.sm,
    minHeight: 64,
    minWidth: 140,
    justifyContent: 'center',
    gap: 6,
  },
  jobChipActive: {
    borderColor: colors.scaffld,
    backgroundColor: colors.scaffldSubtle,
  },
  jobChipLocked: { opacity: 0.4 },
  jobChipTitle: {
    fontFamily: fonts.primary.medium,
    fontSize: 14,
    color: colors.silver,
  },
  jobChipTitleActive: { color: colors.white },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontFamily: fonts.primary.regular,
    fontSize: 14,
    color: colors.muted,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: {
    fontFamily: fonts.primary.bold,
    fontSize: 18,
    color: colors.white,
  },
  summaryLabel: {
    fontFamily: fonts.primary.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.slate,
  },

  // Entries
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 64,
    gap: spacing.sm,
  },
  entryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(14,165,160,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryInfo: { flex: 1 },
  entryJob: {
    fontFamily: fonts.primary.medium,
    fontSize: 14,
    color: colors.white,
  },
  entryMeta: {
    fontFamily: fonts.primary.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  entryRight: { alignItems: 'flex-end' },
  entryHours: {
    fontFamily: fonts.data.medium,
    fontSize: 14,
    color: colors.scaffld,
  },
  entryCost: {
    fontFamily: fonts.data.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
});
