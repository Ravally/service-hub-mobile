import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategorySection from './CategorySection';
import Card from '../ui/Card';
import { colors, fonts, spacing } from '../../theme';

export default function CategorySectionList({ sections, navigation }) {
  const handleItemPress = useCallback((item) => {
    const params = { entityType: item.entityType };
    if (item.statusFilter) params.statusFilter = item.statusFilter;
    navigation.navigate(item.tab, { screen: item.screen, params });
  }, [navigation]);

  if (sections.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Ionicons name="checkmark-circle" size={24} color={colors.scaffld} />
        <Text style={styles.emptyText}>All caught up! No action needed.</Text>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>OVERVIEW</Text>
      {sections.map((category, index) => (
        <CategorySection
          key={category.key}
          category={category}
          isLast={index === sections.length - 1}
          onItemPress={handleItemPress}
          defaultExpanded={index === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.data.medium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.primary.medium,
    fontSize: 14,
    color: colors.silver,
  },
});
