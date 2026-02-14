import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFormResponsesStore } from '../../stores/formResponsesStore';
import { useFormTemplatesStore } from '../../stores/formTemplatesStore';
import { formatDate } from '../../utils';
import Card from '../../components/ui/Card';
import { colors, typeScale, fonts, spacing } from '../../theme';

export default function FormResponseViewScreen({ route }) {
  const { responseId } = route.params || {};
  const response = useFormResponsesStore((s) => s.getResponseById(responseId));
  const template = useFormTemplatesStore((s) =>
    response ? s.getTemplateById(response.templateId) : null,
  );

  if (!response) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Response not found</Text>
      </View>
    );
  }

  const fields = template?.fields || [];
  const data = response.responses || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{template?.name || 'Form Response'}</Text>
      <Text style={styles.date}>Submitted {formatDate(response.submittedAt)}</Text>

      {response.location && (
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={colors.trellio} />
          <Text style={styles.locationText}>Location captured</Text>
        </View>
      )}

      <Card style={styles.card}>
        {fields.filter((f) => f.type !== 'section_header').map((field) => {
          const val = data[field.id];
          return (
            <View key={field.id} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              {field.type === 'photo' && val ? (
                <Image source={{ uri: val }} style={styles.photo} />
              ) : (
                <Text style={styles.fieldValue}>
                  {formatValue(val)}
                </Text>
              )}
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

function formatValue(val) {
  if (val === undefined || val === null || val === '') return '—';
  if (Array.isArray(val)) return val.join(', ') || '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, backgroundColor: colors.midnight, alignItems: 'center', justifyContent: 'center' },
  notFound: { ...typeScale.h3, color: colors.muted },
  title: { ...typeScale.h2, color: colors.white, marginBottom: spacing.xs },
  date: { ...typeScale.bodySm, color: colors.muted, marginBottom: spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  locationText: { ...typeScale.bodySm, color: colors.trellio },
  card: { marginTop: spacing.sm },
  fieldRow: { marginBottom: spacing.md },
  fieldLabel: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.xs },
  fieldValue: { ...typeScale.body, color: colors.white },
  photo: { width: '100%', height: 200, borderRadius: 10, marginTop: spacing.xs },
});
