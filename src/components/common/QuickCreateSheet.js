import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated, Pressable,
  StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, shadows } from '../../theme';
import { mediumImpact, lightImpact } from '../../utils/haptics';
import { navigationRef } from '../../navigation/navigationRef';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 320;

const CREATE_OPTIONS = [
  { key: 'client', label: 'New Client', icon: 'person-add-outline', screen: 'ClientCreate' },
  { key: 'quote', label: 'New Quote', icon: 'document-text-outline', screen: 'QuoteCreate' },
  { key: 'job', label: 'New Job', icon: 'construct-outline', screen: 'JobCreate' },
  { key: 'invoice', label: 'New Invoice', icon: 'cash-outline', screen: 'InvoiceCreate' },
  { key: 'expense', label: 'New Expense', icon: 'receipt-outline', screen: 'ExpenseCreate' },
];

const QuickCreateSheet = forwardRef(function QuickCreateSheet(_, ref) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const open = useCallback(() => {
    setVisible(true);
    mediumImpact();
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 65, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, backdropAnim]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [slideAnim, backdropAnim]);

  useImperativeHandle(ref, () => ({ open, close }), [open, close]);

  const handleSelect = useCallback((option) => {
    lightImpact();
    close();
    // Use navigationRef to dispatch through the entire navigator tree
    // QuickCreateSheet is rendered outside Tab.Navigator so useNavigation() won't reach tabs
    setTimeout(() => {
      navigationRef.current?.navigate('Home', { screen: option.screen });
    }, 250);
  }, [close]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Create New</Text>

          <View style={styles.grid}>
            {CREATE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.gridItem}
                onPress={() => handleSelect(option)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={option.icon} size={24} color={colors.white} />
                </View>
                <Text style={styles.label}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

export default QuickCreateSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 18, 32, 0.7)',
  },
  sheet: {
    backgroundColor: colors.charcoal,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    paddingTop: spacing.sm,
    minHeight: SHEET_HEIGHT,
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.slate,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 18,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '28%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: 80,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.scaffldDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  label: {
    fontFamily: fonts.primary.medium,
    fontSize: 12,
    color: colors.silver,
    textAlign: 'center',
  },
});
