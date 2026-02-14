import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useClientsStore } from '../../stores/clientsStore';
import { useJobsStore } from '../../stores/jobsStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { getInitials, formatDate } from '../../utils';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function ClientDetailScreen({ route, navigation }) {
  const { clientId } = route.params || {};
  const client = useClientsStore((s) => s.getClientById(clientId));
  const jobs = useJobsStore((s) => s.jobs);

  const clientJobs = useMemo(() => {
    return jobs.filter((j) => j.clientId === clientId && !j.archived);
  }, [jobs, clientId]);

  if (!client) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Client not found</Text>
      </View>
    );
  }

  const initials = getInitials(client.name || client.email || '?');
  const properties = client.properties || [];

  const handleCall = () => {
    if (client.phone) Linking.openURL(`tel:${client.phone}`);
  };

  const handleEmail = () => {
    if (client.email) Linking.openURL(`mailto:${client.email}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{client.name || 'Unnamed'}</Text>
          <Badge status={client.status || 'Active'} />
        </View>
      </View>

      {client.email ? (
        <Text style={styles.contactText}>{client.email}</Text>
      ) : null}
      {client.phone ? (
        <Text style={styles.contactText}>{client.phone}</Text>
      ) : null}
      {client.address ? (
        <Text style={styles.addressText}>{client.address}</Text>
      ) : null}

      {/* Contact Actions */}
      <View style={styles.actions}>
        {client.phone ? (
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.7}>
            <Ionicons name="call-outline" size={20} color={colors.trellio} />
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
        ) : null}
        {client.email ? (
          <TouchableOpacity style={styles.actionBtn} onPress={handleEmail} activeOpacity={0.7}>
            <Ionicons name="mail-outline" size={20} color={colors.trellio} />
            <Text style={styles.actionLabel}>Email</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tags */}
      {client.tags?.length > 0 && (
        <View style={styles.tagsRow}>
          {client.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Properties */}
      {properties.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>
            PROPERTIES ({properties.length})
          </Text>
          {properties.map((prop, i) => (
            <View key={prop.uid || i} style={styles.propRow}>
              <Ionicons name="home-outline" size={16} color={colors.muted} />
              <View style={styles.propInfo}>
                <Text style={styles.propName}>{prop.label || 'Property'}</Text>
                <Text style={styles.propAddr}>
                  {[prop.street1, prop.city, prop.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Related Jobs */}
      {clientJobs.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>JOBS ({clientJobs.length})</Text>
          {clientJobs.slice(0, 10).map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobRow}
              onPress={() => navigation.navigate('Today', {
                screen: 'JobDetail',
                params: { jobId: job.id },
              })}
              activeOpacity={0.7}
            >
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle} numberOfLines={1}>
                  {job.title || 'Untitled'}
                </Text>
                <Text style={styles.jobDate}>{formatDate(job.start)}</Text>
              </View>
              <Badge status={job.status} />
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Notes */}
      {client.notes ? (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>NOTES</Text>
          <Text style={styles.notes}>{client.notes}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, backgroundColor: colors.midnight, alignItems: 'center', justifyContent: 'center' },
  notFound: { ...typeScale.h3, color: colors.muted },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.trellio, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { fontFamily: fonts.primary.bold, fontSize: 20, color: colors.white },
  headerInfo: { flex: 1 },
  name: { ...typeScale.h2, color: colors.white, marginBottom: 4 },
  contactText: { ...typeScale.bodySm, color: colors.muted, marginLeft: 72 },
  addressText: { ...typeScale.bodySm, color: colors.muted, marginLeft: 72, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.md },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.charcoal, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.slate, minHeight: 48,
  },
  actionLabel: { ...typeScale.bodySm, color: colors.trellio },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  tag: { backgroundColor: colors.trellioSubtle, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontFamily: fonts.data.medium, fontSize: 11, color: colors.trellio },
  section: { marginTop: spacing.md },
  sectionLabel: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.sm },
  propRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  propInfo: { marginLeft: 8, flex: 1 },
  propName: { ...typeScale.bodySm, color: colors.silver },
  propAddr: { ...typeScale.bodySm, color: colors.muted, marginTop: 2 },
  jobRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, minHeight: 48 },
  jobInfo: { flex: 1, marginRight: spacing.sm },
  jobTitle: { ...typeScale.bodySm, color: colors.silver },
  jobDate: { ...typeScale.bodySm, color: colors.muted, marginTop: 2, fontSize: 12 },
  notes: { ...typeScale.bodySm, color: colors.silver },
});
