/**
 * Persistent flags stored in AsyncStorage.
 *
 * Single source of truth for first-run / onboarding completion state.
 * Every other file should use these helpers instead of reading
 * `user_context` from AsyncStorage directly.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const ONBOARDING_COMPLETE_KEY = 'flag:onboarding_complete';

// ─── Onboarding ───────────────────────────────────────────────────────────────

/** Has the user completed the first-run onboarding flow? */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    if (value === 'true') return true;

    // Backward compat: older builds stored it inside `user_context`
    const legacy = await AsyncStorage.getItem('user_context');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed.onboardingCompleted) {
          // Migrate to the new flag so the legacy path isn't hit again
          await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
          return true;
        }
      } catch {
        // corrupt JSON — treat as not completed
      }
    }

    return false;
  } catch {
    return false;
  }
}

/** Mark onboarding as done (called at the end of the onboarding flow). */
export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

/** Clear the onboarding flag (called on logout / account reset). */
export async function clearOnboardingFlag(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  // Also remove legacy key so the user truly starts fresh
  await AsyncStorage.removeItem('user_context');
}
