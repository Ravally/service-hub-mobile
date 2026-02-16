import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { withErrorBoundary } from '../components/ui/ErrorBoundary';
import MessageListScreen from '../screens/messages/MessageListScreen';
import ConversationScreen from '../screens/messages/ConversationScreen';

const SafeMessageList = withErrorBoundary(MessageListScreen);
const SafeConversation = withErrorBoundary(ConversationScreen);

const Stack = createNativeStackNavigator();

export default function MessageStack() {
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
        name="MessageList"
        component={SafeMessageList}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen
        name="Conversation"
        component={SafeConversation}
        options={{ title: 'Conversation' }}
      />
    </Stack.Navigator>
  );
}
