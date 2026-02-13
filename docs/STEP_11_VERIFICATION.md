# Step 11 Verification Checklist — EAS Build Pipeline

## Configuration Status

### ✅ Verified

- [x] **app.json versioning**
  - Version: `1.0.0` (semver)
  - Package name: `com.manoj.pocketcoachos` (matches Play Console)
  - versionCode: `1` (will auto-increment on each production build)
  - iOS bundleIdentifier: `com.manoj.pocketcoachos` (matches Android)

- [x] **eas.json profiles**
  - `development` → APK with dev client (local testing)
  - `preview` → APK for internal testing (production keys)
  - `production` → AAB with auto-increment (Play Store release)
  - Production profile set to `distribution: "store"` (proper for AAB)

- [x] **npm scripts registered**
  - `npm run build:android:preview` → Builds preview APK
  - `npm run build:android:prod` → Builds production AAB with auto-increment
  - `npm run submit:android:prod` → Submits to Play Store (requires `play-service-account.json`)

- [x] **Build environments**
  - All profiles export `APP_ENV` variable for runtime detection
  - eas.json CLI version locked to v16.32.0+

---

## Ready to Build

### First-Time Setup

```bash
# 1. Verify EAS login
eas login

# 2. Test preview APK build (no upload)
npm run build:android:preview

# 3. Download APK and test on device
# (Link will appear in terminal)
```

### Production AAB Build

```bash
# 1. Ensure version is correct in app.json
grep version app.json

# 2. Commit changes
git commit -m "feat: version 1.0.0 ready for release"

# 3. Build production AAB
npm run build:android:prod

# 4. Download AAB file (link in terminal)

# 5. Upload to Google Play Console:
#    - Release > Production (or Internal Testing first)
#    - Upload AAB
#    - Fill store listing details (if first time)
#    - Review & release
```

---

## What Happens on Build

### Preview Build (`npm run build:android:preview`)
```
1. EAS compiles React Native + Expo packages
2. Gradient + React Navigation drawer compiled
3. RevenueCat SDK bundled
4. Supabase client bundled
5. APK generated with production keys
6. ~5–15 min build time
7. Download link provided
```

### Production Build (`npm run build:android:prod`)
```
1. All of above +
2. Version code auto-incremented (1→2→3...)
3. App obfuscated (ProGuard/R8)
4. Bundle size optimized
5. AAB (App Bundle) generated instead of APK
6. Signed with production key
7. ~10–20 min build time
8. Download link provided
```

---

## Play Store Upload Flow

### Manual (Recommended First Time)

```
1. npm run build:android:prod
2. Download AAB file
3. Google Play Console > Your App > Release > [Track]
4. Create new release
5. Upload AAB
6. Review app details
7. Set rollout percentage (100% for production)
8. Review & roll out
```

### Automated (After Setup)

```bash
# Requires play-service-account.json in project root
npm run submit:android:prod

# Submits directly to track specified in eas.json
# (Currently set to "internal" for safety)
```

---

## Versioning on Next Release

**To release version 1.0.1:**

```json
// app.json
{
  "expo": {
    "version": "1.0.1"  // ← Change this
  }
}
```

**Auto-increment will continue:**
- Build 1 (v1.0.1): versionCode = 2 (continues from v1.0.0)
- Build 2 (v1.0.1): versionCode = 3
- Build 1 (v1.0.2): versionCode = 4

---

## Files Modified

- ✅ `package.json` — Added 3 npm scripts
- ✅ `eas.json` — Enhanced production profile with `distribution: "store"` and explicit Gradle command
- ✅ `docs/BUILD_PIPELINE.md` — Comprehensive build guide

---

## Next Steps

1. **Immediate**: Run `npm run build:android:preview` to test build process
2. **Test**: Download APK on physical device, verify app launches
3. **Final**: When ready for Play Store, run `npm run build:android:prod`
4. **Upload**: Follow [RELEASE.md](RELEASE.md) for Play Store submission
5. **Monitor**: Track build status in [EAS dashboard](https://expo.dev)

---

## Troubleshooting

**Q: How do I know if build succeeded?**
- Terminal shows download link or check [Expo dashboard](https://expo.dev/accounts/manoj079/projects/pocketcoachos/builds)

**Q: Where do I get the AAB file?**
- Click download link in terminal or fetch from EAS dashboard

**Q: Can I upload APK to Play Store?**
- No, Play Store requires AAB for production (APK only for internal testing)

**Q: What if version code isn't incrementing?**
- Check eas.json has `autoIncrement: true` in production profile (✅ it does)

---

## References

- Build guide: [docs/BUILD_PIPELINE.md](BUILD_PIPELINE.md)
- Release checklist: [docs/PLAY_STORE_CHECKLIST.md](PLAY_STORE_CHECKLIST.md)
- EAS docs: https://docs.expo.dev/eas/
