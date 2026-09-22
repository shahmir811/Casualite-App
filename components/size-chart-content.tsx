import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Skeleton } from '@/components/skeleton';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Colors } from '@/constants/theme';
import { ApiError } from '@/lib/api-client';
import { useApiQuery } from '@/lib/use-api-query';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

// Shared between the sidebar's full-screen route and the order screen's
// modal — see app/(app)/(tabs)/size-chart.tsx and catalogues/[id].tsx.
export function SizeChartContent() {
  const { state, refetch } = useApiQuery<{ url: string }>('/api/size-chart');
  const { width: screenWidth } = useWindowDimensions();
  const [imageLoaded, setImageLoaded] = useState(false);

  if (state.status === 'loading') {
    return <LoadingView />;
  }

  if (state.status === 'error') {
    if (state.error instanceof ApiError && state.error.reason === 'not_uploaded') {
      return <EmptyView icon="resize-outline" message="Size chart not available yet." />;
    }
    return <ErrorView message={state.error.message} onRetry={refetch} />;
  }

  const imageHeight = screenWidth * 1.2;

  return (
    <View style={[styles.imageWrap, { height: imageHeight }]}>
      {!imageLoaded ? <Skeleton width="100%" height="100%" radius={0} style={StyleSheet.absoluteFillObject} /> : null}
      <ZoomableImage uri={state.data.url} onLoadEnd={() => setImageLoaded(true)} />
    </View>
  );
}

// Pinch to zoom, drag to pan while zoomed, double-tap to reset/zoom — built
// on react-native-gesture-handler + react-native-reanimated, both already
// linked for the drawer nav (app/_layout.tsx's GestureHandlerRootView), so
// this needed no new native dependency or EAS build.
function ZoomableImage({ uri, onLoadEnd }: { uri: string; onLoadEnd: () => void }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const reset = () => {
    'worklet';
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(savedScale.value * event.scale, MAX_SCALE));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) reset();
    });

  // averageTouches makes Pan compute translation off the midpoint of all
  // active touches rather than a single one — without it, translation goes
  // wrong the moment a second finger is also on screen for the pinch, which
  // corrupts savedTranslateX/Y for every pan afterward, one finger or not.
  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((event) => {
      if (savedScale.value <= 1) return;
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        reset();
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
      }
    });

  // Nested detectors rather than one Gesture.Exclusive(...) group — an
  // Exclusive tap can hold the responder just long enough (waiting to see if
  // a second tap follows) to starve the continuously-updating pan/pinch
  // gesture of activation, which is what was blocking panning entirely.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
      <GestureDetector gesture={doubleTap}>
        <Animated.View style={[styles.image, animatedStyle]}>
          <Image source={{ uri }} style={styles.image} contentFit="contain" onLoadEnd={onLoadEnd} />
        </Animated.View>
      </GestureDetector>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    width: '100%',
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
