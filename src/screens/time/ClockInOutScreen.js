import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJobsStore } from '../../stores/jobsStore';
import { useStaffStore } from '../../stores/staffStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { formatCurrency } from '../../utils';
import { getCurrentLocation } from '../../services/location';
import { successNotification } from '../../utils/haptics';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SyncStatusBadge from '../../components/ui/SyncStatusBadge';

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
  const [locationStatus, setLocationStatus] = useState(null); // 'captured' | 'denied' | null
  const timerRef = useRef(null);

  const currentStaffId = useMemo(() => {
    const match = staff.find(
      (s) => s.email === userProfile?.email || s.userId === userId,
    );
    return match?.id || userId;
  }, [staff, userProfile, userId]);

  const currentStaff = staff.find((s) => s.id === currentStaffId);

  // Find active entry across all today's jobs
  const activeInfo = useMemo(() => {
    for (const job of todayJobs) {
      const entry = (job.laborEntries || []).find(
        (e) => e.staffId === currentStaffId && !e.end,
      );
      if (entry) return { jobId: job.id, entry };
    }
    return null;
  }, [todayJobs, currentStaffId]);

  // Auto-select active job
  useEffect(() => {
    if (activeInfo && selectedJobId !== activeInfo.jobId) {
      setSelectedJobId(activeInfo.jobId);
    }
  }, [activeInfo, selectedJobId]);

  // Timer
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
      successNotification();
      showToast(`Clocked out — ${hours.toFixed(1)}h`, 'success');
    } catch {
      showToast('Failed to clock out', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Completed entries from today's jobs
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Clock In / Out</Text>
        <SyncStatusBadge />

        {/* Job Picker */}
        <Text style={styles.sectionLabel}>SELECT JOB</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
          {todayJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[styles.jobChip, selectedJobId === job.id && styles.jobChipActive]}
              onPress={() => !activeInfo && setSelectedJobId(job.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.jobChipText, selectedJobId === job.id && styles.jobChipTextActive]} numberOfLines={1}>
                {job.title || 'Untitled'}
              </Text>
            </TouchableOpacity>
          ))}
          {todayJobs.length === 0 && (
            <Text style={styles.noJobs}>No jobs scheduled today</Text>
          )}
        </ScrollView>

        {/* Timer Display */}
        <Card style={styles.timerCard}>
          <Text style={styles.timerStatus}>
            {activeInfo ? 'CLOCKED IN' : 'NOT CLOCKED IN'}
          </Text>
          <Text style={styles.timerValue}>{elapsed}</Text>
          {activeInfo && (
            <Text style={styles.timerInfo}>
              Started {new Date(activeInfo.entry.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </Card>

        {/* Location Indicator */}
        {locationStatus && (
          <View style={styles.locationRow}>
            <Ionicons
              name={locationStatus === 'captured' ? 'location' : 'location-outline'}
              size={16}
              color={locationStatus === 'captured' ? colors.trellio : colors.muted}
            />
            <Text style={[styles.locationText, locationStatus === 'captured' && styles.locationCaptured]}>
              {locationStatus === 'captured' ? 'Location captured' : 'No location'}
            </Text>
          </View>
        )}

        {/* Clock Button */}
        {activeInfo ? (
          <Button
            title="Clock Out"
            variant="danger"
            onPress={handleClockOut}
            loading={isProcessing}
            style={styles.clockBtn}
          />
        ) : (
          <Button
            title="Clock In"
            variant="primary"
            onPress={handleClockIn}
            loading={isProcessing}
            disabled={!selectedJobId}
            style={styles.clockBtn}
          />
        )}

        {/* Today's Entries */}
        {completedEntries.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
              TODAY'S ENTRIES
            </Text>
            {completedEntries.map((entry) => (
              <Card key={entry.id} style={styles.entryCard}>
                <View style={styles.entryRow}>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryJob}>{entry.jobTitle || 'Job'}</Text>
                    <Text style={styles.entryTime}>
                      {entry.hours?.toFixed(1)}h
                    </Text>
                  </View>
                  <Text style={styles.entryCost}>
                    {formatCurrency(entry.cost / 100)}
                  </Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { ...typeScale.h1, color: colors.white, marginBottom: spacing.md },
  sectionLabel: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.sm },
  picker: { flexDirection: 'row', marginBottom: spacing.lg },
  jobChip: {
    backgroundColor: colors.charcoal, borderRadius: 10, paddingHorizontal: spacing.md,
    paddingVertical: 10, borderWidth: 1, borderColor: colors.slate, marginRight: spacing.sm,
    minHeight: 48, justifyContent: 'center', minWidth: 120,
  },
  jobChipActive: { borderColor: colors.trellio, backgroundColor: colors.trellioSubtle },
  jobChipText: { ...typeScale.bodySm, color: colors.silver },
  jobChipTextActive: { color: colors.trellio },
  noJobs: { ...typeScale.bodySm, color: colors.muted },
  timerCard: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.md },
  timerStatus: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, color: colors.muted, marginBottom: spacing.sm },
  timerValue: { fontFamily: fonts.data.regular, fontSize: 48, color: colors.white, letterSpacing: 2 },
  timerInfo: { ...typeScale.bodySm, color: colors.muted, marginTop: spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, gap: 6 },
  locationText: { ...typeScale.bodySm, color: colors.muted },
  locationCaptured: { color: colors.trellio },
  clockBtn: { minHeight: 60 },
  entryCard: { marginBottom: spacing.sm },
  entryRow: { flexDirection: 'row', alignItems: 'center' },
  entryInfo: { flex: 1 },
  entryJob: { ...typeScale.bodySm, color: colors.silver },
  entryTime: { fontFamily: fonts.data.regular, fontSize: 13, color: colors.trellio, marginTop: 2 },
  entryCost: { fontFamily: fonts.data.regular, fontSize: 15, color: colors.silver },
});
