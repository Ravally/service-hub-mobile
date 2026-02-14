import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { getInitials } from '../../utils';
import { cancelAllNotifications } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function SettingsScreen() {
  const { userProfile, user, signOut, pushToken } = useAuthStore();
  const displayName = userProfile
    ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
    : '';
  const email = user?.email || '';
  const initials = getInitials(displayName || email);
  const role = userProfile?.role || 'member';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{displayName || 'User'}</Text>
              <Text style={styles.email}>{email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{role}</Text>
              </View>
            </View>
          </View>
        </Card>

        {userProfile?.subscriptionStatus === 'trial' && userProfile?.trialStartDate && (
          <Card style={styles.trialCard}>
            <Text style={styles.trialLabel}>Free Trial</Text>
            <Text style={styles.trialDays}>
              {Math.max(0, 14 - Math.floor((Date.now() - new Date(userProfile.trialStartDate).getTime()) / 86400000))} days remaining
            </Text>
          </Card>
        )}

        <Card style={styles.notifCard}>
          <View style={styles.notifRow}>
            <Ionicons
              name={pushToken ? 'notifications' : 'notifications-off-outline'}
              size={20}
              color={pushToken ? colors.trellio : colors.muted}
            />
            <View style={styles.notifInfo}>
              <Text style={styles.infoLabel}>NOTIFICATIONS</Text>
              <Text style={[styles.infoValue, pushToken && styles.notifEnabled]}>
                {pushToken ? 'Enabled' : 'Not enabled'}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>APP VERSION</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </Card>

        <Button
          title="Sign Out"
          variant="danger"
          onPress={async () => { await cancelAllNotifications(); signOut(); }}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg },
  title: { ...typeScale.h1, color: colors.white, marginBottom: spacing.lg },
  profileCard: { marginBottom: spacing.md },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.trellio, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.primary.bold, fontSize: 20, color: colors.white },
  profileInfo: { marginLeft: spacing.md, flex: 1 },
  name: { ...typeScale.h4, color: colors.white },
  email: { ...typeScale.bodySm, color: colors.muted, marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: spacing.xs,
    backgroundColor: 'rgba(14,165,160,0.15)', paddingHorizontal: 10, paddingVertical: 2,
    borderRadius: 9999,
  },
  roleText: {
    fontFamily: fonts.data.medium, fontSize: 11, color: colors.trellio,
    textTransform: 'capitalize',
  },
  trialCard: { marginBottom: spacing.md },
  trialLabel: { ...typeScale.bodySm, color: colors.amber },
  trialDays: { ...typeScale.h4, color: colors.amber, marginTop: spacing.xs },
  notifCard: { marginBottom: spacing.md },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  notifInfo: { flex: 1 },
  notifEnabled: { color: colors.trellio },
  infoCard: { marginBottom: spacing.lg },
  infoLabel: {
    fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.xs,
  },
  infoValue: { ...typeScale.bodySm, color: colors.silver },
  logoutButton: { marginTop: spacing.sm },
});
