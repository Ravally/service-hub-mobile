import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

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
 * Request background location permission (needed for geofencing).
 * Must be called after foreground permission is granted.
 * Returns true if "always" access granted.
 */
export async function requestBackgroundLocationPermission() {
  try {
    const fg = await requestLocationPermission();
    if (!fg) return false;
    const { status } = await Location.requestBackgroundPermissionsAsync();
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
    if (!granted) {
      Alert.alert(
        'Location Access Required',
        'Scaffld needs location access to log your position for clock-in and job check-ins. Please enable it in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return null;
    }

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
