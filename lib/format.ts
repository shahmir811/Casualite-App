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
