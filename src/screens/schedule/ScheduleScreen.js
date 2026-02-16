import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, SectionList, FlatList, TouchableOpacity, Platform,
  RefreshControl, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useJobsStore } from '../../stores/jobsStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useStaffStore } from '../../stores/staffStore';
import { useAuthStore } from '../../stores/authStore';
import { resolveJobCoordinates } from '../../utils/routeUtils';
import { colors, typeScale, fonts, spacing, shadows } from '../../theme';
import StatusPill from '../../components/common/StatusPill';
import EmptyState from '../../components/ui/EmptyState';
import { formatCurrency } from '../../utils/formatters';

const STAFF_COLORS = ['#0EA5A0', '#60A5FA', '#F7845E', '#FFAA5C', '#C084FC', '#34D399', '#FB7185'];
const VIEWS = [
  { key: 'list', icon: 'list-outline' },
  { key: 'day', icon: 'today-outline' },
  { key: 'map', icon: 'map-outline' },
];

function formatTime(iso) {
  if (!iso) return 'Anytime';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getAddress(job) {
  const snap = job.propertySnapshot;
  if (snap) return [snap.street1, snap.city].filter(Boolean).join(', ') || '';
  return '';
}

export default function ScheduleScreen({ navigation }) {
  const jobs = useJobsStore((s) => s.jobs);
  const loading = useJobsStore((s) => s.loading);
  const getClientById = useClientsStore((s) => s.getClientById);
  const clients = useClientsStore((s) => s.clients);
  const staff = useStaffStore((s) => s.staff);
  const userId = useAuthStore((s) => s.userId);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [refreshing, setRefreshing] = useState(false);

  const shiftDay = (offset) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + offset);
    setSelectedDate(next);
  };

  const onDateChange = (_, picked) => {
    setShowDatePicker(false);
    if (picked) setSelectedDate(picked);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateLabel = isToday
    ? 'Today'
    : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const staffColorMap = useMemo(() => {
    const map = {};
    staff.forEach((s, i) => { map[s.id] = STAFF_COLORS[i % STAFF_COLORS.length]; });
    return map;
  }, [staff]);

  // Jobs for selected date
  const dayJobs = useMemo(() => {
    const dateStr = selectedDate.toDateString();
    return jobs
      .filter((j) => !j.archived && j.start && new Date(j.start).toDateString() === dateStr)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [jobs, selectedDate]);

  // Sections grouped by staff (for Day view)
  const sections = useMemo(() => {
    const grouped = new Map();
    const unassigned = [];
    for (const job of dayJobs) {
      const assignees = job.assignees || [];
      if (assignees.length === 0) {
        unassigned.push(job);
      } else {
        for (const staffId of assignees) {
          if (!grouped.has(staffId)) grouped.set(staffId, []);
          grouped.get(staffId).push(job);
        }
      }
    }
    const result = [];
    for (const [staffId, staffJobs] of grouped) {
      const member = staff.find((s) => s.id === staffId);
      result.push({
        staffId,
        title: member?.name || 'Staff Member',
        color: staffColorMap[staffId] || colors.muted,
        data: staffJobs.sort((a, b) => new Date(a.start) - new Date(b.start)),
      });
    }
    result.sort((a, b) => a.title.localeCompare(b.title));
    if (unassigned.length > 0) {
      result.push({ staffId: '_unassigned', title: 'Unassigned', color: colors.muted, data: unassigned });
    }
    return result;
  }, [dayJobs, staff, staffColorMap]);

  // Mappable jobs (for Map view)
  const clientsMap = useMemo(() => {
    const map = {};
    for (const c of clients) map[c.id] = c;
    return map;
  }, [clients]);

  const mappableJobs = useMemo(() => {
    return dayJobs
      .map((job) => {
        const coords = resolveJobCoordinates(job, clientsMap);
        if (!coords) return null;
        const client = getClientById(job.clientId);
        return { ...job, lat: coords.lat, lng: coords.lng, clientName: client?.name, address: getAddress(job) };
      })
      .filter(Boolean);
  }, [dayJobs, clientsMap, getClientById]);

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    useJobsStore.getState().subscribe(userId);
    setTimeout(() => setRefreshing(false), 800);
  }, [userId]);

  const renderJobCard = ({ item }) => {
    const client = getClientById(item.clientId);
    const address = getAddress(item);
    const isActive = item.status === 'In Progress';

    return (
      <TouchableOpacity
        style={[styles.jobCard, isActive && styles.jobCardActive]}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.jobTop}>
          <StatusPill status={item.status} />
          <Text style={styles.jobTime}>{formatTime(item.start)}</Text>
        </View>
        <Text style={styles.jobTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
        {client && (
          <View style={styles.jobMeta}>
            <Ionicons name="person-outline" size={13} color={colors.muted} />
            <Text style={styles.jobMetaText} numberOfLines={1}>{client.name}</Text>
          </View>
        )}
        {address ? (
          <View style={styles.jobMeta}>
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <Text style={styles.jobMetaText} numberOfLines={1}>{address}</Text>
          </View>
        ) : null}
        {item.total ? (
          <Text style={styles.jobAmount}>{formatCurrency(item.total)}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.staffDot, { backgroundColor: section.color }]} />
      <Text style={styles.staffName}>{section.title}</Text>
      <Text style={styles.staffCount}>{section.data.length}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with view switcher */}
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Schedule</Text>
        <View style={styles.viewSwitcher}>
          {VIEWS.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[styles.viewBtn, viewMode === v.key && styles.viewBtnActive]}
              onPress={() => setViewMode(v.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={v.icon}
                size={18}
                color={viewMode === v.key ? colors.scaffld : colors.muted}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => shiftDay(-1)} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.scaffld} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => shiftDay(1)} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={colors.scaffld} />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          themeVariant="dark"
        />
      )}

      <Text style={styles.summary}>
        {dayJobs.length} {dayJobs.length === 1 ? 'job' : 'jobs'} scheduled
      </Text>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <FlatList
          data={dayJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobCard}
          contentContainerStyle={dayJobs.length === 0 ? styles.emptyList : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.scaffld} />}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title="No jobs scheduled" message={`No jobs for ${dateLabel.toLowerCase()}.`} />
          }
        />
      )}

      {/* DAY VIEW (grouped by staff) */}
      {viewMode === 'day' && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderJobCard}
          contentContainerStyle={sections.length === 0 ? styles.emptyList : styles.list}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.scaffld} />}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title="No jobs scheduled" message={`No jobs for ${dateLabel.toLowerCase()}.`} />
          }
        />
      )}

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <View style={styles.mapContainer}>
          {mappableJobs.length > 0 ? (
            <MapPlaceholder count={mappableJobs.length} onJobPress={(job) => navigation.navigate('JobDetail', { jobId: job.id })} />
          ) : (
            <View style={styles.noMapData}>
              <Ionicons name="location-outline" size={48} color={colors.muted} />
              <Text style={styles.noMapText}>No jobs with GPS coordinates</Text>
            </View>
          )}
        </View>
      )}

      {/* Today shortcut FAB */}
      {!isToday && (
        <TouchableOpacity
          style={styles.todayFab}
          onPress={() => setSelectedDate(new Date())}
          activeOpacity={0.8}
        >
          <Text style={styles.todayFabText}>Today</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function MapPlaceholder({ count }) {
  return (
    <View style={styles.mapPlaceholder}>
      <Ionicons name="map" size={48} color={colors.scaffld} />
      <Text style={styles.mapPlaceholderText}>{count} jobs on the map</Text>
      <Text style={styles.mapPlaceholderSub}>Full map view available on device</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  screenTitle: { ...typeScale.h1, color: colors.white },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.charcoal,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.slate,
    overflow: 'hidden',
  },
  viewBtn: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnActive: {
    backgroundColor: 'rgba(14,165,160,0.15)',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.lg,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.charcoal,
    borderWidth: 1,
    borderColor: colors.slate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: { ...typeScale.h3, color: colors.white },
  summary: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing['2xl'] },
  emptyList: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  staffDot: { width: 10, height: 10, borderRadius: 5 },
  staffName: { ...typeScale.h4, color: colors.white, flex: 1 },
  staffCount: {
    fontFamily: fonts.data.medium,
    fontSize: 12,
    color: colors.muted,
    backgroundColor: colors.charcoal,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  jobCard: {
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: spacing.sm,
    minHeight: 72,
    ...shadows.sm,
  },
  jobCardActive: {
    borderColor: colors.scaffld,
    borderLeftWidth: 3,
  },
  jobTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobTime: { fontFamily: fonts.data.regular, fontSize: 13, color: colors.silver },
  jobTitle: { fontFamily: fonts.primary.semiBold, fontSize: 15, color: colors.white, marginBottom: 2 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  jobMetaText: { fontFamily: fonts.primary.regular, fontSize: 12, color: colors.muted, marginLeft: 5, flex: 1 },
  jobAmount: {
    fontFamily: fonts.data.medium,
    fontSize: 14,
    color: colors.white,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  mapContainer: { flex: 1 },
  noMapData: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noMapText: { fontFamily: fonts.primary.regular, fontSize: 14, color: colors.muted, marginTop: spacing.sm },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapPlaceholderText: { fontFamily: fonts.primary.semiBold, fontSize: 16, color: colors.white, marginTop: spacing.md },
  mapPlaceholderSub: { fontFamily: fonts.primary.regular, fontSize: 13, color: colors.muted, marginTop: 4 },
  todayFab: {
    position: 'absolute',
    bottom: spacing.lg,
    alignSelf: 'center',
    backgroundColor: colors.scaffld,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    ...shadows.glowTeal,
  },
  todayFabText: { fontFamily: fonts.primary.semiBold, fontSize: 14, color: colors.white },
});
