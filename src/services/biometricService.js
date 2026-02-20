import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'scaffld_auth_credentials';
const BIOMETRIC_ENABLED_KEY = 'scaffld_biometric_enabled';

/**
 * Check if the device supports biometric authentication.
 */
export async function isBiometricAvailable() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Get the type of biometric available (for display purposes).
 * Returns 'Face ID', 'Touch ID', or 'Biometrics'.
 */
export async function getBiometricLabel() {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Touch ID';
  }
  return 'Biometrics';
}

/**
 * Prompt for biometric authentication.
 * Returns true if authenticated, false otherwise.
 */
export async function authenticateWithBiometric() {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to Scaffld',
      fallbackLabel: 'Use password',
      disableDeviceFallback: true,
      cancelLabel: 'Cancel',
    });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Store credentials securely after successful password login.
 */
export async function saveCredentials(email, password) {
  try {
    await SecureStore.setItemAsync(
      CREDENTIALS_KEY,
      JSON.stringify({ email, password }),
    );
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
  } catch {
    // SecureStore may fail on some devices — silently ignore
  }
}

/**
 * Retrieve stored credentials (only after biometric success).
 */
export async function getStoredCredentials() {
  try {
    const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Check if the user has opted into biometric login.
 */
export async function isBiometricEnabled() {
  try {
    const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Clear stored credentials (on sign-out or disable biometric).
 */
export async function clearCredentials() {
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  } catch {
    // ignore
  }
}
