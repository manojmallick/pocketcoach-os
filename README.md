# PocketCoach OS

A personal AI coaching app built with [Expo](https://expo.dev), React Native, Supabase, and RevenueCat.

## Prerequisites

- Node.js 18+
- [EAS CLI](https://docs.expo.dev/eas/): `npm install -g eas-cli`
- An [Expo](https://expo.dev) account

## Get started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (clear cache to avoid stale routes)
npx expo start -c
```

Open on a development build, Android emulator, iOS simulator, or Expo Go (limited — native billing unavailable).

## EAS Build & Submit

```bash
# Authenticate with Expo
eas login

# Link this project (only needed once)
eas init

# Development build (debug APK for dev-client)
eas build -p android --profile development

# Preview build (release APK for internal testing)
eas build -p android --profile preview

# Production build (AAB for Play Store)
eas build -p android --profile production

# Submit to Play Store internal track
eas submit -p android --profile production
```

### Versioning

- `version` in `app.json` is the user-facing version (e.g. `1.0.0`).
- `versionCode` auto-increments on each production build via `appVersionSource: "remote"` + `autoIncrement: true` in `eas.json`.
- See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for the full internal-testing workflow.

## Environment Variables

Create a `.env` file at the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
```

## Project Structure

```
app/              → File-based routes (expo-router)
  (drawer)/       → Drawer navigator (Library, Chat, Today, Settings)
  onboarding.tsx  → First-run welcome screen
  paywall.tsx     → Upgrade to Pro modal
components/       → Shared UI components
constants/        → Theme, URLs
lib/              → Auth, DB, RevenueCat, build-mode helpers
state/            → Zustand stores (pro status)
storage/          → AsyncStorage flag helpers
store/            → (legacy — can be removed)
supabase/         → Edge functions + migrations
```

## Clearing the cache

If you see stale screens (e.g. old routes), clear the Metro cache:

```bash
npx expo start -c
```
