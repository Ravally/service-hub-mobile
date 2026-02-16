import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, shadows } from '../../theme';
import { ENTITY_COLORS, ENTITY_ICONS } from '../../constants/entityColors';
import { lightImpact } from '../../utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TOGGLE_ANIMATION = {
  duration: 250,
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
};

export default function CategorySection({ category, isLast, onItemPress, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const accentColor = ENTITY_COLORS[category.key] || colors.scaffld;
  const icon = ENTITY_ICONS[category.key] || 'ellipse-outline';

  const toggle = useCallback(() => {
    lightImpact();
    LayoutAnimation.configureNext(TOGGLE_ANIMATION);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.wrapper}>
      {/* Timeline connector */}
      <View style={styles.timelineCol}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        {!isLast && <View style={[styles.line, { backgroundColor: accentColor }]} />}
      </View>

      {/* Content */}
      <View style={styles.contentCol}>
        {/* Header */}
        <TouchableOpacity
          style={styles.header}
          onPress={toggle}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
            <Ionicons name={icon} size={18} color={colors.white} />
          </View>
          <Text style={styles.headerLabel}>{category.label}</Text>
          <View style={[styles.countBadge, { backgroundColor: `${accentColor}20` }]}>
            <Text style={[styles.countText, { color: accentColor }]}>{category.count}</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={colors.muted}
          />
        </TouchableOpacity>

        {/* Sub-items */}
        {expanded && (
          <View style={styles.itemsContainer}>
            {category.items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.subItem}
                onPress={() => onItemPress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.subDot, { backgroundColor: accentColor }]} />
                <Text style={styles.subLabel}>{item.label}</Text>
                {item.detail ? (
                  <Text style={styles.subDetail}>{item.detail}</Text>
                ) : null}
                <Ionicons name="chevron-forward" size={14} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
  },
  // Timeline column
  timelineCol: {
    width: 24,
    alignItems: 'center',
    paddingTop: 14,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    opacity: 0.3,
  },
  // Content column
  contentCol: {
    flex: 1,
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 48,
    gap: spacing.sm,
    ...shadows.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 16,
    color: colors.white,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontFamily: fonts.data.medium,
    fontSize: 13,
  },
  // Sub-items
  itemsContainer: {
    marginTop: 2,
    marginLeft: spacing.sm,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: 4,
    minHeight: 44,
    gap: spacing.sm,
    ...shadows.sm,
  },
  subDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subLabel: {
    fontFamily: fonts.primary.medium,
    fontSize: 14,
    color: colors.silver,
    flex: 1,
  },
  subDetail: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
  },
});
