# Release Playbook — PocketCoach OS

Complete step-by-step guide to release PocketCoach OS from Internal Testing → Production on Google Play Store.

---

## Overview: Release Tracks

Google Play uses **release tracks** to safely roll out new versions:

| Track | Purpose | Duration | Testers | Next Step |
|-------|---------|----------|---------|-----------|
| **Internal Testing** | Quick QA, non-user testing | Days 1–2 | You | → Closed Testing |
| **Closed Testing** | Beta with real testers | 14+ days | 12–50 users | → Production |
| **Production** | Released to everyone | Forever | All users | End |

---

## Pre-Release Checklist

Before creating any release, verify:

### Code Quality
- [ ] No console errors or warnings
- [ ] No debug screens visible in production build (`__DEV__` guards in place)
- [ ] All hardcoded API keys / secrets removed
- [ ] Network requests use production URLs (Supabase, RevenueCat)

### App Features
- [ ] Onboarding flow completes without errors
- [ ] Chat with all coaches works
- [ ] Action cards can be added to Today
- [ ] Today streak calculates correctly
- [ ] Insights loads weekly summary
- [ ] Paywall shows subscription plans (sandbox)
- [ ] Pro purchase works end-to-end in sandbox
- [ ] Settings screen has Privacy Policy link

### Build Readiness
- [ ] App version bumped in `app.json` (e.g., 1.0.0)
- [ ] `eas.json` production profile configured
- [ ] Android AAB built successfully: `npm run build:android:prod`
- [ ] AAB downloaded and inspected for size (~15–25 MB)

### Play Console Setup
- [ ] App created and published (not in draft)
- [ ] Bundle identifier: `com.manoj.pocketcoachos`
- [ ] App icon uploaded (512×512)
- [ ] Feature graphic uploaded (1024×500)
- [ ] Store listing complete (description, screenshots)
- [ ] Content rating questionnaire filled
- [ ] Data safety form filled
- [ ] Privacy policy URL added to Play Console
- [ ] Subscription product created: "PocketCoach Pro" (monthly + yearly)

---

# PHASE 1: Internal Testing Release

**Goal:** Quick validation with you or your team. Usually 1–3 days.

---

## Step 1.1: Download AAB from EAS

```bash
# Build production AAB
npm run build:android:prod

# Output: Link to download AAB
# Download and save locally: pocketcoach-os-v1.0.0.aab
```

---

## Step 1.2: Go to Google Play Console

**URL:** https://play.google.com/console

**Navigate to:**
```
Select App: PocketCoach OS
   ↓
Left sidebar: "Release" section
   ↓
Choose: "Internal testing" (not Closed testing yet)
```

---

## Step 1.3: Create Internal Testing Release

**In Play Console, Internal testing track:**

1. **Click:** `"Create new release"` button (top right)

2. **Upload AAB:**
   - Click **"Upload"** section
   - Select downloaded AAB file: `pocketcoach-os-v1.0.0.aab`
   - Wait for upload + processing (~2 min)
   - Verify shows: ✅ Bundle processed successfully

3. **Release notes (optional):**
   - If desired, add: `"Internal QA build v1.0.0 - Testing Onboarding, Chat, Pro gating"`

4. **Review release details:**
   - App name, version code (e.g., `1`), version string (`1.0.0`)
   - Permissions summary shown
   - Verify no blockers/warnings

5. **Click:** `"Review release"` → `"Start rollout to Internal Testing"`

---

## Step 1.4: Verify Internal Testing Link

**In Play Console:**

1. Go back to **Internal testing** track
2. You should see a **release card** with status: **"Active"** ✅
3. Under the release, you'll see: **"Testing link"**

```
📱 Download link format:
https://play.google.com/apps/testing/com.manoj.pocketcoachos
```

---

## Step 1.5: Test on Device

**On Android device:**

1. Open internal testing link (from previous step)
2. Tap **"Download it on Google Play"** OR **"Install"**
3. Install app from Play Store
4. Launch app and run manual tests:

**QA Checklist (5–10 min):**
- [ ] App launches without crashes
- [ ] Onboarding completes successfully
- [ ] Can select a coach and chat
- [ ] Chat "Add to Today" button works
- [ ] Today screen shows added action
- [ ] Insights screen loads weekly summary
- [ ] Can view Settings > Privacy Policy
- [ ] Paywall shows subscription options (sandbox)
- [ ] Can see PRO badge on Pro coaches
- [ ] No console errors or debug UI visible

---

## Step 1.6: Fix Issues (If Found)

**If bugs found:**

1. Fix code locally
2. Commit changes
3. Rebuild: `npm run build:android:prod` (auto-increments version code)
4. Upload new AAB to Internal Testing track again
5. Re-test on device

**Repeat until clean.**

---

---

# PHASE 2: Closed Testing Release

**Goal:** Beta test with real external testers. 12+ users for 14+ days.

**Duration:** 14 calendar days minimum (enforced by Play Store)

---

## Step 2.1: Archive Internal Testing Release

Once internal testing is complete, promote to Closed Testing.

**In Play Console:**

1. Go to **Release** section
2. Select **"Closed testing"** track (left sidebar)
3. You'll see: **"No releases yet"** (empty state)

---

## Step 2.2: Promote Release to Closed Testing

**In internal testing track:**

1. Find the **"Active"** release card
2. Click **"Edit release"** (pencil icon)
3. At bottom, click **"Promote release"**
4. Select: **"Promote to Closed testing"**
5. Review release details
6. Click **"Confirm"**

---

## Step 2.3: Verify Closed Testing Release

**In Play Console:**

1. Go to **Release** → **Closed testing**
2. Verify release now shows: **"Active"** ✅
3. Status should say: **"Released"**

---

## Step 2.4: Add Testers

**In Closed testing track:**

1. Click **"Manage testers"** (or **"Testers"** section)
2. In the **"Users"** section, click **"Create new list"**: `"Beta Testers"`
3. Add tester emails:
   - Can be Google emails (Gmail, corporate, etc.)
   - **Minimum 12 testers for production eligibility**
   - Example: `user1@gmail.com`, `user2@gmail.com`, etc.
4. Click **"Save"**

---

## Step 2.5: Generate Tester Signup Link

**In Closed testing track:**

1. Find the **tester list** you just created
2. Copy the **"Signup link"** (looks like a Google Forms link):
   ```
   https://play.google.com/apps/testing/com.manoj.pocketcoachos
   ```
3. **Share with testers:**
   - Email: `"We're testing PocketCoach beta. Click link to join and install app."`
   - Ask them to test for 2–3 days and report bugs

---

## Step 2.6: Monitor Testing Period

**During 14-day closed testing window:**

1. **Day 1–3:** Testers download and test
2. **Day 3–7:** Collect feedback, fix critical bugs
3. **Day 7–14:** Stability testing

**If critical bugs found:**
- Fix code
- Rebuild AAB: `npm run build:android:prod`
- Upload new AAB to Closed testing track
- Reset testing duration (14 days restarts)

---

## Step 2.7: Verify Eligibility for Production

**After 14 days of closed testing:**

1. Go to **Release** → **Closed testing**
2. Find the **"Active"** release
3. Look for status indicator:
   - ✅ If **green**: "Eligible for Production"
   - ⏳ If **gray**: "Still under 14-day minimum"

**Minimum requirements to promote:**
- ✅ 14 calendar days in Closed testing
- ✅ At least 1 active tester
- ✅ No recent crashes reported
- ✅ All required app store details filled

---

---

# PHASE 3: Production Release

**Goal:** Release to everyone on Google Play.

**Duration:** Immediate (visible to all users within 1–2 hours)

---

## Step 3.1: Prepare for Production

**Final checks before going live:**

- [ ] All tester feedback addressed
- [ ] No known critical bugs
- [ ] Paywall tested with RevenueCat production keys (NOT sandbox)
- [ ] Crash logs reviewed and clean
- [ ] App store listing optimized (screenshots, description)
- [ ] Privacy policy link verified

---

## Step 3.2: Promote to Production

**In Play Console:**

1. Go to **Release** → **Closed testing**
2. Find the **"Active"** release (should show ✅ "Eligible for Production")
3. Click **"Edit release"** (pencil icon)
4. Scroll to bottom
5. Click **"Promote release"** → Select **"Promote to Production"**
6. Review final details:
   - App version, version code
   - Release notes (optional, visible to all users)
7. Click **"Review"** → **"Confirm rollout to Production"**

---

## Step 3.3: Verify Production Release

**In Play Console:**

1. Go to **Release** → **Production** (top of Release section)
2. You should see a **release card** with status: **"Active"** ✅
3. Status should show:
   ```
   Version 1.0.0 (version code 1)
   Released to: 100%
   ```

---

## Step 3.4: Monitor Production Rollout

**After clicking confirm, rollout happens in phases:**

| Timeframe | Status | Users Receiving |
|-----------|--------|-----------------|
| 0–30 min | "Staged rollout" | 2% of users |
| 30 min – 2h | "Rolling out" | 10–50% |
| 2–4h | "Fully rolled out" | 100% |

**You can monitor in Play Console:**
```
Release → Production → [Active Release Card]
   ↓
Scroll right: see rollout progress bar
   ↓
Eventually: "100% Complete"
```

---

## Step 3.5: Verify App on Google Play Public Listing

**Confirm users can see it:**

1. Open Google Play Store app
2. Search: **"PocketCoach OS"**
3. Should show your app with status: **"Install"** (or **"Update"** if already installed)

**Congratulations! You're live on Play Store.** 🎉

---

---

# Rolling Back (Emergency)

If critical bugs discovered after production release:

1. **Pause rollout** (within 4h of start):
   ```
   Release → Production → [Active Release]
   Click: "Pause rollout" or "Halt rollout"
   ```

2. **Fix the bug locally**

3. **Rebuild AAB** with fix:
   ```bash
   npm run build:android:prod
   ```

4. **Upload new AAB to Production track** (replaces current version)

5. **Resume rollout** or start new staged rollout

---

# Common Play Store Release Issues

### Issue: "Version Code Already Exists"

```
❌ Version code 5 is already released/active
```

**Fix:**
- Version code must always increase
- `eas.json` autoIncrement handles this automatically
- If manually updated, ensure it's higher than previous: `versionCode: 6`

---

### Issue: "Minimum 14 Days for Closed Testing Not Met"

```
⏳ Cannot promote to Production yet
```

**Fix:**
- Wait 14 calendar days from Closed testing release
- Track shows "X days remaining"
- Once 14 days pass, button becomes available

---

### Issue: "Release Blocked: Data Safety Form Incomplete"

```
❌ App cannot be released without Data Safety form
```

**Fix:**
- Go to **App details** → **Data safety**
- Complete all required fields (data types, retention, sharing)
- Save and return to Release

---

### Issue: "No Testers in Closed Testing"

```
❌ Cannot promote to Production: no active testers
```

**Fix:**
- Closed testing track must have **at least 1 active tester** for 14 days
- Add yourself or a colleague as tester via signup link
- Ensure tester has installed app at least once

---

### Issue: "App Not Appearing on Play Store"

```
⏳ App shows as "Unreleased" even after Production rollout
```

**Fix:**
- May take 1–4 hours to appear in search
- Refresh Play Store cache: Settings > Apps > Clear cache for Play Store
- May need to wait 12–24h for indexing
- Check: Release → Production shows "Active" and "100%"

---

---

# Release Checklist (Quick Reference)

**Internal Testing (Day 1):**
- [ ] Build AAB: `npm run build:android:prod`
- [ ] Upload to Internal testing track
- [ ] Download and test on device
- [ ] Verify no crashes

**Closed Testing (Day 2):**
- [ ] Promote to Closed testing
- [ ] Add 12+ testers
- [ ] Share signup link with testers
- [ ] Monitor for 14 days

**Production (Day 16+):**
- [ ] Verify 14-day minimum met
- [ ] Check "Eligible for Production" status
- [ ] Promote to Production
- [ ] Confirm rollout to 100%
- [ ] Verify on Play Store public listing

---

## Reference Links

- **Play Console Dashboard:** https://play.google.com/console
- **Your App in Console:** https://play.google.com/console/u/0/developers/app/com.manoj.pocketcoachos
- **Play Store Public Listing:** https://play.google.com/store/apps/details?id=com.manoj.pocketcoachos
- **Build Pipeline Guide:** [BUILD_PIPELINE.md](BUILD_PIPELINE.md)
- **Pre-Release Checklist:** [PLAY_STORE_CHECKLIST.md](PLAY_STORE_CHECKLIST.md)

---

**Done!** Your app is now live on Google Play Store.
