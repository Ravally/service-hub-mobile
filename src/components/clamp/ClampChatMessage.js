import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import ClampIcon from './ClampIcon';
import ClampActionCard from './ClampActionCard';
import { colors, fonts, spacing } from '../../theme';

function ThinkingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.thinkingRow}>
      <Text style={styles.thinkingLabel}>Clamp is working</Text>
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((val, i) => (
          <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: val }] }]} />
        ))}
      </View>
    </View>
  );
}

export default function ClampChatMessage({ message, onNavigate }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.clampRow}>
      <View style={styles.avatarSmall}>
        <ClampIcon size={14} color={colors.clamp} />
      </View>
      <View style={styles.clampContent}>
        <View style={styles.clampBubble}>
          {message.isThinking ? (
            <ThinkingDots />
          ) : (
            <Text style={styles.clampText}>{message.content}</Text>
          )}
        </View>
        {(message.actionCards || []).map((card, i) => (
          <ClampActionCard key={`action-${i}`} card={card} onNavigate={onNavigate} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // User message
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.sm },
  userBubble: {
    maxWidth: '80%',
    backgroundColor: 'rgba(45, 59, 78, 0.5)',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: { fontFamily: fonts.primary.regular, fontSize: 14, color: colors.white, lineHeight: 20 },

  // Clamp message
  clampRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm, gap: 8 },
  avatarSmall: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.clampSoft, borderWidth: 1, borderColor: colors.clampBorder,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  clampContent: { flex: 1 },
  clampBubble: {
    maxWidth: '90%',
    backgroundColor: 'rgba(12, 18, 32, 0.6)',
    borderWidth: 1, borderColor: 'rgba(45, 59, 78, 0.3)',
    borderRadius: 16, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  clampText: { fontFamily: fonts.primary.regular, fontSize: 14, color: colors.white, lineHeight: 22 },

  // Thinking dots
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  thinkingLabel: { fontFamily: fonts.primary.semiBold, fontSize: 14, color: colors.clamp },
  dotsRow: { flexDirection: 'row', gap: 3, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.clamp },
});
