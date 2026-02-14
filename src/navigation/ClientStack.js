import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { withErrorBoundary } from '../components/ui/ErrorBoundary';
import ClientListScreen from '../screens/clients/ClientListScreen';
import ClientDetailScreen from '../screens/clients/ClientDetailScreen';

const SafeClientList = withErrorBoundary(ClientListScreen);
const SafeClientDetail = withErrorBoundary(ClientDetailScreen);

const Stack = createNativeStackNavigator();

export default function ClientStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.midnight },
        headerTintColor: colors.trellio,
        headerTitleStyle: { fontFamily: fonts.primary.semiBold, fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ClientList"
        component={SafeClientList}
        options={{ title: 'Clients' }}
      />
      <Stack.Screen
        name="ClientDetail"
        component={SafeClientDetail}
        options={{ title: 'Client Details' }}
      />
    </Stack.Navigator>
  );
}
