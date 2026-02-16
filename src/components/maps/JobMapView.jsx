import React, { useRef, useEffect } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
// NOTE: This file is native-only. Web uses JobMapView.web.jsx (Metro platform extension).
import MapView, { Marker, Callout, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { JOB_STATUS_COLORS, getMapRegion } from '../../utils/mapUtils';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

/**
 * Map view displaying job markers with optional route polyline.
 *
 * @param {Array} jobs - jobs with { id, lat, lng, title, status, clientName, address }
 * @param {Array} optimizedRoute - optional ordered jobs for polyline
 * @param {Function} onJobPress - navigate to job detail
 * @param {Function} onNavigatePress - launch external maps
 */
export default function JobMapView({ jobs = [], optimizedRoute, onJobPress, onNavigatePress }) {
  const mapRef = useRef(null);
  const routeJobs = optimizedRoute || [];

  useEffect(() => {
    if (mapRef.current && jobs.length > 0) {
      const region = getMapRegion(jobs);
      mapRef.current.animateToRegion(region, 500);
    }
  }, [jobs]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Ionicons name="map-outline" size={48} color={colors.muted} />
        <Text style={styles.webText}>Map not available on web</Text>
      </View>
    );
  }

  const initialRegion = getMapRegion(jobs);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        userInterfaceStyle="dark"
      >
        {jobs.map((job) => (
          <Marker
            key={job.id}
            coordinate={{ latitude: job.lat, longitude: job.lng }}
            pinColor={JOB_STATUS_COLORS[job.status] || colors.muted}
            title={job.title || 'Job'}
          >
            {job.routeOrder != null && (
              <View style={styles.numberedPin}>
                <Text style={styles.pinNumber}>{job.routeOrder + 1}</Text>
              </View>
            )}
            <Callout tooltip onPress={() => onJobPress?.(job)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle} numberOfLines={1}>
                  {job.title || 'Untitled Job'}
                </Text>
                {job.clientName ? (
                  <Text style={styles.calloutClient} numberOfLines={1}>{job.clientName}</Text>
                ) : null}
                {job.address ? (
                  <Text style={styles.calloutAddr} numberOfLines={2}>{job.address}</Text>
                ) : null}
                <View style={styles.calloutFooter}>
                  <Badge status={job.status} />
                  <Button
                    title="Navigate"
                    variant="ghost"
                    onPress={() => onNavigatePress?.(job)}
                    style={styles.calloutBtn}
                  />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}

        {routeJobs.length > 1 && (
          <Polyline
            coordinates={routeJobs.map((j) => ({ latitude: j.lat, longitude: j.lng }))}
            strokeColor={colors.scaffld}
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  map: { flex: 1 },
  webFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.charcoal, borderRadius: 16, minHeight: 200,
  },
  webText: { ...typeScale.bodySm, color: colors.muted, marginTop: spacing.sm },
  numberedPin: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.scaffld, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  pinNumber: { fontFamily: fonts.data.bold, fontSize: 12, color: colors.white },
  callout: {
    backgroundColor: colors.charcoal, borderRadius: 12, padding: spacing.sm,
    minWidth: 200, maxWidth: 260, borderWidth: 1, borderColor: colors.slate,
  },
  calloutTitle: { ...typeScale.body, color: colors.white, marginBottom: 2 },
  calloutClient: { ...typeScale.bodySm, color: colors.scaffld, marginBottom: 2 },
  calloutAddr: { ...typeScale.bodySm, color: colors.muted, marginBottom: spacing.sm },
  calloutFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calloutBtn: { paddingHorizontal: spacing.sm, minHeight: 36, paddingVertical: 6 },
});
