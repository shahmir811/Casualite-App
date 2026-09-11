import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { CatalogueSummary } from '@/lib/types';

const SLIDE_INTERVAL_MS = 7000;
const CROSSFADE_MS = 900;

// Promotional carousel over Home — cycles through the most recent catalogues
// (caller passes at most 5, already newest-first from /api/catalogues, see
// CatalogueController@index's ->latest()) with the catalogue's own name.
// The CTA always opens the Catalogues list, not a specific catalogue — so
// unlike the eyebrow below, it doesn't need to know which slide is showing.
// `newestId` drives the one-off "NEW" eyebrow — it's always the first item
// of the *unfiltered* catalogue list the caller has, since that's the one
// true "most recently created" signal the API gives us; a catalogue missing
// a cover photo (and so absent from `catalogues` here) simply never gets the
// eyebrow rather than us guessing at a substitute image.
export function HomeHero({
  catalogues,
  newestId,
  onExplorePress,
}: {
  catalogues: CatalogueSummary[];
  newestId?: number;
  onExplorePress: () => void;
}) {
  const [index, setIndex] = useState(0);

  // Catalogue list can change size between refetches (e.g. one closes) —
  // clamp back to the first slide rather than pointing past the new end.
  useEffect(() => {
    setIndex(0);
  }, [catalogues.length]);

  useEffect(() => {
    if (catalogues.length < 2) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % catalogues.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [catalogues.length]);

  const current = catalogues[index] ?? null;

  return (
    <View style={styles.hero}>
      {current?.cover_photo_url ? (
        <Image
          source={{ uri: current.cover_photo_url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={CROSSFADE_MS}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallbackBackground]} />
      )}

      {current ? (
        <View style={styles.content}>
          {current.id === newestId ? (
            <View style={styles.eyebrowBacking}>
              <Text style={styles.eyebrow}>New</Text>
            </View>
          ) : null}
          <View style={styles.nameBacking}>
            <Text style={styles.name} numberOfLines={1}>
              {current.name}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.exploreButton, pressed && styles.exploreButtonPressed]}
            onPress={onExplorePress}>
            <Text style={styles.exploreText}>Explore Catalogues</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
          </Pressable>
        </View>
      ) : null}

      {catalogues.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {catalogues.map((item, i) => (
            <View key={item.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 224,
    borderRadius: Radius.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fallbackBackground: {
    backgroundColor: Colors.brandBlack,
  },
  content: {
    padding: Spacing.md,
    gap: 6,
  },
  // Tight dark backings behind just the eyebrow and title lines — not a
  // wash across the image — so the rest of the photo stays fully visible.
  eyebrowBacking: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11,11,12,0.55)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nameBacking: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11,11,12,0.55)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: Typography.weightSemibold,
    letterSpacing: 1.5,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 22,
    fontWeight: Typography.weightBold,
    color: '#FFFFFF',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  exploreButtonPressed: {
    opacity: 0.85,
  },
  exploreText: {
    fontSize: 14,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  dots: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
});
