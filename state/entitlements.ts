import {
    getCustomerInfo,
    isProEntitled,
    onCustomerInfoUpdated,
} from '@/lib/revenuecat';
import { router } from 'expo-router';
import { CustomerInfo } from 'react-native-purchases';
import { create } from 'zustand';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface ProStatusState {
  /** Whether the user has an active "pro" entitlement. */
  isPro: boolean;
  /** True while the first or a manual refresh is in progress. */
  isLoading: boolean;
  /** Latest customerInfo snapshot (null until first fetch). */
  customerInfo: CustomerInfo | null;
  /** Last error message from any refresh attempt. */
  lastError: string | null;

  /**
   * Fetch fresh customerInfo from RevenueCat and update the store.
   * Safe to call multiple times — only the latest wins.
   */
  refresh: () => Promise<void>;

  /**
   * Apply a customerInfo object directly (used by purchase / restore flows
   * that already have the info and by the foreground listener).
   */
  applyCustomerInfo: (info: CustomerInfo) => void;
}

export const useProStatus = create<ProStatusState>((set) => ({
  isPro: false,
  isLoading: true, // start true so UI never flickers "free" before first fetch
  customerInfo: null,
  lastError: null,

  refresh: async () => {
    set({ isLoading: true, lastError: null });
    try {
      const info = await getCustomerInfo();
      set({
        isPro: isProEntitled(info),
        customerInfo: info,
        isLoading: false,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('useProStatus refresh error:', msg);
      set({ isLoading: false, lastError: msg });
    }
  },

  applyCustomerInfo: (info: CustomerInfo) => {
    set({
      isPro: isProEntitled(info),
      customerInfo: info,
      isLoading: false,
      lastError: null,
    });
  },
}));

// ─── Foreground auto-refresh ──────────────────────────────────────────────────

let _unsubListener: (() => void) | null = null;

/**
 * Start listening for RevenueCat customerInfo updates (fires on app-foreground).
 * Call once after `initPurchases()`.  Safe to call multiple times.
 */
export function startProStatusListener(): void {
  if (_unsubListener) return; // already listening
  _unsubListener = onCustomerInfoUpdated((info) => {
    useProStatus.getState().applyCustomerInfo(info);
  });
}

/**
 * Tear down the listener (for tests / hot-reload).
 */
export function stopProStatusListener(): void {
  _unsubListener?.();
  _unsubListener = null;
}

// ─── Feature gating helper ────────────────────────────────────────────────────

/**
 * Execute `action` only if the user is Pro.
 * If not Pro, navigate to the paywall and return `false`.
 *
 * Usage:
 *   if (await requirePro()) { doProStuff(); }
 */
export function requirePro(action?: () => void): boolean {
  const { isPro } = useProStatus.getState();
  if (isPro) {
    action?.();
    return true;
  }
  router.push('/paywall');
  return false;
}

// ─── Backwards-compat alias ───────────────────────────────────────────────────
// Some existing files import `useEntitlements`.  Re-export so they keep working
// while we migrate call-sites.

/** @deprecated — use `useProStatus` instead. */
export const useEntitlements = useProStatus;
