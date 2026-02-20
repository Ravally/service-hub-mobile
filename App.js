import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { useAuthStore } from './src/stores/authStore';
import { useJobsStore } from './src/stores/jobsStore';
import { useClientsStore } from './src/stores/clientsStore';
import { useStaffStore } from './src/stores/staffStore';
import { useFormTemplatesStore } from './src/stores/formTemplatesStore';
import { useFormResponsesStore } from './src/stores/formResponsesStore';
import { useQuotesStore } from './src/stores/quotesStore';
import { useInvoicesStore } from './src/stores/invoicesStore';
import { useMessagesStore } from './src/stores/messagesStore';
import RootNavigator, { navigationRef } from './src/navigation/RootNavigator';
import ToastContainer from './src/components/ui/Toast';
import { registerForPushNotifications, setupNotificationHandlers, scheduleDailyJobReminder, cancelAllNotifications } from './src/services/notificationService';
import { useOfflineSyncStore } from './src/stores/offlineSyncStore';
import { startNotificationTriggers } from './src/services/notificationTriggers';
import { registerTodayGeofences, stopGeofencing } from './src/services/geofenceService';
import { registerQuickActions, handleQuickAction, getInitialQuickAction } from './src/services/quickActionsService';
import * as QuickActions from 'expo-quick-actions';
import { fetchConnectionToken } from './src/services/terminalService';

// Stripe Terminal requires a custom dev build — gracefully skip in Expo Go
let StripeTerminalProvider = null;
try {
  StripeTerminalProvider = require('@stripe/stripe-terminal-react-native').StripeTerminalProvider;
} catch {
  // Native module not available (Expo Go)
}

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initialize();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      useJobsStore.getState().subscribe(userId);
      useClientsStore.getState().subscribe(userId);
      useStaffStore.getState().subscribe(userId);
      useFormTemplatesStore.getState().subscribe(userId);
      useFormResponsesStore.getState().subscribe(userId);
      useQuotesStore.getState().subscribe(userId);
      useInvoicesStore.getState().subscribe(userId);
      useMessagesStore.getState().subscribe(userId);

      // Offline sync
      useOfflineSyncStore.getState().initialize(userId);

      // Push notifications
      registerForPushNotifications(userId).then((token) => {
        if (token) useAuthStore.getState().setPushToken(token);
      });
      const cleanupHandlers = setupNotificationHandlers(navigationRef);
      const cleanupTriggers = startNotificationTriggers();

      // Quick actions (long-press app icon shortcuts)
      registerQuickActions();
      const initialAction = getInitialQuickAction();
      if (initialAction) handleQuickAction(initialAction, navigationRef);
      const quickActionSub = QuickActions.addListener((action) => {
        handleQuickAction(action, navigationRef);
      });

      // Geofence: register when jobs load, re-register on job changes
      let geofenceTimer = null;
      const cleanupGeofences = useJobsStore.subscribe((state) => {
        if (!state.loading && state.jobs.length > 0) {
          clearTimeout(geofenceTimer);
          geofenceTimer = setTimeout(() => registerTodayGeofences(), 2000);
        }
      });

      return () => {
        cleanupHandlers();
        cleanupTriggers();
        cleanupGeofences();
        quickActionSub.remove();
        clearTimeout(geofenceTimer);
        stopGeofencing();
        useOfflineSyncStore.getState().teardown();
      };
    } else {
      useJobsStore.getState().unsubscribe();
      useClientsStore.getState().unsubscribe();
      useStaffStore.getState().unsubscribe();
      useFormTemplatesStore.getState().unsubscribe();
      useFormResponsesStore.getState().unsubscribe();
      useQuotesStore.getState().unsubscribe();
      useInvoicesStore.getState().unsubscribe();
      useMessagesStore.getState().unsubscribe();
      cancelAllNotifications();
      stopGeofencing();
      useOfflineSyncStore.getState().teardown();
    }
  }, [userId]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const content = (
    <SafeAreaProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <StatusBar style="light" />
        <RootNavigator />
        <ToastContainer />
      </View>
    </SafeAreaProvider>
  );

  if (StripeTerminalProvider) {
    return (
      <StripeTerminalProvider logLevel="none" tokenProvider={fetchConnectionToken}>
        {content}
      </StripeTerminalProvider>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
