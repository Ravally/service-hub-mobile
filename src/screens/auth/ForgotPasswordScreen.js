import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { colors, typeScale, fonts, spacing } from '../../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword, error, clearError } = useAuthStore();

  const handleReset = async () => {
    if (!email.trim()) return;
    try {
      setLoading(true);
      clearError();
      await resetPassword(email.trim());
      setSent(true);
    } catch {
      // error is set in store
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {sent
              ? 'Check your email for a password reset link.'
              : "Enter your email and we'll send you a reset link."}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Reset link sent to {email}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: { ...typeScale.h2, color: colors.white, marginBottom: spacing.sm },
  subtitle: { ...typeScale.bodySm, color: colors.muted, marginBottom: spacing.lg },
  label: {
    fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', color: colors.muted,
    marginBottom: spacing.xs, marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.charcoal, borderWidth: 1, borderColor: colors.slate,
    borderRadius: 10, padding: spacing.md, minHeight: 48,
    color: colors.white, fontFamily: fonts.primary.regular, fontSize: 16,
  },
  button: {
    backgroundColor: colors.trellio, borderRadius: 10, minHeight: 48,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontFamily: fonts.primary.semiBold, fontSize: 16 },
  linkButton: { alignItems: 'center', marginTop: spacing.lg, padding: spacing.sm },
  linkText: { color: colors.trellio, fontFamily: fonts.primary.medium, fontSize: 14 },
  errorBox: {
    backgroundColor: 'rgba(247,132,94,0.1)', borderWidth: 1,
    borderColor: 'rgba(247,132,94,0.3)', borderRadius: 8, padding: spacing.sm,
  },
  errorText: { color: colors.coral, fontFamily: fonts.primary.medium, fontSize: 14 },
  successBox: {
    backgroundColor: 'rgba(14,165,160,0.1)', borderWidth: 1,
    borderColor: 'rgba(14,165,160,0.3)', borderRadius: 8, padding: spacing.md,
  },
  successText: { color: colors.trellio, fontFamily: fonts.primary.medium, fontSize: 14 },
});
