import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { getInitials } from '../../utils';
import Badge from '../ui/Badge';

export default function ClientRow({ client, onPress }) {
  const initials = getInitials(client.name || client.email || '?');
  const phone = client.phone || '';

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{client.name || 'Unnamed'}</Text>
          <Badge status={client.status || 'Active'} />
        </View>
        {phone ? (
          <Text style={styles.phone}>{phone}</Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minHeight: 64,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.trellio,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontFamily: fonts.primary.bold,
    fontSize: 14,
    color: colors.white,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    ...typeScale.h4,
    color: colors.white,
    flex: 1,
  },
  phone: {
    ...typeScale.bodySm,
    color: colors.muted,
    marginTop: 2,
  },
});
