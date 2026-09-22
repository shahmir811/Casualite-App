import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

// The native stack header only draws a back button when the current screen
// has real back history. Detail screens reachable by a cross-navigator jump
// — Home's announcement banner (a Drawer.Screen jump, not a stack push) or a
// push-notification tap landing straight on a detail screen — often have
// none, so the default header renders with no back affordance at all.
// This always shows a chevron and falls back to a known-good screen instead
// of popping when there's nothing to pop to.
export function DetailBackButton({ fallbackHref }: { fallbackHref: Href }) {
  const router = useRouter();

  return (
    <Pressable
      hitSlop={8}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace(fallbackHref);
        }
      }}>
      <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
      <Text style={styles.label}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 17,
    color: Colors.textPrimary,
    marginLeft: 2,
  },
});
