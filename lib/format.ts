import { OrderStatus } from '@/lib/types';

// Money fields arrive as strings (e.g. "182000.00") and are always shown as
// whole rupees with thousands separators — see CLAUDE.md §7.
export function formatCurrency(value: string | number): string {
  const amount = typeof value === 'number' ? value : parseFloat(value);
  const rounded = Math.round(amount);
  return `PKR ${rounded.toLocaleString('en-US')}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Twitter-style short relative timestamp for the announcements timeline —
// falls back to an absolute date once it's more than a week old, since
// "23d" stops being a useful unit at that point.
export function formatRelativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return formatDate(iso);
}

// Labels kept in sync with the existing web portal so status reads the same
// in both places — see CLAUDE.md §9.
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Order Received',
  confirmed: 'Order Confirmed',
  stitching: 'Being Stitched',
  partially_dispatched: 'Partially Dispatched',
  dispatched: 'Dispatched',
  cancelled: 'Cancelled',
};

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

const LEDGER_TYPE_LABELS: Record<string, string> = {
  order_charged: 'Order Charged',
  payment_received: 'Payment Received',
};

// The API can add ledger transaction types over time (e.g. standalone advance
// payments); fall back to humanizing the raw value instead of hiding it.
export function ledgerTypeLabel(type: string): string {
  if (LEDGER_TYPE_LABELS[type]) return LEDGER_TYPE_LABELS[type];
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function sizeLabel(size: string): string {
  return size.toUpperCase();
}
