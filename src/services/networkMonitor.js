import NetInfo from '@react-native-community/netinfo';

let currentState = { isConnected: true, isInternetReachable: true };

/** Returns last-known connectivity state (synchronous) */
export function getIsConnected() {
  return currentState.isConnected && currentState.isInternetReachable !== false;
}

/**
 * Subscribe to network state changes.
 * @param {(online: boolean) => void} onStatusChange — called on every change
 * @returns {() => void} unsubscribe function
 */
export function subscribeToNetwork(onStatusChange) {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const wasOnline = getIsConnected();
    currentState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
    };
    const nowOnline = getIsConnected();

    onStatusChange(nowOnline);

    // Detect offline → online transition
    if (!wasOnline && nowOnline && onReconnectCallback) {
      onReconnectCallback();
    }
  });

  return unsubscribe;
}

let onReconnectCallback = null;

/** Register a callback that fires once when device reconnects */
export function setOnReconnect(callback) {
  onReconnectCallback = callback;
}

/** Fetch current state (async, for initial check) */
export async function fetchNetworkState() {
  try {
    const state = await NetInfo.fetch();
    currentState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
    };
    return getIsConnected();
  } catch {
    return true;
  }
}
