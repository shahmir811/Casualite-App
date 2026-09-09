import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { apiClient } from '@/lib/api-client';
import { useNotification } from '@/lib/notification-context';
import { SignupResponse } from '@/lib/types';

// Must match the web portal's dropdown exactly — the server 422s on anything
// outside this list. See ../casualos CLAUDE.md rule 5.34.
const COUNTRIES = [
  'Australia',
  'Bangladesh',
  'Canada',
  'Kuwait',
  'Oman',
  'Pakistan',
  'Qatar',
  'Saudi Arabia',
  'UAE',
  'UK',
  'USA',
];

export default function SignupScreen() {
  const router = useRouter();
  const { notify } = useNotification();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    contactNumber.trim().length > 0 &&
    city.trim().length > 0 &&
    country.trim().length > 0 &&
    email.trim().length > 0 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const data = await apiClient.post<SignupResponse>('/api/auth/signup', {
        name: name.trim(),
        contact_number: contactNumber.trim(),
        city: city.trim(),
        country,
        address: address.trim() || undefined,
        email: email.trim(),
      });
      notify({
        title: 'Request Submitted',
        message: data.message,
        variant: 'success',
        buttons: [{ text: 'OK', onPress: () => router.replace('/login') }],
      });
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
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Tell us a bit about yourself. Casual Lite will review your details and send you your
          portal link once approved.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your full name"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="03XX XXXXXXX"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="phone-pad"
            value={contactNumber}
            onChangeText={setContactNumber}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="Your city"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="words"
            value={city}
            onChangeText={setCity}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Country</Text>
          <Pressable style={styles.input} onPress={() => setCountryPickerVisible(true)}>
            <Text style={country ? styles.pickerValue : styles.pickerPlaceholder}>
              {country || 'Select your country'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Your address"
            placeholderTextColor={Colors.textTertiary}
            value={address}
            onChangeText={setAddress}
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
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </Pressable>

        <Pressable style={styles.signinLink} onPress={() => router.back()}>
          <Text style={styles.signinLinkText}>
            Already have an account? <Text style={styles.signinLinkTextEmphasis}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={countryPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCountryPickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCountryPickerVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.countryRow, pressed && styles.countryRowPressed]}
                  onPress={() => {
                    setCountry(item);
                    setCountryPickerVisible(false);
                  }}>
                  <Text style={styles.countryRowText}>{item}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  title: {
    fontSize: 22,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    textAlign: 'center',
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
    justifyContent: 'center',
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: Typography.weightRegular,
    color: Colors.textPrimary,
  },
  pickerPlaceholder: {
    fontSize: 16,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
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
  signinLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  signinLinkText: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: Colors.textSecondary,
  },
  signinLinkTextEmphasis: {
    fontWeight: Typography.weightSemibold,
    color: Colors.accent,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    maxHeight: '60%',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginBottom: Spacing.xs,
  },
  countryRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  countryRowPressed: {
    backgroundColor: Colors.surfacePressed,
  },
  countryRowText: {
    fontSize: 16,
    fontWeight: Typography.weightRegular,
    color: Colors.textPrimary,
  },
});
