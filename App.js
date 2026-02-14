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
import RootNavigator, { navigationRef } from './src/navigation/RootNavigator';
import ToastContainer from './src/components/ui/Toast';
import { registerForPushNotifications, setupNotificationHandlers, scheduleDailyJobReminder, cancelAllNotifications } from './src/services/notificationService';
import { useOfflineSyncStore } from './src/stores/offlineSyncStore';

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

      // Offline sync
      useOfflineSyncStore.getState().initialize(userId);

      // Push notifications
      registerForPushNotifications(userId).then((token) => {
        if (token) useAuthStore.getState().setPushToken(token);
      });
      const cleanupHandlers = setupNotificationHandlers(navigationRef);
      return () => {
        cleanupHandlers();
        useOfflineSyncStore.getState().teardown();
      };
    } else {
      useJobsStore.getState().unsubscribe();
      useClientsStore.getState().unsubscribe();
      useStaffStore.getState().unsubscribe();
      useFormTemplatesStore.getState().unsubscribe();
      useFormResponsesStore.getState().unsubscribe();
      cancelAllNotifications();
      useOfflineSyncStore.getState().teardown();
    }
  }, [userId]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <StatusBar style="light" />
        <RootNavigator />
        <ToastContainer />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
