/**
 * Map helpers and navigation deep-link launchers.
 */
import { Platform, Linking } from 'react-native';
import { colors } from '../theme';

/** Status → marker pin color */
export const JOB_STATUS_COLORS = {
  Scheduled: colors.scaffld,
  'In Progress': colors.amber,
  Completed: colors.muted,
  Cancelled: colors.coral,
};

/**
 * Open a single destination in the platform's default maps app.
 */
export function openInMaps(lat, lng, label = 'Job') {
  const encoded = encodeURIComponent(label);
  const url =
    Platform.OS === 'ios'
      ? `maps://app?daddr=${lat},${lng}&q=${encoded}`
      : `google.navigation:q=${lat},${lng}`;
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  Linking.canOpenURL(url).then((supported) => {
    Linking.openURL(supported ? url : fallback);
  });
}

/**
 * Open a multi-stop route in Google Maps.
 * @param {Array<{ lat, lng }>} waypoints - ordered stops
 */
export function openRouteInMaps(waypoints) {
  if (waypoints.length === 0) return;
  const dest = waypoints[waypoints.length - 1];
  const middle = waypoints.slice(0, -1);
  const waypointStr = middle.map((w) => `${w.lat},${w.lng}`).join('|');
  const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}${
    waypointStr ? `&waypoints=${encodeURIComponent(waypointStr)}` : ''
  }&travelmode=driving`;
  Linking.openURL(url);
}

/**
 * Compute a map region that fits all job markers with padding.
 */
export function getMapRegion(jobs, padding = 1.4) {
  if (jobs.length === 0) {
    return { latitude: 37.78, longitude: -122.43, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }
  if (jobs.length === 1) {
    return { latitude: jobs[0].lat, longitude: jobs[0].lng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  }
  const lats = jobs.map((j) => j.lat);
  const lngs = jobs.map((j) => j.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = Math.max((maxLat - minLat) * padding, 0.01);
  const lngDelta = Math.max((maxLng - minLng) * padding, 0.01);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}
