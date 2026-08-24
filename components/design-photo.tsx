import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

export function DesignPhoto({ url, size = 56 }: { url: string | null; size?: number }) {
  const dimensionStyle = { width: size, height: size };

  if (!url) {
    return (
      <View style={[styles.placeholder, dimensionStyle]}>
        <Ionicons name="image-outline" size={size * 0.45} color={Colors.textTertiary} />
      </View>
    );
  }

  return <Image source={{ uri: url }} style={[styles.photo, dimensionStyle]} contentFit="cover" />;
}

const styles = StyleSheet.create({
  photo: {
    borderRadius: Radius.chip,
    backgroundColor: Colors.divider,
  },
  placeholder: {
    borderRadius: Radius.chip,
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
