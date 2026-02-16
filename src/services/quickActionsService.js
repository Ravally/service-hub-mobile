import { Platform } from 'react-native';
import * as QuickActions from 'expo-quick-actions';

const ACTIONS = [
  {
    id: 'clock',
    title: 'Clock In/Out',
    subtitle: Platform.OS === 'ios' ? 'Start or stop your timer' : undefined,
    icon: Platform.OS === 'ios' ? 'symbol:timer' : undefined,
  },
  {
    id: 'schedule',
    title: "Today's Schedule",
    subtitle: Platform.OS === 'ios' ? 'View your jobs for today' : undefined,
    icon: Platform.OS === 'ios' ? 'symbol:calendar' : undefined,
  },
  {
    id: 'newQuote',
    title: 'New Quote',
    subtitle: Platform.OS === 'ios' ? 'Create a new quote' : undefined,
    icon: Platform.OS === 'ios' ? 'symbol:doc.text' : undefined,
  },
];

/** Register quick action items on the home screen icon. */
export async function registerQuickActions() {
  try {
    const supported = await QuickActions.isSupported();
    if (!supported) return;
    await QuickActions.setItems(ACTIONS);
  } catch {
    // Quick actions not available (e.g. Expo Go)
  }
}

/** Navigate based on a quick action selection. */
export function handleQuickAction(action, navigationRef) {
  if (!action?.id || !navigationRef?.current) return;
  const nav = navigationRef.current;

  setTimeout(() => {
    switch (action.id) {
      case 'clock':
        nav.navigate('Main', {
          screen: 'More',
          params: { screen: 'ClockInOut' },
        });
        break;
      case 'schedule':
        nav.navigate('Main', { screen: 'Schedule' });
        break;
      case 'newQuote':
        nav.navigate('Main', {
          screen: 'Search',
          params: { screen: 'QuoteCreate' },
        });
        break;
    }
  }, 300);
}

/** Check if the app was cold-launched from a quick action. */
export function getInitialQuickAction() {
  try {
    return QuickActions.initial || null;
  } catch {
    return null;
  }
}
