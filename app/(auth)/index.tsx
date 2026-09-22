import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

const logoSource = require('../../assets/images/casualite-logo.png');

const CASUALITE_WEBSITE_URL = 'https://casualite.co';

type Destination = {
  number: string;
  title: string;
  subtitle: string;
  bullets: string[];
  buttonBg: string;
  iconColor: string;
  caption: string;
  onPress: () => void;
};

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const destinations: Destination[] = [
    {
      number: '01',
      title: 'OPERATIONS',
      subtitle: 'FOR THE CASUALITE TEAM',
      bullets: ['CATALOGUES', 'PRODUCTION', 'ORDERS', 'INVENTORY AND MORE'],
      buttonBg: Colors.accent,
      iconColor: Colors.surface,
      caption: 'TEAM ACCESS ONLY',
      onPress: () => router.push('/login'),
    },
    {
      number: '02',
      title: 'WHOLESALE',
      subtitle: 'FOR REGISTERED RETAIL PARTNERS',
      bullets: ['EXPLORE COLLECTIONS', 'PLACE ORDERS', 'TRACK PROGRESS', 'MANAGE YOUR ACCOUNT'],
      buttonBg: Colors.textSecondary,
      iconColor: Colors.surface,
      caption: 'FOR OUR PARTNERS',
      onPress: () => router.push('/login'),
    },
    {
      number: '03',
      title: 'CASUALITE.CO',
      subtitle: 'FOR INDIVIDUAL CUSTOMERS',
      bullets: ['SHOP NEW ARRIVALS', 'EXPLORE COLLECTIONS', 'SEASONAL EDITS', 'FASHION FOR EVERY STORY'],
      buttonBg: Colors.highlightSoft,
      iconColor: Colors.textPrimary,
      caption: 'FOR EVERYONE',
      onPress: () => Linking.openURL(CASUALITE_WEBSITE_URL),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}>
      <Image source={logoSource} style={styles.logo} contentFit="contain" />

      <Text style={styles.headline}>ONE BRAND.{'\n'}THREE EXPERIENCES.</Text>
      <View style={styles.headlineRule} />
      <Text style={styles.eyebrow}>SELECT YOUR DESTINATION</Text>

      <View style={styles.cards}>
        {destinations.map((destination) => (
          <View key={destination.number} style={styles.card}>
            <Text style={styles.cardNumber}>{destination.number}</Text>
            <View style={styles.cardNumberRule} />
            <Text style={styles.cardTitle}>{destination.title}</Text>
            <Text style={styles.cardSubtitle}>{destination.subtitle}</Text>

            <View style={styles.cardDivider} />

            <View style={styles.bulletList}>
              {destination.bullets.map((bullet) => (
                <Text key={bullet} style={styles.bullet}>
                  {bullet}
                </Text>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.arrowButton,
                { backgroundColor: destination.buttonBg },
                pressed && styles.arrowButtonPressed,
              ]}
              onPress={destination.onPress}>
              <Ionicons name="arrow-forward" size={20} color={destination.iconColor} />
            </Pressable>

            <Text style={styles.cardCaption}>{destination.caption}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerRule} />
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>EST. 2018</Text>
          <Text style={styles.footerText}>CASUALITE.CO</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  logo: {
    width: 140,
    height: 98,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  headline: {
    fontSize: 26,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
  headlineRule: {
    width: 32,
    height: 1,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  cards: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  cardNumber: {
    fontSize: 28,
    fontWeight: Typography.weightBold,
    color: Colors.textTertiary,
  },
  cardNumberRule: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: Typography.weightSemibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 4,
    textAlign: 'center',
  },
  cardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  bulletList: {
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  bullet: {
    fontSize: 12,
    fontWeight: Typography.weightMedium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  arrowButtonPressed: {
    opacity: 0.7,
  },
  cardCaption: {
    fontSize: 11,
    fontWeight: Typography.weightSemibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footer: {
    marginTop: Spacing.xl,
  },
  footerRule: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
    fontWeight: Typography.weightSemibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
