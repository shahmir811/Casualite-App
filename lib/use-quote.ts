import { useEffect, useRef, useState } from 'react';

import { apiClient, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Quote, SizeBreakdown } from '@/lib/types';

export type QuoteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: ApiError | Error }
  | { status: 'success'; quote: Quote };

const DEBOUNCE_MS = 350;

// The customer taps the five steppers rapidly, so debounce instead of
// firing a request per tap, and ignore a response if the quantities have
// changed again by the time it lands.
export function useQuote(catalogueId: number | null, sizes: SizeBreakdown) {
  const { logout } = useAuth();
  const [state, setState] = useState<QuoteState>({ status: 'idle' });
  const requestId = useRef(0);

  const totalQty = sizes.xs + sizes.s + sizes.m + sizes.l + sizes.xl;

  useEffect(() => {
    requestId.current += 1;
    const thisRequest = requestId.current;

    if (!catalogueId || totalQty === 0) {
      setState({ status: 'idle' });
      return;
    }

    setState({ status: 'loading' });
    const timer = setTimeout(async () => {
      try {
        const data = await apiClient.post<{ quote: Quote }>(`/api/catalogues/${catalogueId}/quote`, {
          qty_xs: sizes.xs,
          qty_s: sizes.s,
          qty_m: sizes.m,
          qty_l: sizes.l,
          qty_xl: sizes.xl,
        });
        if (thisRequest === requestId.current) {
          setState({ status: 'success', quote: data.quote });
        }
      } catch (err) {
        if (thisRequest !== requestId.current) return;
        if (err instanceof ApiError && err.status === 401) {
          await logout();
          return;
        }
        if (err instanceof ApiError && err.reason === 'no_quantity') {
          setState({ status: 'idle' });
          return;
        }
        setState({ status: 'error', error: err instanceof Error ? err : new Error('Something went wrong.') });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [catalogueId, sizes.xs, sizes.s, sizes.m, sizes.l, sizes.xl, totalQty, logout]);

  return state;
}
