import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useMessagesStore } from '../../stores/messagesStore';
import { useClientsStore } from '../../stores/clientsStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { formatDate } from '../../utils';

export default function ConversationScreen({ route, navigation }) {
  const { clientId } = route.params || {};
  const clients = useClientsStore((s) => s.clients);
  const messages = useMessagesStore((s) => s.messages);
  const userId = useAuthStore((s) => s.userId);

  const client = useMemo(() => clients.find((c) => c.id === clientId) || null, [clients, clientId]);
  const threadMessages = useMemo(() =>
    messages
      .filter((m) => m.clientId === clientId)
      .sort((a, b) => {
        const dateA = a.sentAt ? new Date(a.sentAt) : new Date(0);
        const dateB = b.sentAt ? new Date(b.sentAt) : new Date(0);
        return dateA - dateB;
      }),
    [messages, clientId],
  );
  const showToast = useUiStore((s) => s.showToast);
  const listRef = useRef(null);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // Set header title
  useEffect(() => {
    navigation.setOptions({ title: client?.name || 'Conversation' });
  }, [client?.name, navigation]);

  // Mark inbound messages as read
  useEffect(() => {
    if (clientId && userId) {
      useMessagesStore.getState().markConversationRead(userId, clientId);
    }
  }, [clientId, userId, threadMessages.length]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || sending) return;

    // If client has a phone, open native SMS; otherwise just log
    if (client?.phone) {
      setSending(true);
      try {
        const encoded = encodeURIComponent(body);
        const smsUrl = `sms:${client.phone}?body=${encoded}`;
        const canOpen = await Linking.canOpenURL(smsUrl);
        if (canOpen) {
          await Linking.openURL(smsUrl);
        }
        await useMessagesStore.getState().sendMessage(userId, {
          clientId,
          body,
          channel: 'sms',
          phone: client.phone,
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setText('');
      } catch {
        showToast('Failed to send message', 'error');
      } finally {
        setSending(false);
      }
    } else {
      // No phone — just log the message
      try {
        await useMessagesStore.getState().sendMessage(userId, {
          clientId,
          body,
          channel: 'note',
        });
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setText('');
      } catch {
        showToast('Failed to save message', 'error');
      }
    }
  };

  const formatMsgTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
      <View style={styles.dateSeparator}>
        <Text style={styles.dateText}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    const isOutbound = item.direction === 'outbound';
    const isOnMyWay = item.type === 'on_my_way';

    // Date separator
    let showDate = false;
    if (index === 0) {
      showDate = true;
    } else {
      const prev = threadMessages[index - 1];
      const prevDate = new Date(prev.sentAt).toDateString();
      const curDate = new Date(item.sentAt).toDateString();
      if (prevDate !== curDate) showDate = true;
    }

    return (
      <>
        {showDate && renderDateSeparator(item.sentAt)}
        <View style={[styles.bubble, isOutbound ? styles.bubbleOut : styles.bubbleIn]}>
          {isOnMyWay && (
            <View style={styles.typeTag}>
              <Ionicons name="car-outline" size={12} color={colors.scaffld} />
              <Text style={styles.typeTagText}>On My Way</Text>
            </View>
          )}
          <Text style={[styles.msgText, isOutbound ? styles.msgTextOut : styles.msgTextIn]}>
            {item.body}
          </Text>
          <Text style={styles.msgTime}>{formatMsgTime(item.sentAt)}</Text>
        </View>
      </>
    );
  };

  if (!client) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Client not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={threadMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyThread}>
            <Text style={styles.emptyText}>No messages with {client.name || 'this client'} yet</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={client.phone ? 'Type a message...' : 'Add a note...'}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          activeOpacity={0.7}
        >
          <Ionicons
            name={client.phone ? 'send' : 'checkmark'}
            size={20}
            color={text.trim() && !sending ? colors.white : colors.muted}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  center: { flex: 1, backgroundColor: colors.midnight, alignItems: 'center', justifyContent: 'center' },
  notFound: { ...typeScale.h3, color: colors.muted },
  list: { flex: 1 },
  listContent: { padding: spacing.md, paddingBottom: spacing.sm },
  dateSeparator: { alignItems: 'center', marginVertical: spacing.md },
  dateText: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 1, color: colors.muted, textTransform: 'uppercase' },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm },
  bubbleOut: {
    alignSelf: 'flex-end', backgroundColor: colors.scaffld + '1A',
    borderBottomRightRadius: 4, borderWidth: 1, borderColor: colors.scaffld + '33',
  },
  bubbleIn: {
    alignSelf: 'flex-start', backgroundColor: colors.charcoal,
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.slate,
  },
  typeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  typeTagText: { fontFamily: fonts.data.medium, fontSize: 10, letterSpacing: 1, color: colors.scaffld, textTransform: 'uppercase' },
  msgText: { ...typeScale.bodySm, lineHeight: 20 },
  msgTextOut: { color: colors.white },
  msgTextIn: { color: colors.silver },
  msgTime: { fontFamily: fonts.data.regular, fontSize: 10, color: colors.muted, marginTop: 4, alignSelf: 'flex-end' },
  emptyThread: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { ...typeScale.bodySm, color: colors.muted },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.slate,
    backgroundColor: colors.charcoal,
  },
  input: {
    flex: 1, ...typeScale.body, color: colors.white, backgroundColor: colors.midnight,
    borderRadius: 20, borderWidth: 1, borderColor: colors.slate,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    maxHeight: 100, minHeight: 44,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.scaffld,
    alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.slate },
});
