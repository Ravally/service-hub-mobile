import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useOfflineSyncStore } from '../../stores/offlineSyncStore';
import { colors, fonts, spacing } from '../../theme';

export default function SyncStatusBadge() {
  const isOnline = useOfflineSyncStore((s) => s.isOnline);
  const isSyncing = useOfflineSyncStore((s) => s.isSyncing);
  const pendingCount = useOfflineSyncStore((s) => s.pendingCount);

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  let dotColor = colors.scaffld;
  let label = 'Synced';

  if (isSyncing) {
    dotColor = colors.amber;
    label = 'Syncing...';
  } else if (!isOnline) {
    dotColor = colors.muted;
    label = pendingCount > 0 ? `Offline · ${pendingCount} pending` : 'Offline';
  } else if (pendingCount > 0) {
    dotColor = colors.amber;
    label = `${pendingCount} pending`;
  }

  return (
    <View style={styles.container}>
      {isSyncing ? (
        <ActivityIndicator size={10} color={dotColor} style={styles.spinner} />
      ) : (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      )}
      <Text style={[styles.label, { color: dotColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    minHeight: 28,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  spinner: { width: 8, height: 8 },
  label: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    letterSpacing: 1,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
});
