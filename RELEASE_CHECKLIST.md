# Release Checklist — Play Store Internal Testing

Step-by-step guide to ship a build to Play Store internal testing and verify
that in-app purchases work (avoiding the dreaded "Item not found" error).

---

## 1. Pre-build

- [ ] Bump `version` in `app.json` if this is a new user-facing release.
- [ ] `versionCode` auto-increments via EAS (`appVersionSource: "remote"`).
- [ ] Ensure `.env` has the correct `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
- [ ] Ensure your RevenueCat dashboard has:
  - Products created and linked to Google Play products.
  - An Offering with at least one Package.
  - The "pro" entitlement mapped to the product(s).

## 2. Build the AAB

```bash
eas build -p android --profile production
```

- Wait for EAS to finish (check [expo.dev/accounts](https://expo.dev/accounts)).
- Download the `.aab` artifact or let `eas submit` handle it.

## 3. Upload to Play Console

### Option A — Manual

1. Go to [Play Console](https://play.google.com/console) → your app.
2. **Testing → Internal testing** → **Create new release**.
3. Upload the `.aab`.
4. Add release notes (e.g. "Internal test build v1.0.0").
5. **Review release** → **Start rollout to Internal testing**.

### Option B — EAS Submit

```bash
eas submit -p android --profile production
```

Requires `play-service-account.json` (see [EAS docs](https://docs.expo.dev/submit/android/)).

## 4. Configure testers

1. In Play Console → **Internal testing** → **Testers** tab.
2. Create or select an email list (e.g. "Internal Testers").
3. Add every Google account that will test, **including your own**.
4. Copy the **opt-in URL** (looks like
   `https://play.google.com/apps/internaltest/...`).

## 5. Opt-in as a tester

1. Open the opt-in URL **on the device** (or in a browser signed into the
   correct Google account).
2. Click **"Accept"**.
3. Wait **a few minutes** — Google may need up to 15 minutes to propagate.

## 6. Install the build

1. After opting in, the opt-in page shows a Play Store link.
2. Tap **"download it on Google Play"** to install.
3. **Important:** You must install from the Play Store — sideloaded APKs/AABs
   cannot use Google Play Billing.

## 7. Add license testers (for free test purchases)

1. Play Console → **Settings → License testing**.
2. Add the **same** Google accounts used above.
3. This allows purchases to go through without being charged.

## 8. Verify in-app purchases work

1. Open the app → go to **Paywall** or **Settings → Upgrade to Pro**.
2. Offerings should load (not "error loading offerings").
3. Tap a package → Google Play purchase dialog should appear.
4. Complete the purchase → Pro should activate immediately.
5. Check **Settings → Pro Status** → should show **Active** + renewal date.

---

## Troubleshooting

### "Item not found" / offerings empty

| Cause | Fix |
|-------|-----|
| Products not approved in Play Console | Create in-app products, set pricing, activate them |
| Offering not configured in RevenueCat | Dashboard → Offerings → add packages with Play product IDs |
| Wrong API key | Check `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` matches RevenueCat → API Keys |
| App not installed from Play Store | Uninstall sideloaded version, install from internal testing link |
| Build not yet rolled out | Wait for "Available to internal testers" status in Play Console |

### "This version is not available in your country"

- The tester's Google account region must match the app's target countries.
- Add the tester's country in **Play Console → Production → Countries/regions**.

### Purchase dialog shows then cancels immediately

- The Google account on the device must be a **license tester** (Settings → License testing).
- If using a different Google account than the one added as tester, switch the primary Google account on the device.

### Pro status doesn't update after purchase

- Check RevenueCat dashboard → Customers → search for the user.
- Ensure the "pro" entitlement is mapped to the product.
- Pull-to-refresh or tap "Refresh Status" in Settings.
- Check Billing Debug panel (Settings → tap Version 7 times).

### Build installs but crashes on launch

- Use `adb logcat` to check crash logs.
- Ensure all native dependencies are compatible with the Expo SDK version.
- Try a fresh `eas build` with `--clear-cache`.

---

## Timing & Gotchas

- After uploading a new AAB, it can take **5–30 minutes** for Google to process it.
- After creating/modifying in-app products, they can take **up to 24 hours** to propagate (though usually under 1 hour).
- The **first build ever** uploaded to a new app listing takes the longest.
- Always test on a **real device** — emulators cannot use Google Play Billing.
- If you change the `package` name in `app.json`, you need a new Play Console listing.

---

## Quick Reference

```bash
# Full cycle: build → submit → test
eas build -p android --profile production
eas submit -p android --profile production

# Check build status
eas build:list

# Open Play Console
open "https://play.google.com/console"
```
