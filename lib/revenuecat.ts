import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesOfferings,
    PurchasesPackage,
} from 'react-native-purchases';

// ─── Internal state ───────────────────────────────────────────────────────────

let _initialized = false;
let _initError: string | null = null;

/** Whether `initPurchases` has run successfully (SDK configured). */
export const isRCInitialized = () => _initialized;

/** Last init error message (if any). */
export const getRCInitError = () => _initError;

// ─── Env helpers ──────────────────────────────────────────────────────────────

function envKey(name: string): string | undefined {
  // expo-constants extras first, then process.env (Expo injects EXPO_PUBLIC_*)
  return (
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.[name] ??
    (process.env as Record<string, string>)[name] ??
    undefined
  );
}

export function getAndroidKey(): string | undefined {
  return envKey('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY');
}

export function getIosKey(): string | undefined {
  return envKey('EXPO_PUBLIC_REVENUECAT_IOS_KEY');
}

export function getPlatformKey(): string | undefined {
  return Platform.OS === 'android' ? getAndroidKey() : getIosKey();
}

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * Initialize RevenueCat SDK.  Safe to call multiple times — only the first
 * successful call will configure the SDK.  Never throws.
 */
export async function initPurchases(): Promise<void> {
  if (_initialized) return;
  _initError = null;

  try {
    if (isExpoGo()) {
      _initError = 'Running in Expo Go — native IAP unavailable';
      console.warn(`RevenueCat: ${_initError}`);
      return;
    }

    const apiKey = getPlatformKey();

    if (!apiKey) {
      _initError = `No RevenueCat API key for ${Platform.OS}. Add EXPO_PUBLIC_REVENUECAT_${Platform.OS === 'android' ? 'ANDROID' : 'IOS'}_KEY to .env`;
      console.warn(`RevenueCat: ${_initError}`);
      return;
    }

    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    _initialized = true;

    console.log('RevenueCat: initialized');
  } catch (error) {
    _initError = error instanceof Error ? error.message : String(error);
    console.error('RevenueCat: init failed —', _initError);
    // Don't throw — app continues in degraded mode
  }
}

// ─── API wrappers (never throw) ──────────────────────────────────────────────

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!_initialized) return null;
  try {
    return await Purchases.getOfferings();
  } catch (error) {
    console.error('RevenueCat getOfferings error:', error);
    return null;
  }
}

export async function purchase(
  pkg: PurchasesPackage,
): Promise<{ customerInfo: CustomerInfo | null; error: Error | null }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo, error: null };
  } catch (error) {
    return {
      customerInfo: null,
      error: error instanceof Error ? error : new Error('Purchase failed'),
    };
  }
}

export async function restorePurchases(): Promise<{
  customerInfo: CustomerInfo | null;
  error: Error | null;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { customerInfo, error: null };
  } catch (error) {
    return {
      customerInfo: null,
      error: error instanceof Error ? error : new Error('Restore failed'),
    };
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!_initialized) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('RevenueCat getCustomerInfo error:', error);
    return null;
  }
}

/** Check whether a `CustomerInfo` object contains the "pro" entitlement. */
export function isProEntitled(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return 'pro' in info.entitlements.active;
}

// ─── Foreground listener ──────────────────────────────────────────────────────

/**
 * Register a callback that fires whenever customerInfo changes (e.g. on
 * app-foreground when the SDK refreshes entitlements).  Returns an unsubscribe
 * function.
 */
export function onCustomerInfoUpdated(
  cb: (info: CustomerInfo) => void,
): () => void {
  if (!_initialized) return () => {};
  const listener = Purchases.addCustomerInfoUpdateListener(cb);
  // The RN SDK returns a remove function
  return typeof listener === 'function' ? listener : () => {};
}
