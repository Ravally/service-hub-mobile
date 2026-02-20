import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const TIMER_NOTIFICATION_ID = 'timer_reminder';
const DAILY_NOTIFICATION_ID = 'daily_job_reminder';

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
      return null;
    }

    // Remote push notifications are unavailable in Expo Go (removed in SDK 53)
    if (Constants.appOwnership === 'expo') {
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
        name: 'Scaffld',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0EA5A0',
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
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
    console.warn('Push notifications unavailable:', err.message);
    return null;
  }
}

/**
 * Setup handlers for foreground and tap responses.
 * Call once on app mount. Returns cleanup function.
 */
export function setupNotificationHandlers(navigationRef) {
  // Foreground — notification appears as banner (handled by setNotificationHandler above)
  const foregroundSub = Notifications.addNotificationReceivedListener(() => {
    // Foreground display handled by setNotificationHandler above
  });

  // Tap — navigate to relevant screen
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    const nav = navigationRef?.current;
    if (!nav) return;

    try {
      if (data.jobId) {
        nav.navigate('Home', { screen: 'JobDetail', params: { jobId: data.jobId } });
      } else if (data.quoteId) {
        nav.navigate('Search', { screen: 'QuoteDetail', params: { quoteId: data.quoteId } });
      } else if (data.invoiceId) {
        nav.navigate('Search', { screen: 'InvoiceDetail', params: { invoiceId: data.invoiceId } });
      } else if (data.messageClientId) {
        nav.navigate('More', { screen: 'Conversation', params: { clientId: data.messageClientId } });
      } else if (data.clientId) {
        nav.navigate('Search', { screen: 'ClientDetail', params: { clientId: data.clientId } });
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
 * Fire an immediate local notification.
 */
export async function showLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
  } catch (err) {
    console.error('Failed to show local notification:', err);
  }
}

/**
 * Schedule a reminder 10 hours after clock-in.
 */
export async function scheduleTimerReminder() {
  try {
    await cancelTimerReminder();
    await Notifications.scheduleNotificationAsync({
      identifier: TIMER_NOTIFICATION_ID,
      content: {
        title: 'Still Clocked In',
        body: "You've been clocked in for over 10 hours. Don't forget to clock out!",
        data: { type: 'timer_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10 * 3600,
      },
    });
  } catch (err) {
    console.error('Failed to schedule timer reminder:', err);
  }
}

/** Cancel the timer reminder notification. */
export async function cancelTimerReminder() {
  try {
    await Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID);
  } catch {
    // Ignore — notification may not exist
  }
}

/**
 * Schedule a daily local reminder at 7 AM with today's job count.
 */
export async function scheduleDailyJobReminder(jobCount) {
  try {
    // Cancel only the daily reminder, not all scheduled notifications
    try {
      await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID);
    } catch {
      // Ignore if it doesn't exist
    }

    if (jobCount <= 0) return;

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_NOTIFICATION_ID,
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
