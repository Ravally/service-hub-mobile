import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { useMessagesStore } from '../../stores/messagesStore';
import { colors, typeScale, fonts, spacing, shadows } from '../../theme';
import { getInitials } from '../../utils';
import { cancelAllNotifications } from '../../services/notificationService';
import { mediumImpact } from '../../utils/haptics';
import StatusPill from '../../components/common/StatusPill';

const MENU_SECTIONS = [
  {
    title: 'COMMUNICATION',
    items: [
      { key: 'messages', icon: 'chatbubbles-outline', label: 'Messages', screen: 'MessageList', showBadge: true },
    ],
  },
  {
    title: 'WORK',
    items: [
      { key: 'timesheet', icon: 'time-outline', label: 'Timesheet', screen: 'ClockInOut' },
    ],
  },
];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { userProfile, user, signOut, pushToken } = useAuthStore();
  const unreadCount = useMessagesStore((s) => s.getUnreadCount());

  const displayName = userProfile
    ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
    : '';
  const email = user?.email || '';
  const initials = getInitials(displayName || email);
  const role = userProfile?.role || 'member';
  const companyName = userProfile?.companyName || userProfile?.company || '';

  const handleSignOut = async () => {
    mediumImpact();
    await cancelAllNotifications();
    signOut();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>More</Text>

        {/* PROFILE CARD */}
        <TouchableOpacity style={styles.profileCard} activeOpacity={0.8}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName || 'User'}</Text>
            {companyName ? <Text style={styles.profileCompany}>{companyName}</Text> : null}
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </TouchableOpacity>

        {/* TRIAL BANNER */}
        {userProfile?.subscriptionStatus === 'trial' && userProfile?.trialStartDate && (
          <View style={styles.trialBanner}>
            <Ionicons name="hourglass-outline" size={18} color={colors.amber} />
            <View style={styles.trialInfo}>
              <Text style={styles.trialLabel}>Free Trial</Text>
              <Text style={styles.trialDays}>
                {Math.max(0, 14 - Math.floor((Date.now() - new Date(userProfile.trialStartDate).getTime()) / 86400000))} days remaining
              </Text>
            </View>
          </View>
        )}

        {/* MENU SECTIONS */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.menuGroup}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.menuRow,
                    idx === section.items.length - 1 && styles.menuRowLast,
                  ]}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon} size={18} color={colors.scaffld} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.showBadge && unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* SYSTEM INFO */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>SYSTEM</Text>
          <View style={styles.menuGroup}>
            <View style={styles.infoRow}>
              <View style={styles.menuIcon}>
                <Ionicons
                  name={pushToken ? 'notifications' : 'notifications-off-outline'}
                  size={18}
                  color={pushToken ? colors.scaffld : colors.muted}
                />
              </View>
              <Text style={styles.menuLabel}>Notifications</Text>
              <StatusPill status={pushToken ? 'Active' : 'Inactive'} />
            </View>
            <View style={[styles.infoRow, styles.menuRowLast]}>
              <View style={styles.menuIcon}>
                <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              </View>
              <Text style={styles.menuLabel}>App Version</Text>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.coral} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.md, paddingBottom: spacing['2xl'] },
  screenTitle: { ...typeScale.h1, color: colors.white, marginBottom: spacing.md },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.scaffld,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.primary.bold,
    fontSize: 18,
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 18,
    color: colors.white,
  },
  profileCompany: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.silver,
    marginTop: 2,
  },
  profileEmail: {
    fontFamily: fonts.primary.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(14,165,160,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleText: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    color: colors.scaffld,
    textTransform: 'capitalize',
  },

  // Trial
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,170,92,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,170,92,0.2)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  trialInfo: { flex: 1 },
  trialLabel: {
    fontFamily: fonts.primary.medium,
    fontSize: 13,
    color: colors.amber,
  },
  trialDays: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 15,
    color: colors.amber,
    marginTop: 2,
  },

  // Menu sections
  menuSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.sm,
    paddingLeft: 4,
  },
  menuGroup: {
    backgroundColor: colors.charcoal,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(14,165,160,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontFamily: fonts.primary.medium,
    fontSize: 15,
    color: colors.white,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.scaffld,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  unreadText: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    color: colors.white,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  versionText: {
    fontFamily: fonts.data.regular,
    fontSize: 13,
    color: colors.muted,
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.coral,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: spacing.sm,
    minHeight: 48,
  },
  signOutText: {
    fontFamily: fonts.primary.semiBold,
    fontSize: 16,
    color: colors.coral,
  },
});
