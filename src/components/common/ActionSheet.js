import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated, Pressable, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, shadows } from '../../theme';
import { lightImpact } from '../../utils/haptics';

const ActionSheet = forwardRef(function ActionSheet({ options = [], title }, ref) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const open = useCallback(() => {
    setVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 65, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, backdropAnim]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [slideAnim, backdropAnim]);

  useImperativeHandle(ref, () => ({ open, close }), [open, close]);

  const handleSelect = useCallback((option) => {
    lightImpact();
    close();
    setTimeout(() => option.onPress?.(), 250);
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
          {title && <Text style={styles.title}>{title}</Text>}

          {options.map((option, i) => (
            <TouchableOpacity
              key={option.key || i}
              style={[
                styles.option,
                option.destructive && styles.destructive,
              ]}
              onPress={() => handleSelect(option)}
              activeOpacity={0.7}
            >
              {option.icon && (
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={option.destructive ? colors.coral : colors.white}
                />
              )}
              <Text style={[
                styles.optionText,
                option.destructive && styles.destructiveText,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelBtn} onPress={close} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
});

export default ActionSheet;

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
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
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  destructive: {},
  optionText: {
    fontFamily: fonts.primary.medium,
    fontSize: 16,
    color: colors.white,
    flex: 1,
  },
  destructiveText: { color: colors.coral },
  cancelBtn: {
    marginTop: spacing.sm,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  cancelText: {
    fontFamily: fonts.primary.medium,
    fontSize: 16,
    color: colors.muted,
  },
});
