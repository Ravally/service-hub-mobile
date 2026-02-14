import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { withErrorBoundary } from '../components/ui/ErrorBoundary';
import JobStack from './JobStack';
import ClientStack from './ClientStack';
import ClockInOutScreen from '../screens/time/ClockInOutScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const SafeClockInOut = withErrorBoundary(ClockInOutScreen);
const SafeSettings = withErrorBoundary(SettingsScreen);

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Today: { focused: 'calendar', unfocused: 'calendar-outline' },
  Clients: { focused: 'people', unfocused: 'people-outline' },
  Clock: { focused: 'timer', unfocused: 'timer-outline' },
  More: { focused: 'menu', unfocused: 'menu-outline' },
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.trellio,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.charcoal,
          borderTopColor: colors.slate,
          borderTopWidth: 0.5,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.data.medium,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      })}
    >
      <Tab.Screen name="Today" component={JobStack} />
      <Tab.Screen name="Clients" component={ClientStack} />
      <Tab.Screen name="Clock" component={SafeClockInOut} />
      <Tab.Screen name="More" component={SafeSettings} />
    </Tab.Navigator>
  );
}
