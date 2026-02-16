import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { withErrorBoundary } from '../components/ui/ErrorBoundary';
import SearchScreen from '../screens/search/SearchScreen';
import ClientDetailScreen from '../screens/clients/ClientDetailScreen';
import ClientCreateScreen from '../screens/clients/ClientCreateScreen';
import QuoteDetailScreen from '../screens/quotes/QuoteDetailScreen';
import QuoteCreateScreen from '../screens/quotes/QuoteCreateScreen';
import InvoiceDetailScreen from '../screens/invoices/InvoiceDetailScreen';
import InvoiceCreateScreen from '../screens/invoices/InvoiceCreateScreen';
import CollectPaymentScreen from '../screens/invoices/CollectPaymentScreen';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';
import JobCreateScreen from '../screens/jobs/JobCreateScreen';
import JobFormScreen from '../screens/jobs/JobFormScreen';
import FormResponseViewScreen from '../screens/jobs/FormResponseViewScreen';
import PhotoMarkupScreen from '../screens/common/PhotoMarkupScreen';
import ExpenseCreateScreen from '../screens/expenses/ExpenseCreateScreen';

const SafeSearch = withErrorBoundary(SearchScreen);
const SafeClientDetail = withErrorBoundary(ClientDetailScreen);
const SafeClientCreate = withErrorBoundary(ClientCreateScreen);
const SafeQuoteDetail = withErrorBoundary(QuoteDetailScreen);
const SafeQuoteCreate = withErrorBoundary(QuoteCreateScreen);
const SafeInvoiceDetail = withErrorBoundary(InvoiceDetailScreen);
const SafeInvoiceCreate = withErrorBoundary(InvoiceCreateScreen);
const SafeCollectPayment = withErrorBoundary(CollectPaymentScreen);
const SafeJobDetail = withErrorBoundary(JobDetailScreen);
const SafeJobCreate = withErrorBoundary(JobCreateScreen);
const SafeJobForm = withErrorBoundary(JobFormScreen);
const SafeFormResponse = withErrorBoundary(FormResponseViewScreen);
const SafePhotoMarkup = withErrorBoundary(PhotoMarkupScreen);
const SafeExpenseCreate = withErrorBoundary(ExpenseCreateScreen);

const Stack = createNativeStackNavigator();

export default function SearchStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.midnight },
        headerTintColor: colors.scaffld,
        headerTitleStyle: { fontFamily: fonts.primary.semiBold, fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="SearchScreen" component={SafeSearch} options={{ headerShown: false }} />
      <Stack.Screen name="ClientDetail" component={SafeClientDetail} options={{ title: 'Client Details' }} />
      <Stack.Screen name="ClientCreate" component={SafeClientCreate} options={{ title: 'New Client' }} />
      <Stack.Screen name="QuoteDetail" component={SafeQuoteDetail} options={{ title: 'Quote Details' }} />
      <Stack.Screen name="QuoteCreate" component={SafeQuoteCreate} options={{ title: 'New Quote' }} />
      <Stack.Screen name="InvoiceDetail" component={SafeInvoiceDetail} options={{ title: 'Invoice Details' }} />
      <Stack.Screen name="InvoiceCreate" component={SafeInvoiceCreate} options={{ title: 'New Invoice' }} />
      <Stack.Screen name="CollectPayment" component={SafeCollectPayment} options={{ title: 'Collect Payment' }} />
      <Stack.Screen name="JobDetail" component={SafeJobDetail} options={{ title: 'Job Details' }} />
      <Stack.Screen name="JobCreate" component={SafeJobCreate} options={{ title: 'New Job' }} />
      <Stack.Screen name="JobForm" component={SafeJobForm} options={{ title: 'Fill Form' }} />
      <Stack.Screen name="FormResponseView" component={SafeFormResponse} options={{ title: 'Form Response' }} />
      <Stack.Screen name="PhotoMarkup" component={SafePhotoMarkup} options={{ headerShown: false }} />
      <Stack.Screen name="ExpenseCreate" component={SafeExpenseCreate} options={{ title: 'New Expense' }} />
    </Stack.Navigator>
  );
}
