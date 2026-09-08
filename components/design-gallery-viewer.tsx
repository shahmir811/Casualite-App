import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing, Typography } from '@/constants/theme';
import { formatCurrency } from '@/lib/format';
import { Design } from '@/lib/types';

// Full-screen, swipe-through-the-whole-catalogue viewer — tapping any tile
// on the grid opens here, and swiping keeps going into the next design
// rather than just zooming the one that was tapped. Sized off the window at
// mount rather than a hook, since this only ever opens in portrait.
const SCREEN_WIDTH = Dimensions.get('window').width;

export function DesignGalleryViewer({
  visible,
  designs,
  initialIndex,
  onClose,
}: {
  visible: boolean;
  designs: Design[];
  initialIndex: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const active = designs[activeIndex];

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <FlatList
          data={designs}
          keyExtractor={(item) => String(item.id)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
          onScroll={onScroll}
          scrollEventThrottle={32}
          renderItem={({ item }) => (
            <View style={styles.page}>
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.image} contentFit="contain" />
              ) : (
                <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.35)" />
              )}
            </View>
          )}
        />

        <Pressable
          style={[styles.closeButton, { top: insets.top + Spacing.sm }]}
          onPress={onClose}
          hitSlop={12}
          accessibilityLabel="Close">
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>

        {active ? (
          <View style={[styles.caption, { paddingBottom: insets.bottom + Spacing.md }]}>
            {designs.length > 1 ? (
              <Text style={styles.captionIndex}>
                {activeIndex + 1} / {designs.length}
              </Text>
            ) : null}
            <Text style={styles.captionName}>{active.name}</Text>
            <Text style={styles.captionPrice}>
              {formatCurrency(active.selling_price)}
              {active.discount_price ? `  ·  Bulk ${formatCurrency(active.discount_price)}` : ''}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  captionIndex: {
    fontSize: 11,
    fontWeight: Typography.weightSemibold,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  captionName: {
    fontSize: 18,
    fontWeight: Typography.weightSemibold,
    color: '#FFFFFF',
  },
  captionPrice: {
    fontSize: 14,
    fontWeight: Typography.weightRegular,
    color: 'rgba(255,255,255,0.85)',
  },
});
