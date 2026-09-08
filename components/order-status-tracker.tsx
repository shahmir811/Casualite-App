import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, StatusColors, Typography } from '@/constants/theme';
import { orderStatusLabel } from '@/lib/format';
import { OrderStatus } from '@/lib/types';

const STEPS: {
  key: 'received' | 'confirmed' | 'stitching' | 'dispatched';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'received', label: 'Received', icon: 'cube-outline' },
  { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-outline' },
  { key: 'stitching', label: 'Stitching', icon: 'cut-outline' },
  { key: 'dispatched', label: 'Dispatched', icon: 'checkmark-done-outline' },
];

// Maps every non-cancelled status onto a 0-3 stop. partially_dispatched
// shares the final stop with dispatched — the `isPartial` check below is
// what tells the two apart (ring vs filled, "Dispatching" vs "Dispatched").
function stepIndex(status: OrderStatus): number {
  switch (status) {
    case 'received':
      return 0;
    case 'confirmed':
      return 1;
    case 'stitching':
      return 2;
    default:
      return 3;
  }
}

export function OrderStatusTracker({ status, compact = false }: { status: OrderStatus; compact?: boolean }) {
  if (status === 'cancelled') {
    return (
      <View style={[styles.cancelledBanner, { backgroundColor: StatusColors.cancelled.bg }]}>
        <Text style={[styles.cancelledText, { color: StatusColors.cancelled.text }]}>This order was cancelled.</Text>
      </View>
    );
  }

  const activeIndex = stepIndex(status);
  const isPartial = status === 'partially_dispatched';

  return (
    <View style={styles.tracker} accessibilityLabel={`Order status: ${orderStatusLabel(status)}`}>
      {STEPS.map((step, index) => {
        const isFinal = index === 3;
        const done = index < activeIndex || (isFinal && index === activeIndex && !isPartial);
        const current = index === activeIndex && !done;
        const label = isFinal && isPartial ? 'Dispatching' : step.label;

        return (
          <View key={step.key} style={styles.step}>
            {index > 0 ? (
              <View
                style={[
                  styles.line,
                  compact && styles.lineCompact,
                  index <= activeIndex && styles.lineFilled,
                ]}
              />
            ) : null}
            <View
              style={[
                styles.node,
                compact && styles.nodeCompact,
                done && styles.nodeDone,
                current && styles.nodeCurrent,
              ]}>
              {!compact ? (
                <Ionicons
                  name={step.icon}
                  size={13}
                  color={done ? '#FFFFFF' : current ? Colors.accent : Colors.textTertiary}
                />
              ) : null}
            </View>
            <Text
              style={[styles.label, compact && styles.labelCompact, done && styles.labelDone, current && styles.labelCurrent]}
              numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tracker: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  line: {
    position: 'absolute',
    top: 11,
    left: '-50%',
    width: '100%',
    height: 2,
    backgroundColor: Colors.divider,
    zIndex: 0,
  },
  lineCompact: {
    top: 5,
  },
  lineFilled: {
    backgroundColor: Colors.success,
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  nodeCompact: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  nodeDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  nodeCurrent: {
    backgroundColor: Colors.highlightSoft,
    borderColor: Colors.accent,
  },
  label: {
    marginTop: Spacing.xs,
    fontSize: 10,
    fontWeight: Typography.weightSemibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 9,
    marginTop: 4,
  },
  labelDone: {
    color: Colors.textPrimary,
  },
  labelCurrent: {
    color: Colors.accent,
    fontWeight: Typography.weightBold,
  },
  cancelledBanner: {
    borderRadius: Radius.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  cancelledText: {
    fontSize: 13,
    fontWeight: Typography.weightSemibold,
  },
});
