import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, spacing } from '../../theme';

/**
 * Web fallback for JobMapView — react-native-maps is native-only.
 */
export default function JobMapView() {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={48} color={colors.muted} />
      <Text style={styles.text}>Map view is only available on mobile</Text>
      <Text style={styles.hint}>Scan the QR code with Expo Go to see the map</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.charcoal, borderRadius: 16, minHeight: 200,
  },
  text: { ...typeScale.bodySm, color: colors.muted, marginTop: spacing.sm },
  hint: { ...typeScale.bodySm, color: colors.muted, marginTop: 4, fontSize: 11 },
});
