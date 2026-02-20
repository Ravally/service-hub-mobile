import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { clampChatService } from '../../services/clampChatService';
import { navigationRef } from '../../navigation/navigationRef';
import ClampIcon from '../../components/clamp/ClampIcon';
import ClampChatMessage from '../../components/clamp/ClampChatMessage';
import ClampQuickChips from '../../components/clamp/ClampQuickChips';
import { colors, fonts, spacing, typeScale } from '../../theme';
import { mediumImpact } from '../../utils/haptics';

const WELCOME_CHIPS = [
  "Show today's schedule",
  'Find a client',
  'Create a new job',
  "What's overdue?",
];

let msgCounter = 0;
function nextId() { return `msg_${Date.now()}_${++msgCounter}`; }

export default function ClampChatScreen() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const flatListRef = useRef(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = useCallback(async (input) => {
    const trimmed = (input || text).trim();
    if (!trimmed || isThinking) return;

    mediumImpact();
    setText('');

    const userMsg = { id: nextId(), role: 'user', content: trimmed };
    const thinkingMsg = { id: 'thinking', role: 'clamp', content: '', isThinking: true };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setIsThinking(true);
    scrollToEnd();

    // Build API conversation history
    const apiMessages = [...messages, userMsg]
      .filter((m) => !m.isThinking)
      .map((m) => ({ role: m.role === 'clamp' ? 'assistant' : m.role, content: m.content }));

    try {
      const response = await clampChatService.send(apiMessages);
      const clampMsg = {
        id: nextId(),
        role: 'clamp',
        content: response.reply,
        actionCards: response.actionCards || [],
        quickReplies: response.quickReplies || [],
      };
      setMessages((prev) => prev.filter((m) => m.id !== 'thinking').concat(clampMsg));
    } catch (err) {
      const errorMsg = {
        id: nextId(),
        role: 'clamp',
        content: err.message || 'Clamp ran into a problem. Try again.',
      };
      setMessages((prev) => prev.filter((m) => m.id !== 'thinking').concat(errorMsg));
    } finally {
      setIsThinking(false);
      scrollToEnd();
    }
  }, [text, isThinking, messages, scrollToEnd]);

  const handleNavigate = useCallback((card) => {
    const nav = navigationRef.current;
    if (!nav) return;

    const { view, entityId, entityType } = card;

    // Entity detail screens — navigate into the Home tab
    if (entityId && entityType) {
      const detailMap = {
        client: { screen: 'ClientDetail', paramKey: 'clientId' },
        job: { screen: 'JobDetail', paramKey: 'jobId' },
        quote: { screen: 'QuoteDetail', paramKey: 'quoteId' },
        invoice: { screen: 'InvoiceDetail', paramKey: 'invoiceId' },
      };
      const detail = detailMap[entityType];
      if (detail) {
        nav.navigate('Home', {
          screen: detail.screen,
          params: { [detail.paramKey]: entityId },
        });
        return;
      }
    }

    // View-level navigation (no specific entity)
    const viewRoutes = {
      dashboard: { tab: 'Home', screen: 'HomeScreen' },
      clients: { tab: 'Home', screen: 'HomeScreen' },
      jobs: { tab: 'Home', screen: 'HomeScreen' },
      schedule: { tab: 'Schedule', screen: 'ScheduleScreen' },
      quotes: { tab: 'Home', screen: 'HomeScreen' },
      invoices: { tab: 'Home', screen: 'HomeScreen' },
      settings: { tab: 'More', screen: 'Settings' },
      expenses: { tab: 'Home', screen: 'HomeScreen' },
      timesheets: { tab: 'Home', screen: 'HomeScreen' },
      reports: { tab: 'Home', screen: 'HomeScreen' },
    };
    const route = viewRoutes[view];
    if (route) {
      nav.navigate(route.tab, { screen: route.screen });
    }
  }, []);

  const handleClear = useCallback(() => {
    mediumImpact();
    setMessages([]);
    setIsThinking(false);
  }, []);

  const lastClampMsg = [...messages].reverse().find((m) => m.role === 'clamp' && !m.isThinking);
  const quickReplies = lastClampMsg?.quickReplies || [];
  const showWelcome = messages.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 56}
      >
        {/* Messages or Welcome */}
        {showWelcome ? (
          <View style={styles.welcome}>
            <View style={styles.welcomeIcon}>
              <ClampIcon size={32} color={colors.clamp} />
            </View>
            <Text style={styles.welcomeTitle}>What can I help with?</Text>
            <Text style={styles.welcomeSubtitle}>Your AI Foreman</Text>
            <View style={styles.welcomeChips}>
              <ClampQuickChips chips={WELCOME_CHIPS} onSelect={handleSend} disabled={isThinking} />
            </View>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ClampChatMessage message={item} onNavigate={handleNavigate} />
              )}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollToEnd()}
            />
            {quickReplies.length > 0 && (
              <ClampQuickChips chips={quickReplies} onSelect={handleSend} disabled={isThinking} />
            )}
          </>
        )}

        {/* Input bar — always visible */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Ask Clamp..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={2000}
            editable={!isThinking}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || isThinking) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!text.trim() || isThinking}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={18} color={colors.midnight} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

ClampChatScreen.headerOptions = {
  title: 'Clamp',
  headerRight: () => null, // Will be set in navigation
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  flex: { flex: 1 },

  // Welcome
  welcome: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl,
  },
  welcomeIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.clampSoft, borderWidth: 1, borderColor: colors.clampBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  welcomeTitle: { ...typeScale.h2, color: colors.white, marginBottom: 4 },
  welcomeSubtitle: { ...typeScale.bodySm, color: colors.muted, marginBottom: spacing.lg },
  welcomeChips: { width: '100%' },

  // Messages
  messageList: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: 'rgba(45, 59, 78, 0.3)',
    gap: spacing.sm,
  },
  input: {
    flex: 1, backgroundColor: colors.charcoal,
    borderWidth: 1, borderColor: 'rgba(45, 59, 78, 0.5)',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: fonts.primary.regular, fontSize: 14, color: colors.white,
    minHeight: 44, maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.clamp,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
