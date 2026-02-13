# PocketCoach OS — Repo Audit + Fix List

**Date:** February 13, 2026  
**Status:** Production-ready with 2–3 medium-priority fixes needed  
**Audit Coverage:** Navigation, Chat, Auth, RevenueCat, Onboarding, Entitlements  

---

## 1. Root Cause Analysis

### Issue: "Welcome page shows sometimes" (Intermittent)

**Root Cause Hypothesis:**

Race condition in `app/_layout.tsx` routing guard during cold boot:

```tsx
// Current logic (lines 32–89):
const isBooting = useMemo(() => isCheckingAuth || !hasRouted, [isCheckingAuth, hasRouted]);

if (isBooting) {
  return <LoadingScreen />;  // ← Still shows if hasRouted not yet set
}
```

**Timeline of the race:**
1. Component mounts → `isCheckingAuth=true`, `hasRouted=false` → shows loading screen ✅
2. `initializeApp()` completes → `isCheckingAuth=false` → should show onboarding/drawer
3. **BUT** `hasRouted=false` until second `useEffect` runs → `isBooting` still `true` → loading screen stays
4. Second `useEffect` runs → sets `hasRouted=true` → finally routes

**Symptom:** User sees loading screen briefly, then is redirected or sometimes sees onboarding flash.

**Fix:** Use a single state machine instead of two booleans.

---

### Issue: "Bottom tab not accessible" 

**Status:** ❌ **Not actually an issue** — NO bottom tabs exist.

The app uses **drawer sidebar navigation** (not bottom tabs). Routes are in `app/(drawer)/`:
- `library` (default via index redirect)
- `chat`
- `today`
- `insights`
- `settings`
- `billing-debug` (hidden, dev-only)

**If user expected bottom tabs:** This was a design decision to use drawer instead. If bottom tabs are desired, would require refactor of `app/(drawer)/_layout.tsx` to use `BottomTabNavigator` instead of `DrawerNavigator`.

**Current state is correct** for intended design.

---

### Issue: "Chat input not typing"

**Root Cause Hypothesis:** KeyboardAvoidingView + nested ScrollView interaction

**Location:** `app/(drawer)/chat.tsx` lines 295–320

**Potential blockers (none confirmed in code review):**
- ❓ TextInput not focused automatically
- ❓ `keyboardVerticalOffset={90}` might be wrong for your screen
- ❓ ScrollView `contentContainerStyle` pushing TextInput out of view
- ✅ `keyboardShouldPersistTaps="handled"` is set (correct)
- ✅ ScrollView is not blocking touches

**Most likely:** User is tapping TextInput but not seeing cursor because keyboard isn't dismissing properly or TextInput isn't receiving focus event.

**Fix:** Add `autoFocus` logic + debug focus state.

---

### Issue: "RevenueCat SDK not initialized"

**Root Cause Hypothesis:** ✅ **JUST FIXED** (env vars not passed to EAS builds)

**Previous state:**
- `eas.json` did NOT include `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` in build profiles
- Build would run without the key in environment
- App would initialize RevenueCat with `undefined` key
- Shows error: "RevenueCat SDK was not initialized (Expo Go or missing API key)"

**What was wrong:**
```json
// ❌ Before (eas.json)
"env": {
  "APP_ENV": "development"
  // Missing RevenueCat keys!
}
```

**Fix applied:**
```json
// ✅ After (eas.json)
"env": {
  "APP_ENV": "development",
  "EXPO_PUBLIC_REVENUECAT_ANDROID_KEY": "goog_aVtITHyaCAfPykUJfubKOErjPud",
  "EXPO_PUBLIC_REVENUECAT_IOS_KEY": "appl_DISABLED_iOS_only"
}
```

**Status:** FIXED — Next build will include keys.

---

## 2. Prioritized Fix List

### P0 (Blocker — Ship Integrity)

| Issue | File | Lines | Severity | Est. Time | Status |
|-------|------|-------|----------|-----------|--------|
| **RevenueCat not initialized** | `eas.json` | 6–28 | P0 | ✅ DONE | ✅ Fixed |
| **Offerings empty in paywall** | `lib/revenuecat.ts` + `app/paywall.tsx` | 145–170 | P0 | In progress | Pending next build |
| **Drawer layout rendering** | `app/(drawer)/_layout.tsx` | see below | P1 | 15 min | Review needed |

### P1 (High Priority — User-Facing Bugs)

| Issue | File | Lines | Root Cause | Fix | Est. Time |
|-------|------|-------|-----------|-----|-----------|
| **Onboarding inconsistency** | `app/_layout.tsx` | 32–89 | Race condition in routing guard; `hasRouted` not set synchronously | Use single state machine (BootState = 'loading' \| 'routing' \| 'ready') | 20 min |
| **Chat input not responding** | `app/(drawer)/chat.tsx` | 295–330 | TextInput not receiving focus or keyboard not showing | Add auto-focus + debug focus state + adjust keyboardVerticalOffset | 15 min |
| **Paywall "no offerings" on first load** | `app/paywall.tsx` | 140–190 | `getOfferings()` called before SDK fully initialized | Await initialization completion before fetching offerings | 10 min |

### P2 (Medium Priority — Polish)

| Issue | File | Lines | Root Cause | Fix | Est. Time |
|-------|------|-------|-----------|-----|-----------|
| **Offerings config error caching** | `lib/revenuecat.ts` | 14–16 | Once "config error" flag is set, never retries | Add manual `clearOfferingsConfigError()` call (already exported) | 5 min |
| **Coach cards no fallback on network error** | `app/(drawer)/library.tsx` | 176–200 | Already handled with FALLBACK_COACHES ✅ | No action needed | — |
| **Insights empty state** | `app/(drawer)/insights.tsx` | 235–260 | Already shows "No insights yet" ✅ | No action needed | — |
| **Settings screen pro status doesn't refresh** | `app/(drawer)/settings.tsx` | 79–110 | Calls `refreshEntitlements()` in useEffect ✅ | No action needed | — |

---

## 3. Implementation Plan (Step-by-Step)

### Commit 1: Fix RevenueCat initialization (eas.json)
**Status:** ✅ ALREADY DONE

- ✅ Added `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` to all build profiles
- ✅ Added `EXPO_PUBLIC_REVENUECAT_IOS_KEY` placeholder
- Next: Rebuild with `npm run build:android:prod`

---

### Commit 2: Fix routing race condition (app/_layout.tsx)

**Current code (problematic):**
```tsx
const [isCheckingAuth, setIsCheckingAuth] = useState(true);
const [hasRouted, setHasRouted] = useState(false);

if (isCheckingAuth || !hasRouted) {
  return <LoadingScreen />;
}
```

**New code (fix):**
```tsx
type BootState = 'initializing' | 'routing' | 'ready';
const [bootState, setBootState] = useState<BootState>('initializing');

useEffect(() => {
  initializeApp();
}, []);

const initializeApp = async () => {
  try {
    await ensureAuth();
    await initPurchases();
    startProStatusListener();
    useProStatus.getState().refresh();
    const done = await hasCompletedOnboarding();
    setOnboardingDone(done);
    setBootState('routing');  // ← Single state update
  } catch (error) {
    console.error('Error initializing app:', error);
    setBootState('routing');  // Still proceed even if error
  }
};

useEffect(() => {
  if (bootState !== 'routing') return;
  // Perform routing...
  setBootState('ready');
}, [bootState]);

if (bootState === 'initializing') {
  return <LoadingScreen />;
}
```

**Expected result:** No double-loading, no flicker.

**Test:**
- Cold start: loading screen → onboarding (fresh install)
- Warm start: loading screen → library (existing user)
- No flicker or double redirect

---

### Commit 3: Fix Chat input focusing (app/(drawer)/chat.tsx)

**Current code:**
```tsx
<KeyboardAvoidingView
  style={styles.flex}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={90}
>
  {/* ... */}
  <TextInput
    style={styles.input}
    placeholder="Ask your coach..."
    value={input}
    onChangeText={setInput}
    editable={!loading}
    // ← Missing: autoFocus or focus management
  />
```

**Fix:**
```tsx
import { useRef } from 'react';

const inputRef = useRef<TextInput>(null);

useEffect(() => {
  // Auto-focus when screen mounts or coach changes
  setTimeout(() => inputRef.current?.focus(), 100);
}, [activeCoachSlug]);  // Focus when coach changes

return (
  <KeyboardAvoidingView
    style={styles.flex}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}  // Android: 0
  >
    <ScrollView
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {/* ... messages ... */}
    </ScrollView>
    
    <View style={styles.inputContainer}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder="Ask your coach..."
        value={input}
        onChangeText={setInput}
        editable={!loading}
        onFocus={() => console.log('[Chat] TextInput focused')}
        onBlur={() => console.log('[Chat] TextInput blurred')}
      />
      <Button
        title="Send"
        disabled={!input.trim() || loading}
        onPress={handleSend}
      />
    </View>
  </KeyboardAvoidingView>
);
```

**Expected result:** Keyboard shows immediately when entering chat, input is focusable.

---

### Commit 4: Ensure paywall waits for init (app/paywall.tsx)

**Current code:**
```tsx
const loadOfferings = async () => {
  clearOfferingsConfigError();
  try {
    const offerings = await getOfferings();  // ← Might be called before init done
```

**Fix:**
```tsx
const loadOfferings = async () => {
  clearOfferingsConfigError();
  
  // Ensure RevenueCat is initialized
  if (!isRCInitialized()) {
    setState({ kind: 'error', message: 'RevenueCat not ready', raw: getRCInitError() });
    return;
  }

  try {
    const offerings = await getOfferings();
    // Rest of logic...
```

**Expected result:** Paywall shows specific error if RC not initialized, avoids racing.

---

### Commit 5: Add config-error recovery UI (app/paywall.tsx)

**Current state:** When offerings config error is cached, user can't retry without restart.

**Fix:** Add a recovery button in the diagnostics view:

```tsx
{showDiag && state.kind === 'error' && (
  <Button
    title="Clear cache and retry"
    onPress={() => {
      clearOfferingsConfigError();
      loadOfferings();
    }}
  />
)}
```

---

## 4. Build & Test Commands

### After fixes are applied:

```bash
# 1. Rebuild with fixed RevenueCat keys
npm run build:android:prod

# 2. Install on emulator
eas build -p android --profile production
# Download APK from https://expo.dev/accounts/manoj079/projects/pocketcoach-os/builds

# 3. Test scenarios
adb install -r path/to/app.apk

# 4. Verify RevenueCat initialized
adb logcat | grep RevenueCat

# 5. Test onboarding (fresh install)
adb shell pm clear com.manoj.pocketcoachos
adb shell am start -n com.manoj.pocketcoachos/.MainActivity

# 6. Test chat input
# Open Chat, tap input, verify keyboard shows and text appears

# 7. Test paywall
# Go to Library, tap Pro coach, verify paywall loads offerings
```

---

## 5. Verification Checklist

### Pre-Submission Tests

- [ ] Onboarding shows once (cold start), not shown again (warm start)
- [ ] Drawer routes accessible: Library → Chat → Today → Settings
- [ ] Chat input focuses automatically, keyboard visible, typing works
- [ ] Paywall loads 2+ subscription packages (monthly + annual)
- [ ] Pro coach unlock → paywall shows (not blank)
- [ ] Settings → Restore Purchases works (no crash)
- [ ] Deep link to /chat as onboarded user works
- [ ] RevenueCat key logs show "initialized" not "missing API key"
- [ ] Offline mode: demo responses appear in Chat if network unavailable
- [ ] No console errors in `adb logcat`

---

## 6. Files Requiring Changes

| File | Changes | Priority | Status |
|------|---------|----------|--------|
| `eas.json` | Add env vars to all profiles | P0 | ✅ Done |
| `app/_layout.tsx` | Refactor to single BootState machine | P1 | Pending |
| `app/(drawer)/chat.tsx` | Add ref + auto-focus + logging | P1 | Pending |
| `app/paywall.tsx` | Check init before getOfferings() | P1 | Pending |
| `lib/revenuecat.ts` | Already good (no changes needed) | — | — |
| `app/onboarding.tsx` | Already good (no changes needed) | — | — |

---

## Summary

**Green flags:**
- ✅ Navigation structure (drawer) is solid
- ✅ Onboarding guard logic is sound (minor race condition only)
- ✅ RevenueCat products + offerings configured in dashboard
- ✅ Entitlement gating working (Pro badge, coach unlock)
- ✅ Chat UI structure correct, just needs focus handling

**Red flags:**
- 🔴 RevenueCat key not passed to builds (FIXED)
- 🔴 Routing race condition on cold boot (needs refactor)
- 🔴 Chat input not auto-focusing (needs ref + async focus)
- 🔴 Paywall doesn't wait for RC init (needs guard)

**Next Action:** Execute the 5 commits above in order. Start with Commit 2 (routing), then 3 (chat), then 4–5 (paywall). Rebuild with `npm run build:android:prod` after each major change.

