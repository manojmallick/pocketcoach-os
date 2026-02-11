/**
 * Configurable external URLs used throughout the app.
 *
 * Keep all store-required links here so they're easy to update
 * before each release or when switching domains.
 */

import { Platform } from 'react-native';

// ─── Legal ────────────────────────────────────────────────────────────────────

/** Privacy policy — required by Play Store and App Store. */
export const PRIVACY_POLICY_URL = 'https://pocketcoach.app/privacy';

/** Terms of service / EULA. */
export const TERMS_URL = 'https://pocketcoach.app/terms';

// ─── Support ──────────────────────────────────────────────────────────────────

/** Support email. Used for mailto: links. */
export const SUPPORT_EMAIL = 'support@pocketcoach.app';

/** Full mailto URI with a pre-filled subject line. */
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=PocketCoach%20Support%20Request`;

// ─── Account ──────────────────────────────────────────────────────────────────

/**
 * Account / data-deletion page.
 * Play Store requires a publicly accessible link where users can request
 * account and data deletion.
 */
export const DELETE_ACCOUNT_URL = 'https://pocketcoach.app/delete-account';

// ─── Subscription management ─────────────────────────────────────────────────

/** Google Play subscription management deep-link. */
const PLAY_SUBSCRIPTIONS_URL =
  'https://play.google.com/store/account/subscriptions?sku=pro_monthly&package=com.manoj.pocketcoachos';

/** iOS subscription management deep-link. */
const IOS_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

/** Platform-appropriate subscription management URL. */
export function getManageSubscriptionUrl(): string {
  return Platform.OS === 'ios' ? IOS_SUBSCRIPTIONS_URL : PLAY_SUBSCRIPTIONS_URL;
}
