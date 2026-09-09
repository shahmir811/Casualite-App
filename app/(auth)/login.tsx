import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

// Cropped and downsized from casualos/public/images/casualite-logo.png (the
// brand's actual mark, 500dpi source) — trimmed to its bounding box so it
// sits at a sensible size instead of the huge transparent margin the
// original export ships with.
const logoSource = require('../../assets/images/casualite-logo.png');

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [portalToken, setPortalToken] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = portalToken.trim().length > 0 && email.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(portalToken.trim(), email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.lg + insets.bottom + Spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Image source={logoSource} style={styles.logo} contentFit="contain" />
        <Text style={styles.subtitle}>
          Enter the portal link Casualite sent you and the email on your account.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Portal link</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste your portal link"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            value={portalToken}
            onChangeText={setPortalToken}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.button, (pressed || !canSubmit) && styles.buttonPressed]}
          onPress={handleSubmit}
          disabled={!canSubmit}>
          {submitting ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>

        <Pressable style={styles.signupLink} onPress={() => router.push('/signup')}>
          <Text style={styles.signupLinkText}>
            Don&apos;t have an account? <Text style={styles.signupLinkTextEmphasis}>Sign Up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  logo: {
    width: 220,
    height: 155,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: Typography.weightRegular,
    color: Colors.textPrimary,
  },
  error: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.error,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: Typography.weightSemibold,
  },
  signupLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  signupLinkText: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  signupLinkTextEmphasis: {
    fontWeight: Typography.weightSemibold,
    color: Colors.accent,
  },
});
