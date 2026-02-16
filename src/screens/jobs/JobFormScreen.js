import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFormTemplatesStore } from '../../stores/formTemplatesStore';
import { useFormResponsesStore } from '../../stores/formResponsesStore';
import { useJobsStore } from '../../stores/jobsStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { validateForm } from '../../utils/formValidation';
import { getCurrentLocation } from '../../services/location';
import { uploadImage } from '../../services/imageService';
import { getIsConnected } from '../../services/networkMonitor';
import FormFieldRenderer from '../../components/forms/FormFieldRenderer';
import Button from '../../components/ui/Button';
import { successNotification } from '../../utils/haptics';
import { colors, typeScale, fonts, spacing } from '../../theme';

export default function JobFormScreen({ route, navigation }) {
  const { templateId, jobId, clientId } = route.params || {};
  const template = useFormTemplatesStore((s) => s.getTemplateById(templateId));
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);

  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);
  const fieldRefs = useRef({});

  if (!template) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Form template not found</Text>
      </View>
    );
  }

  const fields = template.fields || [];

  const handleChange = (fieldId, value) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) setErrors((prev) => { const next = { ...prev }; delete next[fieldId]; return next; });
  };

  const handleSubmit = async () => {
    const result = validateForm(fields, responses);
    if (!result.valid) {
      setErrors(result.errors);
      showToast('Please fix the errors above', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // Upload photos (or defer if offline)
      const isOnline = getIsConnected();
      const attachments = [];
      const pendingPhotoUris = [];
      const finalResponses = { ...responses };
      for (const field of fields) {
        if (field.type === 'photo' && responses[field.id]) {
          const uri = responses[field.id];
          if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://')) {
            if (isOnline) {
              const path = `users/${userId}/forms/${templateId}/${field.id}_${Date.now()}.jpg`;
              const url = await uploadImage(uri, path);
              if (url) {
                finalResponses[field.id] = url;
                attachments.push({ fieldId: field.id, url, type: 'photo', uploadedAt: new Date().toISOString() });
              }
            } else {
              pendingPhotoUris.push({ fieldId: field.id, localUri: uri });
            }
          }
        }
        // Upload signature base64 data URIs
        if (field.type === 'signature' && responses[field.id]) {
          const sig = responses[field.id];
          if (sig.startsWith('data:') && isOnline) {
            const path = `users/${userId}/forms/${templateId}/${field.id}_sig_${Date.now()}.png`;
            const url = await uploadImage(sig, path);
            if (url) {
              finalResponses[field.id] = url;
              attachments.push({ fieldId: field.id, url, type: 'signature', uploadedAt: new Date().toISOString() });
            }
          }
        }
      }

      const loc = await getCurrentLocation();

      const responseId = await useFormResponsesStore.getState().submitResponse(userId, {
        templateId,
        jobId: jobId || null,
        clientId: clientId || null,
        submittedBy: userId,
        responses: finalResponses,
        attachments,
        location: loc ? { latitude: loc.lat, longitude: loc.lng, accuracy: loc.accuracy, timestamp: loc.timestamp } : null,
      }, pendingPhotoUris);

      if (jobId) {
        await useJobsStore.getState().addFormResponseToJob(userId, jobId, responseId);
      }

      successNotification();
      showToast(isOnline ? 'Form submitted!' : 'Form saved — will sync when online', 'success');
      navigation.goBack();
    } catch {
      showToast('Failed to submit form', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{template.name}</Text>
          {template.description ? <Text style={styles.description}>{template.description}</Text> : null}

          {fields.map((field) => (
            <View key={field.id} ref={(r) => { fieldRefs.current[field.id] = r; }}>
              <FormFieldRenderer
                field={field}
                value={responses[field.id]}
                error={errors[field.id]}
                onChange={(val) => handleChange(field.id, val)}
              />
            </View>
          ))}

          <Button
            title="Submit Form"
            variant="primary"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, backgroundColor: colors.midnight, alignItems: 'center', justifyContent: 'center' },
  notFound: { ...typeScale.h3, color: colors.muted },
  title: { ...typeScale.h2, color: colors.white, marginBottom: spacing.xs },
  description: { ...typeScale.bodySm, color: colors.muted, marginBottom: spacing.lg },
  submitBtn: { marginTop: spacing.lg, minHeight: 56 },
});
