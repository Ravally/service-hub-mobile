import * as Location from 'expo-location';

/**
 * Request foreground location permission.
 * Returns true if granted, false otherwise.
 */
export async function requestLocationPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Get the current device location.
 * Returns { lat, lng, accuracy, timestamp } or null if unavailable.
 * Non-blocking — always resolves (never throws).
 */
export async function getCurrentLocation() {
  try {
    const granted = await requestLocationPermission();
    if (!granted) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: new Date(location.timestamp).toISOString(),
    };
  } catch {
    return null;
  }
}
