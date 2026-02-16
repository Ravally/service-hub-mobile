import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { withErrorBoundary } from '../components/ui/ErrorBoundary';
import SettingsScreen from '../screens/settings/SettingsScreen';
import MessageListScreen from '../screens/messages/MessageListScreen';
import ConversationScreen from '../screens/messages/ConversationScreen';
import ClockInOutScreen from '../screens/time/ClockInOutScreen';
import ExpenseCreateScreen from '../screens/expenses/ExpenseCreateScreen';

const SafeSettings = withErrorBoundary(SettingsScreen);
const SafeMessageList = withErrorBoundary(MessageListScreen);
const SafeConversation = withErrorBoundary(ConversationScreen);
const SafeClockInOut = withErrorBoundary(ClockInOutScreen);
const SafeExpenseCreate = withErrorBoundary(ExpenseCreateScreen);

const Stack = createNativeStackNavigator();

export default function MoreStack() {
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
        name="Settings"
        component={SafeSettings}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MessageList"
        component={SafeMessageList}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen
        name="Conversation"
        component={SafeConversation}
        options={{ title: 'Conversation' }}
      />
      <Stack.Screen
        name="ClockInOut"
        component={SafeClockInOut}
        options={{ title: 'Clock In/Out' }}
      />
      <Stack.Screen
        name="ExpenseCreate"
        component={SafeExpenseCreate}
        options={{ title: 'New Expense' }}
      />
    </Stack.Navigator>
  );
}
