import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { withErrorBoundary } from '../components/ui/ErrorBoundary';
import QuotesListScreen from '../screens/quotes/QuotesListScreen';
import QuoteDetailScreen from '../screens/quotes/QuoteDetailScreen';
import QuoteCreateScreen from '../screens/quotes/QuoteCreateScreen';

const SafeQuotesList = withErrorBoundary(QuotesListScreen);
const SafeQuoteDetail = withErrorBoundary(QuoteDetailScreen);
const SafeQuoteCreate = withErrorBoundary(QuoteCreateScreen);

const Stack = createNativeStackNavigator();

export default function QuoteStack() {
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
        name="QuotesList"
        component={SafeQuotesList}
        options={{ title: 'Quotes' }}
      />
      <Stack.Screen
        name="QuoteDetail"
        component={SafeQuoteDetail}
        options={{ title: 'Quote Details' }}
      />
      <Stack.Screen
        name="QuoteCreate"
        component={SafeQuoteCreate}
        options={{ title: 'New Quote' }}
      />
    </Stack.Navigator>
  );
}
