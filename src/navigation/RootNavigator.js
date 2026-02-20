import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

// Import + re-export from dedicated module to avoid circular imports
import { navigationRef } from './navigationRef';
export { navigationRef };
const Stack = createNativeStackNavigator();

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'scaffld://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            screens: {
              HomeScreen: 'home',
              JobDetail: 'jobs/:jobId',
              QuoteDetail: 'quotes/:quoteId',
              InvoiceDetail: 'invoices/:invoiceId',
              ClientDetail: 'clients/:clientId',
              ClockInOut: 'clock',
            },
          },
          Schedule: {
            screens: {
              ScheduleScreen: 'schedule',
            },
          },
          Search: {
            screens: {
              SearchScreen: 'search',
            },
          },
          More: {
            screens: {
              ClampChat: 'clamp',
            },
          },
        },
      },
    },
  },
};

const scaffldNavTheme = {
  dark: true,
  colors: {
    primary: colors.scaffld,
    background: colors.midnight,
    card: colors.charcoal,
    text: colors.white,
    border: colors.slate,
    notification: colors.coral,
  },
  fonts: {
    regular: { fontFamily: 'DMSans_400Regular', fontWeight: '400' },
    medium: { fontFamily: 'DMSans_500Medium', fontWeight: '500' },
    bold: { fontFamily: 'DMSans_700Bold', fontWeight: '700' },
    heavy: { fontFamily: 'DMSans_700Bold', fontWeight: '900' },
  },
};

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={colors.scaffld} />
    </View>
  );
}

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer theme={scaffldNavTheme} ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.midnight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
