import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

function SkeletonBar({ width, height = 14, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.bar, { width, height, opacity }, style]}
    />
  );
}

function JobCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <SkeletonBar width={70} height={20} style={styles.badge} />
        <SkeletonBar width={50} height={14} />
      </View>
      <SkeletonBar width="75%" height={16} style={styles.mt} />
      <SkeletonBar width="50%" height={12} style={styles.mt} />
      <SkeletonBar width="40%" height={12} style={styles.mt} />
    </View>
  );
}

function ClientRowSkeleton() {
  return (
    <View style={styles.clientRow}>
      <SkeletonBar width={40} height={40} style={styles.avatar} />
      <View style={styles.clientText}>
        <SkeletonBar width="65%" height={14} />
        <SkeletonBar width="45%" height={12} style={styles.mt} />
      </View>
    </View>
  );
}

export default function LoadingSkeleton({ count = 3, variant = 'card' }) {
  const Skeleton = variant === 'client' ? ClientRowSkeleton : JobCardSkeleton;
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  bar: { backgroundColor: colors.slate, borderRadius: 6 },
  card: {
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: { borderRadius: 10 },
  mt: { marginTop: spacing.xs },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  avatar: { borderRadius: 20 },
  clientText: { flex: 1, marginLeft: spacing.sm },
});
