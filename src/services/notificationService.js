import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request permission, get Expo push token, store in Firestore.
 * Returns the token string or null.
 */
export async function registerForPushNotifications(userId) {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Trellio',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0EA5A0',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Store token in Firestore
    const tokenRef = doc(db, 'users', userId, 'devices', 'pushToken');
    await setDoc(tokenRef, {
      token,
      platform: Platform.OS,
      updatedAt: new Date().toISOString(),
    });

    return token;
  } catch (err) {
    console.error('Failed to register push notifications:', err);
    return null;
  }
}

/**
 * Setup handlers for foreground and tap responses.
 * Call once on app mount. Returns cleanup function.
 */
export function setupNotificationHandlers(navigationRef) {
  // Foreground — notification appears as banner (handled by setNotificationHandler above)
  const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification.request.content.title);
  });

  // Tap — navigate to relevant screen
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    const nav = navigationRef?.current;
    if (!nav) return;

    try {
      if (data.jobId) {
        nav.navigate('Jobs', { screen: 'JobDetail', params: { jobId: data.jobId } });
      } else if (data.clientId) {
        nav.navigate('Clients', { screen: 'ClientDetail', params: { clientId: data.clientId } });
      }
    } catch (err) {
      console.error('Notification navigation failed:', err);
    }
  });

  return () => {
    foregroundSub.remove();
    responseSub.remove();
  };
}

/**
 * Schedule a daily local reminder at 7 AM with today's job count.
 */
export async function scheduleDailyJobReminder(jobCount) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (jobCount <= 0) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Today\'s Jobs',
        body: `You have ${jobCount} job${jobCount === 1 ? '' : 's'} scheduled today.`,
        data: { type: 'daily_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 7,
        minute: 0,
      },
    });
  } catch (err) {
    console.error('Failed to schedule daily reminder:', err);
  }
}

/** Cancel all scheduled notifications (call on sign out). */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.error('Failed to cancel notifications:', err);
  }
}
