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
let _configuring = false;
let _initError: string | null = null;
/** Set after an offerings fetch fails due to missing products — avoids retry spam. */
let _offeringsConfigError = false;

/** Whether `initPurchases` has run successfully (SDK configured). */
export const isRCInitialized = () => _initialized;

/** Last init error message (if any). */
export const getRCInitError = () => _initError;

/** True if offerings failed due to a config issue (no products in dashboard). */
export const hasOfferingsConfigError = () => _offeringsConfigError;

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
  if (_initialized || _configuring) return;
  _configuring = true;
  _initError = null;

  try {
    if (isExpoGo()) {
      _initError = 'Running in Expo Go — native IAP unavailable';
      console.warn(`RevenueCat: ${_initError}`);
      return;
    }

    const apiKey = getPlatformKey();
    console.log(`[RevenueCat] Platform: ${Platform.OS}`);
    console.log(`[RevenueCat] API key length: ${apiKey?.length || 0}`);
    console.log(`[RevenueCat] API key prefix: ${apiKey?.substring(0, 10) || 'undefined'}`);

    if (!apiKey) {
      _initError = `No RevenueCat API key for ${Platform.OS}. Add EXPO_PUBLIC_REVENUECAT_${Platform.OS === 'android' ? 'ANDROID' : 'IOS'}_KEY to .env`;
      console.warn(`RevenueCat: ${_initError}`);
      return;
    }

    // WARN level is quieter than DEBUG — avoids flooding the console with
    // offering/billing retry noise on devices without Play Services.
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey });
    _initialized = true;

    console.log('RevenueCat: initialized ✅');
  } catch (error) {
    _initError = error instanceof Error ? error.message : String(error);
    console.error('RevenueCat: init failed —', _initError);
    // Don't throw — app continues in degraded mode
  } finally {
    _configuring = false;
  }
}

// ─── API wrappers (never throw) ──────────────────────────────────────────────

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!_initialized) return null;
  // If a previous fetch already determined products are missing, don't retry
  // (avoids log spam on every foreground event).
  if (_offeringsConfigError) return null;
  try {
    return await Purchases.getOfferings();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // Detect the specific "no products configured" error so we can stop
    // retrying and surface a better message to the user.
    if (msg.includes('configuration') || msg.includes('ConfigurationError')) {
      _offeringsConfigError = true;
    }
    console.warn('RevenueCat getOfferings error:', msg);
    return null;
  }
}

/** Reset the cached offerings-config-error flag (e.g. after dashboard fix). */
export function clearOfferingsConfigError(): void {
  _offeringsConfigError = false;
}

export async function purchase(
  pkg: PurchasesPackage,
): Promise<{ customerInfo: CustomerInfo | null; error: Error | null }> {
  if (!_initialized) {
    return {
      customerInfo: null,
      error: new Error('RevenueCat SDK not initialized'),
    };
  }
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
  if (!_initialized) {
    return {
      customerInfo: null,
      error: new Error('RevenueCat SDK not initialized'),
    };
  }
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
