import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import {
  isBiometricAvailable, getBiometricLabel, authenticateWithBiometric,
  saveCredentials, getStoredCredentials, isBiometricEnabled,
} from '../../services/biometricService';
import { colors, typeScale, fonts, spacing } from '../../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState(null);
  const [biometricReady, setBiometricReady] = useState(false);
  const { signIn, error, clearError } = useAuthStore();

  // Check biometric availability on mount and auto-prompt
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      if (!available || !enabled || cancelled) return;

      const label = await getBiometricLabel();
      if (!cancelled) {
        setBiometricLabel(label);
        setBiometricReady(true);
      }

      // Auto-prompt biometric on first mount
      handleBiometricLogin();
    })();
    return () => { cancelled = true; };
  }, []);

  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      clearError();
      const credentials = await getStoredCredentials();
      if (!credentials) {
        setLoading(false);
        return;
      }
      const success = await authenticateWithBiometric();
      if (!success) {
        setLoading(false);
        return;
      }
      await signIn(credentials.email, credentials.password);
    } catch {
      // Biometric failed or credentials stale — fall back to password
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    try {
      setLoading(true);
      clearError();
      await signIn(email.trim(), password);
      // On successful login, offer to save credentials for biometric
      const available = await isBiometricAvailable();
      if (available) {
        await saveCredentials(email.trim(), password);
      }
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>scaffld</Text>
            <Text style={styles.tagline}>Build on Scaffld.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Sign In</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {biometricReady && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={biometricLabel === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
                  size={22}
                  color={colors.scaffld}
                />
                <Text style={styles.biometricText}>Sign in with {biometricLabel}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    fontSize: 40,
    fontFamily: fonts.primary.bold,
    color: colors.scaffld,
    letterSpacing: -1,
  },
  tagline: {
    ...typeScale.bodySm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.charcoal,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  title: { ...typeScale.h2, color: colors.white, marginBottom: spacing.lg },
  label: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.midnight,
    borderWidth: 1,
    borderColor: colors.slate,
    borderRadius: 10,
    padding: spacing.md,
    minHeight: 48,
    color: colors.white,
    fontFamily: fonts.primary.regular,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.scaffld,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.primary.semiBold,
    fontSize: 16,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    marginTop: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate,
  },
  biometricText: {
    color: colors.scaffld,
    fontFamily: fonts.primary.medium,
    fontSize: 15,
  },
  linkButton: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  linkText: { color: colors.scaffld, fontFamily: fonts.primary.medium, fontSize: 14 },
  errorBox: {
    backgroundColor: 'rgba(247, 132, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(247, 132, 94, 0.3)',
    borderRadius: 8,
    padding: spacing.sm,
  },
  errorText: { color: colors.coral, fontFamily: fonts.primary.medium, fontSize: 14 },
});
