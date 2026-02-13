# Comprehensive QA Test Checklist — PocketCoach OS

**Final validation before Play Store submission.**

Test on: **Physical Android device (not Expo Go if possible)**

---

## 1. App Launch & Onboarding

- [ ] **Fresh Install (Cleared AsyncStorage)**
  - App launches without crash
  - Splash screen shows briefly
  - Onboarding screen appears immediately (no flicker)
  - "Get Started" button is visible and tappable

- [ ] **Onboarding Flow**
  - Can tap through onboarding slides (if any)
  - "Complete Onboarding" button navigates to Library
  - App never shows onboarding again on re-launch
  - Flag persists across app restart

- [ ] **Return User**
  - Re-launch app → goes directly to Drawer nav (Library)
  - No onboarding flicker
  - Drawer navigation ready to use

---

## 2. Navigation & Routing

- [ ] **Drawer Menu**
  - Hamburger icon visible in header on all screens
  - Tap hamburger → drawer opens from left
  - Drawer items visible: Library, Chat, Today, Insights, Settings
  - Tap item → navigates to that screen
  - Tap same item again → no crash, stays on screen
  - Swipe/tap outside drawer → closes drawer

- [ ] **All 5 Routes Reachable**
  - [ ] Library → Loads coach list
  - [ ] Chat → Shows coach info + chat interface
  - [ ] Today → Shows action cards + streak
  - [ ] Insights → Shows weekly summary
  - [ ] Settings → Shows account info + options

- [ ] **Breadcrumb Navigation**
  - Library screen: Shows "Library" or empty breadcrumb
  - Chat screen: Shows "Chat > [Coach Name]" (e.g., "Chat > Focus Coach")
  - Today screen: Shows "Today"
  - Insights screen: Shows "Insights"
  - Settings screen: Shows "Settings"

- [ ] **Back Button**
  - Android back button works as expected
  - From Chat → back to Library
  - From any drawer screen → back to previous screen
  - No crashes on back navigation

---

## 3. Header & Pro Badge

- [ ] **Header Visible on All Screens**
  - Hamburger menu (left)
  - Screen title (center)
  - PRO badge (right)
  - Safe area respected

- [ ] **Pro Badge Styling**
  - Font is bold and prominent (weight 800)
  - Badge has shadow effect (elevated)
  - Padding and rounded corners look professional

- [ ] **Pro Badge Behavior (Free User)**
  - PRO badge is **tappable**
  - Tap badge → navigates to Paywall
  - No crash on navigation

- [ ] **Pro Badge Behavior (Pro User)**
  - PRO badge still visible
  - Badge is **not tappable** (or tapping does nothing)
  - No paywall navigation

---

## 4. Library Screen

- [ ] **Coach List Loads**
  - Screen shows coach cards (skeleton loading if slow)
  - Cards never blank (has fallback coaches)
  - Shows all 5 coaches or fetched list

- [ ] **Coach Card Styling**
  - Icon circle with emoji (🎯, ⚡, 🧠, 🔁, 💎)
  - Coach title + description visible
  - PRO badge on Pro coaches
  - "Start" or "Unlock with Pro" button on card

- [ ] **Free Coach Interaction**
  - Tap free coach → navigates to Chat
  - Chat screen loads with coach name in breadcrumb
  - No errors or crashes

- [ ] **Pro Coach Lock (Free User)**
  - Pro coach card shows "Unlock with Pro" button
  - Tap button → Paywall opens
  - Paywall displays subscription options

- [ ] **Pro Coach Unlock (Pro User)**
  - Pro coach card shows "Start" button (not locked)
  - Tap → navigates to Chat successfully

- [ ] **Error Handling**
  - If fetch fails → fallback coaches still display
  - Pull-to-refresh works (if implemented)
  - No blank screen or crash

- [ ] **Load State**
  - Skeleton cards shimmer during load
  - Loading finishes and replaced with real cards
  - No jank or frame drops

---

## 5. Chat Screen

- [ ] **Chat Interface Loads**
  - Coach name visible in breadcrumb
  - Chat history visible (if any)
  - Chat composer at bottom is visible

- [ ] **Text Input Works**
  - Tap text input → keyboard appears
  - Can type characters
  - Character count visible (dev-only indicator)
  - Text persists while typing
  - Backspace/delete works

- [ ] **Send Message**
  - "Send" button visible when text entered
  - "Send" button disabled when field empty
  - Tap Send → message added to chat
  - Input field clears after send
  - Keyboard stays visible (expected behavior)
  - Message appears with timestamp

- [ ] **Coach Response**
  - Coach response appears below user message
  - Response shows coach avatar/name
  - Message content readable and formatted
  - No errors or crashes

- [ ] **Add to Today Button**
  - Coach action cards show "Add to Today" button
  - Tap button (free user, not at limit) → action card added
  - Card shows success feedback
  - Navigating to Today → card appears in list

- [ ] **Action Card Limit (Free User)**
  - Add 1st action → success
  - Add 2nd action → success
  - Add 3rd action → success
  - Add 4th action (today) → Paywall opens (limit enforced)
  - Error message explains limit

- [ ] **Pro User (Unlimited)**
  - Can add 5+, 10+ action cards with no limits
  - No paywall triggered
  - All cards appear in Today

- [ ] **Keyboard Handling**
  - Keyboard doesn't block input field
  - Text input always visible
  - `KeyboardAvoidingView` works on Android
  - Composer stays above keyboard

- [ ] **Online/Offline**
  - **Online:** Messages send and receive normally
  - **Offline (toggle flight mode):** App doesn't crash
    - Shows demo response or offline message
    - Allows sending (queues or fails gracefully)

- [ ] **Error Handling**
  - Network error → shows error message + retry
  - Connection loss → app doesn't crash
  - Fallback demo response displayed (if enabled)

---

## 6. Today Screen

- [ ] **Initial Load**
  - Screen loads without crash
  - Streak count displays at top: "Streak: X"
  - Completion summary shows: "X of Y completed"
  - Filter chips visible: "Active (X)" and "Done (Y)"

- [ ] **Filter Chips**
  - Default filter is "Active"
  - Tap "Active" chip → shows only active cards
  - Tap "Done" chip → shows only completed cards
  - Card counts update based on filter

- [ ] **Action Cards Display**
  - Card title, description visible
  - Time estimate (e.g., "15 min") shown
  - Checkbox on left side of card
  - Type badge (e.g., "TODAY") shown

- [ ] **Checkbox Interaction**
  - Tap checkbox → card marked as done
  - Checkbox fills with color (✓ icon)
  - Card text becomes grayed out/strikethrough
  - Status changes from "active" to "done"

- [ ] **Streak Logic**
  - Add action card from Chat
  - Mark action as done
  - If all today's cards done → streak increments
  - Streak count updates immediately
  - Refresh app → streak persists
  - Next day: if don't complete → streak resets

- [ ] **Empty States**
  - Filter to "Active" with no cards → shows "No active cards" message
  - Filter to "Done" with no cards → shows "No completed cards" message
  - CTA text suggests action ("Go chat with a coach")

- [ ] **Error Handling**
  - Network error → shows error message
  - Retry button visible and functional
  - Pull-to-refresh works

- [ ] **Optimistic UI Updates**
  - Tap checkbox → UI updates immediately
  - If network fails → UI rollback (card unchecked)
  - Streak recalculates correctly

---

## 7. Insights Screen

- [ ] **Initial Load**
  - Screen loads without crash
  - "Weekly Insights" title visible
  - Week range shown (e.g., "Feb 3 - Feb 9")

- [ ] **Insights Content (With Data)**
  - Headline displays (e.g., "Your week in review")
  - Highlights list shows multiple bullet points:
    - Coaching sessions count
    - Action cards created + completed
    - Top coach name
    - Action type summary
  - "Focus for next week" card with contextual advice
  - Stats card shows:
    - Sessions (number)
    - Actions (number)
    - Completed (number)
    - Completion rate (%)
    - Top coach (if any)

- [ ] **Empty State (No Data)**
  - Shows "No insights yet" card
  - Explains how to generate insights
  - Encourages user to start chatting
  - No error or crash

- [ ] **Refresh Button**
  - "Refresh summary" button visible at bottom
  - Tap → re-fetches data and rebuilds summary
  - Loading state shown during refresh
  - Summary updates with new data

- [ ] **Caching**
  - Load screen → summary displays
  - Close app and reopen → same summary still visible
  - Same week data cached (not re-fetched every load)
  - New week starts on Monday

- [ ] **Error Handling**
  - Network error → shows error card
  - "Try again" button visible and works
  - No crash or blank screen

- [ ] **Loading State**
  - First load → shows spinner + "Generating insights..."
  - Spinner disappears when data loads
  - No jank or UI freeze

---

## 8. Paywall Screen

- [ ] **Paywall Opens**
  - From Pro badge tap → paywall navigates correctly
  - From pro-gated coach → paywall navigates correctly
  - From "Add to Today" limit → paywall navigates correctly
  - Close button (X) visible in top right

- [ ] **Hero Section**
  - Emoji visible (✨)
  - "Upgrade to Pro" title readable
  - Subheading explains benefits
  - Clean, professional layout

- [ ] **Features List**
  - Shows 3–4 features with checkmarks
  - Each feature readable
  - Green checkmark icon visible

- [ ] **Subscription Packages**
  - Annual package shows first (if available)
  - Monthly package shows second
  - **Annual package visually highlighted:**
    - Black border (3px)
    - Warm background color (#FFF9F0)
    - Shadow effect visible
    - "Best value" badge shown

- [ ] **Package Details**
  - Package title visible (Annual, Monthly)
  - Price + period shown (e.g., "$79.99 / year")
  - "Subscribe" button on each card
  - Buttons are tappable

- [ ] **Subscribe Flow**
  - Tap "Subscribe" → Google Play purchase dialog
  - Can select sandbox testing account
  - Purchase completes without crash
  - Paywall shows success feedback/closes

- [ ] **Post-Purchase**
  - Alert shows "Welcome to Pro!" (or similar)
  - Entitlements update immediately
  - Pro badge appears on all screens
  - Pro coaches now unlocked

- [ ] **Restore Purchases Button**
  - "Restore purchases" link visible at bottom
  - Tap → shows loading state
  - If previous purchase found → success alert
  - If no purchases → shows "No Purchases Found"
  - No crash on restore

- [ ] **Legal Text**
  - Subscription terms visible at bottom
  - Text explains auto-renewal, cancellation
  - Readable and professional

- [ ] **Error Handling**
  - Offerings not loaded → shows error message
  - Error explains why (e.g., "RevenueCat not configured")
  - "Retry" button visible and works
  - Diagnostics toggle available (dev-only)

- [ ] **Loading State**
  - First load → skeleton shimmer animation
  - Looks professional, no jank
  - Clears when packages load

- [ ] **Close Button**
  - X button tappable
  - Closes paywall and returns to previous screen
  - No crash or stuck state

---

## 9. Settings Screen

- [ ] **Screen Loads**
  - All sections visible without crash
  - Scrollable if content exceeds screen height

- [ ] **Pro Status Card**
  - Shows current status: "Active" (Pro) or "Free" (non-Pro)
  - Renewal/expiration date shown (if Pro)
  - "Refresh Status" button works
  - Verification icon (checkmark for Pro, lock for Free)

- [ ] **Subscription Section**
  - Non-Pro: "Upgrade to Pro" button visible + functional
  - Pro: "Manage Subscription" link visible → opens Google Play settings
  - "Restore Purchases" button always visible
  - All buttons tappable

- [ ] **Support Section**
  - "Contact Support" → opens email client
  - "Privacy Policy" → opens browser to policy URL
  - "Terms of Service" → opens browser to terms URL
  - Links don't crash app

- [ ] **Account Section**
  - "Delete Account & Data" button visible (red/destructive styling)
  - Tap → confirmation alert
  - Alert has "Cancel" and "Continue" options
  - "Continue" → opens browser to deletion page
  - Doesn't immediately delete locally (user must confirm on web)

- [ ] **User ID Display**
  - Shows current user ID (Supabase UUID or device ID)
  - Readable but not editable

- [ ] **App Version**
  - Shows current version (e.g., "1.0.0")
  - Visible and readable

- [ ] **Demo Mode Toggle** (Dev-only)
  - If dev build: toggle visible
  - Can enable/disable demo mode
  - Shows confirmation alert

- [ ] **Error Handling**
  - Restore purchases error → shows alert with reason
  - Missing links → graceful error handling
  - No crashes on Settings operations

---

## 10. Entitlements & Gating

- [ ] **Free User Behavior**
  - Pro coaches show lock + "Unlock with Pro" button
  - Free coaches always accessible
  - Add to Today has 3-card daily limit
  - Hitting limit opens paywall

- [ ] **Pro User Behavior**
  - All coaches accessible (lock removed)
  - "Start" button always available
  - No Add to Today limit (5+, 10+ cards work)
  - Pro badge visible on header
  - Settings shows Pro status + renewal date

- [ ] **Purchase → Entitlement Update**
  - Purchase subscription
  - Pro badge updates immediately
  - Library coaches unlock instantly
  - Today limit removed
  - Settings shows Pro status
  - No app restart required

- [ ] **Restore Purchases**
  - Restore existing Pro subscription
  - Entitlements update immediately after restore
  - Pro features unlock
  - Alert confirms success

---

## 11. Async Auth & Device ID

- [ ] **First Launch (No Auth)**
  - App initializes with Supabase
  - If anonymous auth unavailable → device UUID used
  - No "Anonymous sign-ins are disabled" warning
  - User consistently identified across app

- [ ] **Auth Persistence**
  - Close app and reopen → same user ID
  - User data scoped to user ID
  - Action cards linked to correct user

- [ ] **Logout & Re-login**
  - Settings > Logout button works
  - App returns to onboarding
  - After re-onboarding → new or same user ID (depending on implementation)
  - Previous data accessible if same user ID

---

## 12. Network & Offline

- [ ] **Online (Normal Conditions)**
  - Messages send/receive normally
  - Action cards created and synced
  - Insights load from Supabase
  - No delays or errors

- [ ] **Offline (Flight Mode)**
  - Chat allows typing but shows offline indicator (if any)
  - Send → fails gracefully or queues
  - Demo response shown (if enabled)
  - App doesn't crash

- [ ] **Connection Recovery**
  - Turn off flight mode → app recognizes connection
  - Retry failed operations (if implemented)
  - Data syncs back to Supabase
  - No duplicate messages

---

## 13. Error Handling & Edge Cases

- [ ] **Network Errors**
  - [ ] Library fetch fails → fallback coaches display
  - [ ] Chat message fails → shows error + retry
  - [ ] Today cards fail to load → error state + retry
  - [ ] Insights fetch fails → error state + retry
  - [ ] Paywall fails to load offerings → error message + retry

- [ ] **Crashes & Recovery**
  - [ ] Force quit app → no data loss
  - [ ] Re-open → state restored from AsyncStorage
  - [ ] Streak data persistent
  - [ ] Insights cache persistent

- [ ] **Edge Cases**
  - [ ] Empty coach/action lists → proper empty states shown
  - [ ] Very long message text → wraps or truncates cleanly
  - [ ] 50+ action cards → list scrolls smoothly
  - [ ] Rapid taps on buttons → no duplicate actions
  - [ ] Switch between screens rapidly → no crashes

- [ ] **Memory/Performance**
  - Chat loads with 100+ messages → scrolls smoothly
  - Lists render without jank
  - No unusual memory usage
  - App responsive throughout

- [ ] **Keyboard & Input**
  - Keyboard appears/disappears smoothly
  - Text input never blocked by keyboard
  - Emoji support works
  - Paste text works
  - Long URLs don't break layout

---

## 14. Visual Polish

- [ ] **Typography Consistency**
  - Headers: Bold, clear hierarchy (h1 → h2 → h3)
  - Body text: Readable, consistent size
  - Captions: Subtle, secondary info
  - No misaligned or overlapping text

- [ ] **Spacing & Padding**
  - 24px horizontal margins on all screens
  - 16px gaps between cards
  - Consistent top/bottom padding
  - Safe area respected on all screens

- [ ] **Colors**
  - Black text on white backgrounds
  - Gray accents for secondary info (#666, #999)
  - Green for success (checkmarks, status)
  - Red for errors/destructive actions
  - Consistent throughout app

- [ ] **Cards & Containers**
  - Borders: 1–2px, subtle gray
  - Border radius: 16px for cards, 14px for badges
  - Shadow effect on elevated elements
  - Consistent card styling

- [ ] **Buttons**
  - Primary: Black background, white text
  - Secondary: Gray background, dark text
  - Disabled: Reduced opacity
  - Hit targets: 44px+ (easy to tap)
  - Rounded corners: 24px

- [ ] **Icons**
  - Material icons used consistently
  - Icons visible and recognizable
  - Proper sizing and alignment
  - Color contrast meets accessibility standards

- [ ] **Animations**
  - Loading spinners smooth (no jank)
  - Shimmer animation professional
  - Transitions smooth between screens
  - No lag or frame drops

---

## 15. Play Store Compliance

- [ ] **No Debug Screens in Production**
  - `/debug` route hidden (__DEV__ guard in place)
  - Billing debug hidden from non-dev builds
  - No test data visible to users

- [ ] **No Hardcoded Secrets**
  - API keys from env vars (not hardcoded)
  - No test credentials visible
  - RevenueCat keys from .env

- [ ] **Privacy & Legal**
  - Privacy Policy link works in Settings
  - Privacy Policy URL in Play Console
  - Privacyloads in browser (not broken link)

- [ ] **Permissions**
  - App only requests necessary permissions
  - Permissions explained in app store listing
  - No unexpected permission requests

---

## 16. Final Sign-Off

- [ ] **Full E2E Flows**
  - [ ] **New User Flow:**
    1. Fresh install → onboarding → Library → Chat with coach → Add to Today → Mark done → Insights
    2. Try Pro coach → paywall → purchase → unlock → chat works
  
  - [ ] **Existing User Flow:**
    1. Re-open app → goes to Library (no onboarding)
    2. Streak persists from yesterday
    3. Pro status persists
  
  - [ ] **Error Recovery Flow:**
    1. Fail to load coaches → see fallback + retry works
    2. Fail to send message → see error + retry works
    3. Network error → graceful degradation

- [ ] **Device Specifics**
  - [ ] App works on Android 9+
  - [ ] Portrait orientation (locked or responsive)
  - [ ] Notch / safe area handled
  - [ ] Back gesture works properly

- [ ] **Build Quality**
  - [ ] No console warnings (or only expected ones)
  - [ ] No red screen errors
  - [ ] No performance issues (FPS stable)
  - [ ] Bundle size reasonable (~15–25 MB)

- [ ] **Ready for Submission**
  - [ ] All features tested
  - [ ] No known bugs
  - [ ] Matches Play Store listing
  - [ ] Privacy policy live
  - [ ] App version correct (app.json)
  - [ ] Screenshots match app UI
  - [ ] Store listing description accurate

---

## Testing Notes

**Device Info:**
- Device: ________________
- OS Version: ____________
- Resolution: ____________
- Build Date: ____________

**Tester Name:** ________________

**Bugs Found:**
1. ________________________
2. ________________________
3. ________________________

**Overall Status: [ ] PASS [ ] FAIL [ ] NEEDS FIXES**

---

## Build & Submit Commands

```bash
# Build preview APK for testing
npm run build:android:preview

# Build production AAB for Play Store
npm run build:android:prod

# Submit to Play Store (after setup)
npm run submit:android:prod
```

---

**All tests passed? Ready to submit to Play Store! Follow RELEASE.md for next steps.**
