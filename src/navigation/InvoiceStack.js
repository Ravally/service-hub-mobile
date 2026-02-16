import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { withErrorBoundary } from '../components/ui/ErrorBoundary';
import InvoicesListScreen from '../screens/invoices/InvoicesListScreen';
import InvoiceDetailScreen from '../screens/invoices/InvoiceDetailScreen';
import InvoiceCreateScreen from '../screens/invoices/InvoiceCreateScreen';
import CollectPaymentScreen from '../screens/invoices/CollectPaymentScreen';

const SafeInvoicesList = withErrorBoundary(InvoicesListScreen);
const SafeInvoiceDetail = withErrorBoundary(InvoiceDetailScreen);
const SafeInvoiceCreate = withErrorBoundary(InvoiceCreateScreen);
const SafeCollectPayment = withErrorBoundary(CollectPaymentScreen);

const Stack = createNativeStackNavigator();

export default function InvoiceStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.midnight },
        headerTintColor: colors.scaffld,
        headerTitleStyle: { fontFamily: fonts.primary.semiBold, fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="InvoicesList"
        component={SafeInvoicesList}
        options={{ title: 'Invoices' }}
      />
      <Stack.Screen
        name="InvoiceDetail"
        component={SafeInvoiceDetail}
        options={{ title: 'Invoice Details' }}
      />
      <Stack.Screen
        name="InvoiceCreate"
        component={SafeInvoiceCreate}
        options={{ title: 'New Invoice' }}
      />
      <Stack.Screen
        name="CollectPayment"
        component={SafeCollectPayment}
        options={{ title: 'Collect Payment' }}
      />
    </Stack.Navigator>
  );
}
