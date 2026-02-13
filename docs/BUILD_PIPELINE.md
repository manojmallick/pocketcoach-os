# EAS Build Pipeline for PocketCoach OS

This document explains how to build, upload, and release Android builds via EAS and Google Play Store.

---

## Prerequisites

**Before building, ensure:**

- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into EAS: `eas login` (use Expo account)
- [ ] Logged into Google Play Console
- [ ] Service account JSON key downloaded: [`play-service-account.json`](#play-service-account-setup)
- [ ] `app.json` versioning correct (version, versionCode)
- [ ] `eas.json` profiles configured

---

## Build Profiles

### 1. **Development** (APK)
```bash
npm run build:android:preview
```
- **Use case**: Local testing on real devices, QA
- **Output**: APK file
- **Distribution**: Internal only
- **Signing**: Development key (EAS-managed)

### 2. **Preview** (APK)
```bash
npm run build:android:preview
```
- **Use case**: Pre-release UAT, closed testing
- **Output**: APK file
- **Distribution**: Internal only
- **Signing**: Production key (EAS-managed)

### 3. **Production** (AAB)
```bash
npm run build:android:prod
```
- **Use case**: Google Play Store release
- **Output**: AAB (Android App Bundle)
- **Distribution**: Store
- **Signing**: Production key with auto-increment versioning
- **Auto-increment**: Version code increments automatically

---

## Build Process

### Step 1: Prepare for Build

**Update version and version code:**

```bash
# Check current version
grep -A 2 '"version"' app.json
grep -A 4 '"android"' app.json | grep versionCode

# If needed, manually increment:
# Edit app.json: "version": "1.0.1" (semver)
# eas.json autoIncrement will handle versionCode
```

**Verify no uncommitted changes:**
```bash
git status
git add .
git commit -m "chore: prepare build v1.0.0"
```

### Step 2: Build APK (Preview)

```bash
npm run build:android:preview
```

**What happens:**
1. EAS compiles your app with production keys
2. Generates APK optimized for testing
3. Download link appears in terminal
4. Build artifacts available in EAS dashboard

**Output example:**
```
✅ Build finished
📱 Download your APK
   APK: https://expo-artifacts.s3.amazonaws.com/...
```

### Step 3: Build AAB (Production)

```bash
npm run build:android:prod
```

**What happens:**
1. EAS compiles app with production keys
2. Generates Android App Bundle (AAB)
3. Version code auto-increments (1 → 2 → 3, etc.)
4. AAB optimized for Google Play distribution
5. Ready for upload to Play Console

**Output example:**
```
✅ Build finished
📦 Download your AAB
   AAB: https://expo-artifacts.s3.amazonaws.com/...
```

---

## Upload to Google Play Store

### Manual Upload (Recommended for First Time)

**Download the AAB file locally:**

1. Run `npm run build:android:prod`
2. Click download link or fetch from EAS dashboard
3. In Google Play Console:
   - Select your app
   - Go to **Release** > **Production** (or your target track)
   - Click **Create new release**
   - Upload the AAB file
   - Review content, confirm, review details → **Roll out**

### Automated Upload (Optional)

```bash
npm run submit:android:prod
```

**Prerequisites:**
- `play-service-account.json` in project root
- Service account has "Admin" role in Play Console
- Track set to "internal" in `eas.json` submit profile

**Note:** First release must be done via Play Console UI (no sandboxing).

---

## Versioning Strategy

### Version Pattern: `X.Y.Z` (semver)

- **X (Major)**: Breaking changes
- **Y (Minor)**: New features
- **Z (Patch)**: Bug fixes

### Version Code: Auto-Increment

Each production build auto-increments version code:
- Build 1: versionCode = 1, version = 1.0.0
- Build 2: versionCode = 2, version = 1.0.0 (code increments)
- When you bump version to 1.0.1: versionCode continues from last

**Update version before release:**

```json
// app.json
{
  "expo": {
    "version": "1.0.1",  // <-- Update this
    "android": {
      "versionCode": 1   // <-- EAS auto-increments from this
    }
  }
}
```

---

## Play Service Account Setup

### Create Service Account (One-Time)

**In Google Cloud Console:**

1. Go to **APIs & Services** > **Service Accounts**
2. Click **Create Service Account**
3. Name: `PocketCoach-EAS-Release`
4. Grant **Editor** role
5. Create **JSON** key, download as `play-service-account.json`

**In Google Play Console:**

1. Go to **Settings** > **API access**
2. Click **Create New Service Account**
3. Paste the service account email from JSON
4. Grant **Admin** role
5. Approve

**Save locally (never commit):**

```bash
# Add to .gitignore
echo "play-service-account.json" >> .gitignore

# Place the JSON file in project root
cp ~/Downloads/play-service-account.json ./
```

---

## Build Troubleshooting

### Build Fails: "Authentication Failed"

```
❌ Error: Missing EAS credentials
```

**Fix:**
```bash
eas logout
eas login  # Log back in with Expo account
```

### Build Fails: "Version Code Too Low"

```
❌ Version code 5 is lower than existing release (10)
```

**Fix:**
- Version code must always increase
- Check Play Console for current version code
- Manually increment in `app.json` or let EAS auto-increment

### Build Hangs or Times Out

```bash
# Check build status in browser
eas build --status
```

**Fix:**
- Wait 15–30 minutes (builds can take time)
- Check EAS dashboard for errors
- Restart: `eas build -p android --profile production --wait=false`

### "No Permissions" on Submit

```
❌ Service account lacks permissions
```

**Fix:**
- Verify service account has **Admin** role in Play Console
- Re-download `play-service-account.json`
- Confirm `serviceAccountKeyPath` in `eas.json`

---

## Release Checklist

Before submitting to Play Store:

- [ ] App version bumped in `app.json`
- [ ] No hardcoded API keys or secrets
- [ ] Dev-only screens hidden (debug.tsx behind `__DEV__`)
- [ ] Paywall tested in production (not sandbox)
- [ ] All screens tested on physical device
- [ ] Privacy policy link works in Settings
- [ ] Subscription products created in RevenueCat and Play Console
- [ ] Play Store listing (description, screenshots) complete
- [ ] Content rating & data safety forms filled
- [ ] Built with `npm run build:android:prod`
- [ ] AAB file downloaded and tested locally
- [ ] Upload to Play Console > **Internal Testing** track first

---

## Monitoring Builds

**Check all builds:**
```bash
eas build --status
```

**Check specific build:**
```bash
eas build --status --build-id <BUILD_ID>
```

**Fetch build artifacts:**
```bash
eas build --platform android --profile production --wait=false
```

**View in dashboard:**
- https://expo.dev/accounts/manoj079/projects/pocketcoachos/builds

---

## Performance Optimization

### Bundle Size

Current AAB builds with tree-shaking enabled. To check size:

```bash
# After build completes, check artifact size
# AAB should be 15–25 MB for typical Expo app
```

### Proguard & Minification

EAS enables by default. To verify:

1. In Play Console, check **Release** > **Artifacts** > **Size comparison**
2. AAB should be smaller than APK equivalent

---

## Next Steps

1. **First build**: Run `npm run build:android:preview`, download APK, test on device
2. **Production AAB**: Run `npm run build:android:prod` when ready for store
3. **Upload**: Follow [Play Store Release Guide](../RELEASE.md)

---

## Reference

- **Expo EAS Docs**: https://docs.expo.dev/eas/
- **EAS Build**: https://docs.expo.dev/eas-update/getting-started/
- **Google Play Versioning**: https://developer.android.com/studio/publish/versioning
- **Android App Bundle**: https://developer.android.com/guide/app-bundle
