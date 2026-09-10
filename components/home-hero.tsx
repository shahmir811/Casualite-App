import { Image } from 'expo-image';
import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

const SLIDE_INTERVAL_MS = 7000;
const CROSSFADE_MS = 900;

// Decorative backdrop for the Home greeting — cycles through open catalogue
// cover photos behind a dark overlay so the text on top stays readable.
// expo-image's `transition` prop crossfades automatically whenever `source`
// changes, so no manual Animated setup is needed.
export function HomeHero({ images, children }: { images: string[]; children: ReactNode }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <View style={styles.hero}>
      {images.length > 0 ? (
        <Image
          source={{ uri: images[index] }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={CROSSFADE_MS}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallbackBackground]} />
      )}
      <View style={styles.overlay} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 180,
    borderRadius: Radius.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fallbackBackground: {
    backgroundColor: Colors.brandBlack,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  content: {
    padding: 16,
  },
});
