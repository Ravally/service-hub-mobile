import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing } from '../../theme';
import { mediumImpact } from '../../utils/haptics';

const MENU_ITEMS = [
  { key: 'expense', label: 'New Expense', icon: 'receipt-outline', tab: 'More', screen: 'ExpenseCreate' },
  { key: 'quote', label: 'New Quote', icon: 'document-text-outline', tab: 'Quotes', screen: 'QuoteCreate' },
  { key: 'invoice', label: 'New Invoice', icon: 'cash-outline', tab: 'Invoices', screen: 'InvoiceCreate' },
  { key: 'client', label: 'New Client', icon: 'person-add-outline', tab: 'Clients', screen: 'ClientCreate' },
  { key: 'job', label: 'New Job', icon: 'construct-outline', tab: 'Today', screen: 'JobCreate' },
];

export default function QuickCreateFAB() {
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    mediumImpact();
    Animated.spring(animation, {
      toValue: open ? 0 : 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
    setOpen((v) => !v);
  };

  const handleSelect = (item) => {
    toggle();
    try {
      navigation.navigate(item.tab, { screen: item.screen });
    } catch {
      navigation.navigate(item.tab);
    }
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {open && <Pressable style={styles.backdrop} onPress={toggle} />}

      <View style={styles.container} pointerEvents="box-none">
        {MENU_ITEMS.map((item, index) => {
          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -(64 * (index + 1))],
          });
          const opacity = animation.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [0, 0, 1],
          });
          const scale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          });

          return (
            <Animated.View
              key={item.key}
              style={[styles.menuItem, { transform: [{ translateY }, { scale }], opacity }]}
              pointerEvents={open ? 'auto' : 'none'}
            >
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => handleSelect(item)}
                activeOpacity={0.8}
              >
                <View style={styles.menuLabel}>
                  <Text style={styles.menuText}>{item.label}</Text>
                </View>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={20} color={colors.white} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <TouchableOpacity style={styles.fab} onPress={toggle} activeOpacity={0.9}>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={28} color={colors.white} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 18, 32, 0.7)',
    zIndex: 90,
  },
  container: {
    position: 'absolute',
    bottom: 80,
    right: spacing.lg,
    alignItems: 'flex-end',
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.scaffld,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.scaffld,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  menuItem: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    backgroundColor: colors.charcoal,
    borderWidth: 1,
    borderColor: colors.slate,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: spacing.sm,
  },
  menuText: {
    fontFamily: fonts.primary.medium,
    fontSize: 14,
    color: colors.white,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.scaffldDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
