import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useMemo, useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

const BAR_COUNT = 40;
const SPEEDS = [1, 1.5, 2] as const;

/**
 * A WhatsApp-style voice-note row for an announcement's audio_url — play/pause
 * button, tap-to-seek waveform, elapsed/duration time.
 *
 * The bars are a deterministic cosmetic pattern (seeded from the audio URL,
 * not the file's real amplitude) — RN has no equivalent of the Web Audio
 * API's decodeAudioData without a native module, so getting a *real*
 * waveform would mean either an on-device native decode library or
 * precomputing peaks server-side at upload time. Both are more
 * infrastructure than this feature needs; a stable fake pattern is visually
 * indistinguishable at a glance and never reshuffles on re-render since it's
 * derived from the URL via useMemo.
 */
export function AudioMessagePlayer({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const [barAreaWidth, setBarAreaWidth] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const barHeights = useMemo(() => seededBarHeights(uri, BAR_COUNT), [uri]);

  const duration = status.duration ?? 0;
  const currentTime = status.currentTime ?? 0;
  const progressPct = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const playedBars = Math.round(progressPct * BAR_COUNT);

  // Keeps voices sounding natural at 1.5x/2x instead of a sped-up chipmunk
  // effect — set once per player instance, ahead of any rate change.
  useEffect(() => {
    player.shouldCorrectPitch = true;
  }, [player]);

  const cycleSpeed = () => {
    const nextIndex = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(nextIndex);
    player.setPlaybackRate(SPEEDS[nextIndex], 'high');
  };

  const toggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      // didJustFinish leaves currentTime at the end — restart from zero
      // rather than a no-op tap on a finished voice note.
      if (status.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  const seekFromTouch = (event: GestureResponderEvent) => {
    if (!duration || !barAreaWidth) return;
    const pct = Math.min(1, Math.max(0, event.nativeEvent.locationX / barAreaWidth));
    player.seekTo(pct * duration);
  };

  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
        onPress={toggle}
        disabled={!status.isLoaded}
      >
        <Ionicons name={status.playing ? 'pause' : 'play'} size={18} color={Colors.surface} style={!status.playing && styles.playIconOffset} />
      </Pressable>

      <Pressable
        style={styles.barTouchArea}
        onLayout={(event) => setBarAreaWidth(event.nativeEvent.layout.width)}
        onPressIn={seekFromTouch}
      >
        <View style={styles.barsRow}>
          {barHeights.map((height, index) => (
            <View
              key={index}
              style={[styles.bar, { height }, index < playedBars ? styles.barPlayed : styles.barUnplayed]}
            />
          ))}
        </View>
      </Pressable>

      <Text style={styles.time}>{formatDuration(status.playing ? currentTime : duration)}</Text>

      <Pressable
        style={({ pressed }) => [styles.speedButton, pressed && styles.speedButtonPressed]}
        onPress={cycleSpeed}
        disabled={!status.isLoaded}
      >
        <Text style={styles.speedText}>{SPEEDS[speedIndex]}x</Text>
      </Pressable>
    </View>
  );
}

/** Deterministic pseudo-random bar heights (16–28px) seeded from a string, so the same voice note always renders the same waveform shape. */
function seededBarHeights(seed: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const rand = (h % 1000) / 1000;
    heights.push(16 + rand * 12);
  }
  return heights;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfacePressed,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.xs + 2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonPressed: {
    opacity: 0.8,
  },
  playIconOffset: {
    marginLeft: 2,
  },
  barTouchArea: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
  barPlayed: {
    backgroundColor: Colors.accent,
  },
  barUnplayed: {
    backgroundColor: Colors.divider,
  },
  time: {
    fontSize: 12,
    fontWeight: Typography.weightRegular,
    color: Colors.textTertiary,
    fontVariant: ['tabular-nums'],
    minWidth: 34,
    textAlign: 'right',
  },
  speedButton: {
    minWidth: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: Radius.chip,
    backgroundColor: Colors.divider,
  },
  speedButtonPressed: {
    opacity: 0.7,
  },
  speedText: {
    fontSize: 12,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
