# PocketCoach OS — Production Implementation Guide
## Prompts 2–5: RevenueCat Init, Navigation, Chat Fix, & Release Checklist

---

## Prompt 2: Implement RevenueCat Init (Router-Safe)

### Current Status: ✅ Already Implemented

Your `lib/revenuecat.ts` already follows best practices:

```ts
// ✅ Good: Initialize once, never throws
export async function initPurchases(): Promise<void> {
  if (_initialized || _configuring) return;
  _configuring = true;
  // ... safe init
}

// ✅ Good: Platform-aware key reading
export function getPlatformKey(): string | undefined {
  return Platform.OS === 'android' ? getAndroidKey() : getIosKey();
}

// ✅ Good: Safe offerings fetch with config error caching
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!_initialized) return null;
  if (_offeringsConfigError) return null;
  // ...
}
```

### What to Add: Enhanced Diagnostics

Add a **diagnosis helper** function for the paywall to give users helpful error messages:

**File:** `lib/revenuecat.ts` (add to bottom)

```ts
export interface RCDiagnostics {
  isInitialized: boolean;
  initError: string | null;
  hasConfigError: boolean;
  androidKeySet: boolean;
  iosKeySet: boolean;
  currentPlatform: string;
  isExpoGo: boolean;
}

export function getDiagnostics(): RCDiagnostics {
  return {
    isInitialized: isRCInitialized(),
    initError: getRCInitError(),
    hasConfigError: hasOfferingsConfigError(),
    androidKeySet: !!getAndroidKey(),
    iosKeySet: !!getIosKey(),
    currentPlatform: Platform.OS,
    isExpoGo: isExpoGo(),
  };
}

export function getDiagnosticsMessage(): string {
  const diag = getDiagnostics();
  
  if (diag.isExpoGo) {
    return 'Running in Expo Go — IAP not available. Use a dev build or Play Store build.';
  }
  
  if (!diag.isInitialized) {
    if (diag.initError?.includes('API key')) {
      return `Missing RevenueCat API key for ${diag.currentPlatform}.`;
    }
    return `RevenueCat not initialized. Error: ${diag.initError || 'Unknown'}`;
  }
  
  if (diag.hasConfigError) {
    return 'Products not configured in RevenueCat dashboard. Configure them and rebuild.';
  }
  
  return 'Unable to load subscription plans. Try again or contact support.';
}
```

### Update Paywall to Use Diagnostics

**File:** `app/paywall.tsx` (update around line 145)

```tsx
import { getDiagnosticsMessage } from '@/lib/revenuecat';

export default function PaywallScreen() {
  // ...
  
  const loadOfferings = async () => {
    if (!isRCInitialized()) {
      const msg = getDiagnosticsMessage();
      setState({ kind: 'error', message: msg, raw: getRCInitError() });
      return;
    }
    
    try {
      const offerings = await getOfferings();
      if (!offerings?.current) {
        const msg = getDiagnosticsMessage();
        setState({ kind: 'error', message: msg, raw: 'No offerings returned' });
        return;
      }
      // ... rest of logic
    } catch (err) {
      // ...
    }
  };
}
```

---

## Prompt 3: Navigation Overhaul (Already Done ✅)

### Current State

Your app already has:
- ✅ **Drawer sidebar** with Library / Chat / Today / Settings
- ✅ **Breadcrumb header** in `components/Breadcrumb.tsx`
- ✅ **No overlap with system gestures** (drawer is safe area aware)
- ✅ **Works on small Android screens** (responsive layout)

**Routes:**

```
app/(drawer)/
├── _layout.tsx         → DrawerNavigator + Header
├── library.tsx         → Coach selection
├── chat.tsx            → AI conversation
├── today.tsx           → Action checklist
├── settings.tsx        → Pro status + billing
└── billing-debug.tsx   → Dev diagnostics
```

### No Changes Needed

The drawer navigation is:
- Responsive
- Uses safe area insets
- Gesture-aware
- Mobile-first design

✅ **Status:** Production-ready

---

## Prompt 4: Fix Chat Input Not Typing

### Root Cause

Looking at `app/(drawer)/chat.tsx`:
- TextInput exists and is bound to state
- No obvious focus blocker
- **But:** No automatic focus when chat opens

### Fix: Add Auto-Focus

**File:** `app/(drawer)/chat.tsx`

**Change 1: Add import**

```tsx
import { useRef, useEffect } from 'react';
// Already has these, just ensure useRef is imported
```

**Change 2: Add ref** (around line 300)

```tsx
const ChatScreen: React.FC = () => {
  const inputRef = useRef<TextInput>(null);
  const [input, setInput] = useState('');
  const [actionCards, setActionCards] = useState<ActionCard[]>([]);
  const [loading, setLoading] = useState(false);
  // ... rest of state

  // Add auto-focus effect
  useEffect(() => {
    // Small delay to ensure keyboard is ready
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}  // Android: 0
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled  // ← Add this
      >
        {/* Messages - unchanged */}
      </ScrollView>

      {/* Input area */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}  // ← Add ref
          style={styles.input}
          placeholder="Ask your coach..."
          value={input}
          onChangeText={setInput}
          editable={!loading}
          placeholderTextColor="#999"
          multiline
          maxHeight={120}
          keyboardAppearance="dark"
        />
        <Button
          title="Send"
          disabled={!input.trim() || loading}
          onPress={handleSend}
        />
      </View>
    </KeyboardAvoidingView>
  );
};
```

**Test:**
```bash
# Open Chat screen
# Keyboard should appear automatically
# Type: "hello" → Should see text in input
# Tap Send → Should send message
```

---

## Prompt 5: E2E Release + Play Store Publishing Checklist

### Phase 1: Pre-Release (Internal Testing)

#### 1.1 Final Code Cleanup

- [ ] No console.warn/console.log in production code (keep console.error only)
- [ ] No commented-out code or dead imports
- [ ] All strings are properly localized/extracted
- [ ] No hardcoded API endpoints (use constants/urls.ts)
- [ ] Run linter: `npm run lint`

```bash
npm run lint
# Fix any eslint errors
```

#### 1.2 Version Bump

- [ ] Update `app.json` version: "1.0.0" → "1.0.1" (or next semantic version)
- [ ] Android auto-increments versionCode in `eas.json`
- [ ] Verify build number increments: `eas.json` has `"autoIncrement": true`

```json
{
  "expo": {
    "version": "1.0.1",  // ← Update
    "android": {
      "versionCode": 2   // ← Will auto-increment on next build
    }
  }
}
```

#### 1.3 Build Production AAB

```bash
# Trigger production build (creates .aab for Play Store)
npm run build:android:prod

# Track build: https://expo.dev/accounts/manoj079/projects/pocketcoach-os/builds
```

**Expected output:** AAB file ready for upload to Play Console.

#### 1.4 Verify Build Diagnostics

Once build completes:

```bash
# Download the built artifact from EAS dashboard
# Verify using bundletool (confirms signatures, resources, etc.)

# OR: Create internal test track and install on emulator to verify:
adb install -r pocketcoach-app.apk
# (Note: Play Store builds are .aab, can't install directly; need internal track)
```

---

### Phase 2: Internal Testing Track (5–7 days)

#### 2.1 Create Release in Play Console

**Steps:**
1. Go to [Google Play Console](https://play.google.com/console)
2. Select **PocketCoach OS**
3. Left sidebar: **Testing** → **Internal testing**
4. Click **Create new release**
5. Upload the AAB from `npm run build:android:prod`

**Screenshot to capture:**
```
Play Console 
  → Testing 
    → Internal testing 
      → [Release card showing version 1.0.1]
        → [Status: "Ready for review" or "Pending review"]
```

#### 2.2 Add Testers

1. **Internal testers:** Add your Google Account + any team member accounts
2. **License testers:** Add your Gmail in:
   - Play Console → Settings → License testing → Add email
3. Install from opt-in link:
   - Go to internal testing release page
   - Copy "Opt-in link"
   - Open on device/emulator
   - Install from Play Store

#### 2.3 Run QA Checklist

**Manual testing on real device (not emulator):**

- [ ] **Onboarding:** Fresh install → shows onboarding once → routes to Library
- [ ] **Library:** Can scroll coaches → tap free coach (Productivity Coach) → enters Chat
- [ ] **Chat:** Typing works → Can ask question → Receives demo or AI response
- [ ] **Pro Coach:** Tap pro coach → Paywall shows → Can see monthly/annual options
- [ ] **Paywall Purchase:** (On internal test device with Play Store access)
  - [ ] Tap monthly "Subscribe" button
  - [ ] Google Play dialog appears
  - [ ] Confirm purchase
  - [ ] Coach unlocks, Pro badge shows in header
- [ ] **Today:** Can create/check off action cards → Streak increments
- [ ] **Settings:** 
  - [ ] App version shows correctly
  - [ ] "Restore Purchases" tappable
  - [ ] Logout → returns to onboarding
- [ ] **Network:** Airplane mode → demo mode working, no crashes
- [ ] **Permissions:** All requested permissions granted (camera/mic if used)

**Expected duration:** 2–3 hours spread over 3–5 days for various scenarios.

---

### Phase 3: Closed Testing Track (14+ days per Play Policy)

#### 3.1 Promote to Closed Testing

**Steps:**
1. Play Console → **Testing** → **Closed testing**
2. Create new release (or promote internal release)
3. Add email addresses of **12–50 external testers** (requirement by Play)
4. Add release notes:

```
Version 1.0.1 — PocketCoach OS

New:
- Full-featured AI coaching with 5 expert coaches
- Daily action cards and streak tracking
- Pro subscription for unlimited coach access

Fixed:
- Improved chat input responsiveness
- RevenueCat initialization reliability
- Better offline fallback support

Testing: Please test all features and report any crashes or payment issues to: support@example.com
```

#### 3.2 Collect Feedback (14 days minimum)

- [ ] At least 5 external testers have installed
- [ ] 0 critical crashes reported (track via Play Console → Crashes & ANRs)
- [ ] Pro subscription purchases work (watch Play Console → Revenue)
- [ ] RevenueCat entitlements sync correctly
- [ ] No permission denials or UX blockers

**Red flags that require fixes before production:**
- Crash rate > 0.5%
- Payment failures (incomplete RevenueCat setup)
- Entitlement not granting access to pro coaches
- Chat input not working on real devices

---

### Phase 4: Production Release (Only After Closed Testing Passes)

#### 4.1 Promote to Production

**Steps:**
1. Play Console → **Testing** → **Closed testing** → Select release
2. Scroll down → **Promote release**
3. Select **Production** track
4. **Gradual rollout** (recommended):
   - Start with 5% of users (1 day)
   - Monitor crash rate
   - Increase to 25% (1 day)
   - Then 100% (final)

**OR full rollout immediately (if confident):**
- Select **100%** and confirm

#### 4.2 Production Release Notes

```
🎉 Version 1.0.1 — PocketCoach OS

Welcome to PocketCoach! Your personal AI coaching assistant.

📚 Features:
- 5 expert AI coaches (Psychology, Productivity, Finance, Wellness, Habits)
- Daily action cards to keep you on track
- Weekly insights on your progress
- Unlimited chats with Pro subscription

🚀 How to use:
1. Choose a coach from the Library
2. Chat naturally about your goals
3. Get personalized action cards
4. Check them off daily to build streaks
5. Unlock Pro for access to all coaches

💎 Pro Subscription:
- Unlock all coaches (not just the free Productivity Coach)
- Unlimited messages and daily plans
- Ad-free experience
- Monthly or annual billing

📞 Support:
- Email: support@example.com
- In-app: Settings → Help

Enjoy building your better self with PocketCoach OS!
```

#### 4.3 Monitor Post-Launch

**First 48 hours (critical):**
- [ ] Monitor Play Console → Crashes & ANRs (should be < 0.1%)
- [ ] Check RevenueCat dashboard for purchase volume
- [ ] Monitor Supabase logs for API errors
- [ ] Set up alerts in Play Console for crash spikes

**Commands:**
```bash
# Check crash reports in Play Console (web-only, no CLI)
# OR export analytics CSV and review

# Check RevenueCat transactions:
# https://dashboard.revenuecat.com/projects/pocketcoach-os/analytics/overview

# Check Supabase logs:
# https://app.supabase.com/project/azzxqjutboljbkxdlfgk/logs
```

---

## Final Verification Checklist

### Before Shipping to Production

- [ ] **RevenueCat:**
  - [ ] Android key configured in eas.json ✅
  - [ ] Products exist in dashboard (pro, pro_monthly at minimum)
  - [ ] Offering "default" includes at least 1 package
  - [ ] Test subscription purchase on internal test device (succeeds in sandbox)

- [ ] **Navigation:**
  - [ ] Onboarding shows once, not repeated
  - [ ] Drawer routes all accessible
  - [ ] Back button behavior correct
  - [ ] Deep links work (if implemented)

- [ ] **Chat:**
  - [ ] Input focuses automatically
  - [ ] Typing works smoothly
  - [ ] Send button enables with text
  - [ ] Messages display and scroll correctly

- [ ] **Paywall:**
  - [ ] Shows 2–3 subscription options (monthly, annual)
  - [ ] No "no offerings" error
  - [ ] Purchase flow completes
  - [ ] Pro status updates after purchase

- [ ] **Build:**
  - [ ] No lint errors: `npm run lint`
  - [ ] Version bump applied
  - [ ] AAB built successfully
  - [ ] Play Console submission review passed

---

## Release Day Commands

```bash
# 1. Final lint check
npm run lint

# 2. Build production AAB
npm run build:android:prod

# 3. Wait for EAS completion (~10-15 min)
# Track at: https://expo.dev/accounts/manoj079/projects/pocketcoach-os/builds

# 4. Upload to Play Console (manual or via CLI)
npm run submit:android:prod

# 5. Verify submission in Play Console
# Play Console → App releases → [your release]
# Status should show "Pending review" → then "In review" → then "Approved"
```

---

## Rollback Plan

**If critical issue found in production:**

1. **Stop rollout immediately:**
   - Play Console → Production track → Edit release
   - Pause rollout at current percentage

2. **Create hotfix:**
   ```bash
   # Fix the issue in code
   git commit -am "hotfix: critical issue"
   npm run build:android:prod  # Create new AAB
   ```

3. **Rollout new version:**
   - Play Console → Create new release with fixed AAB
   - Start gradual rollout (5% → 25% → 100%)

4. **Communication:**
   - Notify testers if outside feature scope
   - Update app store listing notes

---

## Success Metrics (Post-Launch)

**Track for 7 days:**
- Crash rate: Target < 0.1%
- ANR (App Not Responding): Target 0%
- Active installs: 1st day baseline
- Subscription conversion: (Pro subs / total installs) × 100 ≥ 5%
- Average session length: ≥ 3 minutes
- Retention (Day 1): ≥ 40%

**If metrics look good:**
- Proceed with marketing / announcement
- Open app to wider audience

**If issues arise:**
- Fix and push hotfix
- Document in post-mortem

---

## Next Steps (After Full Release)

1. **Version 1.0.2:** Bug fixes, visual polish
2. **Version 1.1.0:** Additional coaches, improved insights, offline support
3. **Version 2.0.0:** Habit tracking, social features, integrations

