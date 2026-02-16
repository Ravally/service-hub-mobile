import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMessagesStore } from '../../stores/messagesStore';
import { useClientsStore } from '../../stores/clientsStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { getInitials } from '../../utils';

export default function MessageListScreen({ navigation }) {
  const conversations = useMessagesStore((s) => s.getConversations());
  const messages = useMessagesStore((s) => s.messages);
  const loading = useMessagesStore((s) => s.loading);

  const enriched = useMemo(() => {
    return conversations.map((conv) => {
      const client = useClientsStore.getState().getClientById(conv.clientId);
      const unread = messages.filter(
        (m) => m.clientId === conv.clientId && m.direction === 'inbound' && !m.readAt,
      ).length;
      return { ...conv, client, unread };
    });
  }, [conversations, messages]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }) => {
    const { client, lastMessage, unread } = item;
    const name = client?.name || 'Unknown Client';
    const initials = getInitials(name);
    const isOutbound = lastMessage.direction === 'outbound';
    const preview = isOutbound ? `You: ${lastMessage.body}` : lastMessage.body;
    const typeIcon = lastMessage.type === 'on_my_way' ? 'car-outline' : 'chatbubble-outline';

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('Conversation', { clientId: item.clientId })}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, unread > 0 && styles.avatarUnread]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.name, unread > 0 && styles.nameUnread]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.time}>{formatTime(lastMessage.sentAt)}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Ionicons name={typeIcon} size={14} color={colors.muted} style={styles.typeIcon} />
            <Text style={[styles.preview, unread > 0 && styles.previewUnread]} numberOfLines={1}>
              {preview}
            </Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!loading && enriched.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.slate} />
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptyDesc}>
          Messages will appear here when you send an "On My Way" text or message a client.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={enriched}
      keyExtractor={(item) => item.clientId}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  list: { paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, minHeight: 72,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.charcoal,
    borderWidth: 1, borderColor: colors.slate,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  avatarUnread: { borderColor: colors.scaffld },
  avatarText: { fontFamily: fonts.primary.semiBold, fontSize: 14, color: colors.silver },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { ...typeScale.body, color: colors.white, flex: 1, marginRight: spacing.sm },
  nameUnread: { fontFamily: fonts.primary.semiBold },
  time: { fontFamily: fonts.data.regular, fontSize: 12, color: colors.muted },
  bottomRow: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { marginRight: 6 },
  preview: { ...typeScale.bodySm, color: colors.muted, flex: 1 },
  previewUnread: { color: colors.silver },
  badge: {
    backgroundColor: colors.scaffld, borderRadius: 10, minWidth: 20, height: 20,
    paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm,
  },
  badgeText: { fontFamily: fonts.data.medium, fontSize: 11, color: colors.white },
  empty: {
    flex: 1, backgroundColor: colors.midnight, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { ...typeScale.h3, color: colors.muted, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyDesc: { ...typeScale.bodySm, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
