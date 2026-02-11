/**
 * Build-mode detection helpers.
 *
 * Determines how the app was installed so billing-related code can
 * show appropriate warnings when real purchases won't work.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── Build types ──────────────────────────────────────────────────────────────

export type BuildMode =
  | 'expo-go'       // Running inside the Expo Go wrapper app
  | 'dev-client'    // Custom dev-client (expo-dev-client) — debug build
  | 'debug'         // Debug / development RN build (not from store)
  | 'store';        // Production build installed from Play / App Store / TestFlight

// ─── Detection ────────────────────────────────────────────────────────────────

/** Returns the current build mode. */
export function getBuildMode(): BuildMode {
  // Expo Go is easy — appOwnership is always 'expo'
  if (Constants.appOwnership === 'expo') return 'expo-go';

  // Dev-client sets executionEnvironment to 'storeClient' but __DEV__ is true
  // and the constant below is present.
  if (Constants.executionEnvironment === 'storeClient' && __DEV__) return 'dev-client';

  // Plain __DEV__ means Metro bundler is serving JS — debug build
  if (__DEV__) return 'debug';

  // Everything else is a production binary
  return 'store';
}

/** Human-friendly label for the current mode. */
export function getBuildModeLabel(): string {
  switch (getBuildMode()) {
    case 'expo-go':
      return 'Expo Go';
    case 'dev-client':
      return 'Development Client';
    case 'debug':
      return 'Debug Build';
    case 'store':
      return Platform.OS === 'android' ? 'Play Store Build' : 'App Store Build';
  }
}

// ─── Convenience booleans ─────────────────────────────────────────────────────

/** True only for production builds distributed through Play / App Store. */
export function isStoreBuild(): boolean {
  return getBuildMode() === 'store';
}

/** True when running in Expo Go (no native modules). */
export function isExpoGo(): boolean {
  return getBuildMode() === 'expo-go';
}

/** True for any non-store build (Expo Go, dev-client, or debug). */
export function isDevBuild(): boolean {
  return getBuildMode() !== 'store';
}

// ─── Billing readiness ────────────────────────────────────────────────────────

/**
 * Whether real in-app billing can work in this environment.
 * Requires:  store build  +  correct platform.
 */
export function canUseBilling(): boolean {
  if (isExpoGo()) return false;
  // On Android, only Play-distributed builds can use Google Play Billing.
  // On iOS, debug builds can use sandbox but store is most reliable.
  return !isExpoGo();
}

/**
 * Returns a user-facing warning string if billing will NOT work,
 * or null if everything looks fine.
 */
export function billingWarning(): string | null {
  const mode = getBuildMode();
  switch (mode) {
    case 'expo-go':
      return 'You are in Expo Go — native billing is unavailable. Install from Play internal testing to test real purchases.';
    case 'dev-client':
      return 'Development client build detected. Install from Play internal testing to test real billing.';
    case 'debug':
      return 'Debug build detected. Install from Play internal testing to test real billing.';
    case 'store':
      return null;
  }
}

// ─── Diagnostic snapshot ──────────────────────────────────────────────────────

export interface BuildDiagnostics {
  buildMode: BuildMode;
  buildModeLabel: string;
  platform: string;
  platformVersion: string | number;
  appVersion: string;
  runtimeVersion: string;
  bundleId: string;
  expoSdkVersion: string;
  isHermes: boolean;
  isDev: boolean;
}

/** Collect a snapshot of build / environment info for diagnostics. */
export function collectBuildDiagnostics(): BuildDiagnostics {
  return {
    buildMode: getBuildMode(),
    buildModeLabel: getBuildModeLabel(),
    platform: Platform.OS,
    platformVersion: Platform.Version,
    appVersion: Constants.expoConfig?.version ?? '—',
    runtimeVersion:
      typeof Constants.expoConfig?.runtimeVersion === 'string'
        ? Constants.expoConfig.runtimeVersion
        : '—',
    bundleId:
      Platform.OS === 'android'
        ? Constants.expoConfig?.android?.package ?? '—'
        : Constants.expoConfig?.ios?.bundleIdentifier ?? '—',
    expoSdkVersion: Constants.expoConfig?.sdkVersion ?? '—',
    isHermes: !!(global as any).HermesInternal,
    isDev: __DEV__,
  };
}
