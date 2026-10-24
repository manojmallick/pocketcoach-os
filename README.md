# PocketCoach OS

A personal AI coaching app for Android and iOS. Pick a coach, describe what you're stuck on, and get a short list of concrete **action cards** (what to do today, this week, what to avoid, and what comes next), then check them off in a daily view.

Built with [Expo](https://expo.dev) (React Native, expo-router), Supabase, Google Gemini and RevenueCat.

## Features

- **Coach library**: Focus, Productivity and Habit coaches are free; Mindset Coach is Pro.
- **AI coaching chat**: send a message to a coach and get back structured action cards plus a weekly plan and coach notes.
- **Action cards**: four types: `TODAY`, `WEEK`, `AVOID`, `NEXT`. Each has a reason, steps and a time estimate.
- **Today view**: a checklist of your cards with streak tracking.
- **Insights**: a progress summary you can refresh.
- **Pro subscription**: paywall, purchase and restore flow via RevenueCat.
- **No sign-up**: Supabase anonymous auth, with an automatic device-ID fallback when anonymous auth is disabled.
- **Demo mode**: the chat works with deterministic fallback responses when the backend or the Gemini key isn't available, so you can try the app without any setup.

## Tech stack

| Layer | Technology |
|---|---|
| App | Expo SDK 54, React Native 0.81, React 19, expo-router 6 (file-based routes), drawer navigation |
| State | Zustand (Pro entitlement), AsyncStorage (flags) |
| Backend | Supabase: Postgres tables with row-level security, plus a `chat` Edge Function (Deno) |
| AI | Google Gemini API, called from the Edge Function |
| Billing | RevenueCat (`react-native-purchases`) |
| Builds | EAS Build and Submit (Android profiles: development, preview, production) |

## Quick start

Prerequisites: Node.js 18+, an [Expo](https://expo.dev) account, and [EAS CLI](https://docs.expo.dev/eas/) (`npm install -g eas-cli`). Billing needs a development build; Expo Go can't run native purchases.

```bash
git clone https://github.com/manojmallick/pocketcoach-os.git
cd pocketcoach-os
npm install
cp .env.example .env      # then fill in your keys (see below)
npx expo start -c         # -c clears the Metro cache to avoid stale routes
```

Open the app on an Android emulator, iOS simulator, or a development build. Expo Go works for everything except billing.

### Environment variables

Create `.env` in the project root:

| Variable | Used for |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat public SDK key for Android (`goog_...`) |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat public SDK key for iOS (`appl_...`) |

The Edge Function reads its secrets from the Supabase project, not from `.env`: `GEMINI_API_KEY`, plus `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (provided by Supabase). Never put the service-role key in an `EXPO_PUBLIC_` variable.

### Set up Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor. It creates `coach_templates`, `user_contexts`, `chat_sessions` and `action_cards` and seeds the four coaches.
3. Enable **anonymous sign-ins** in Authentication settings (recommended; otherwise the app uses a device ID).
4. Deploy the chat function and set its secret:

```bash
supabase functions deploy chat
supabase secrets set GEMINI_API_KEY=<your key>
```

See [DATA_LAYER.md](DATA_LAYER.md) for the schema and data-access helpers, and [docs/AUTH.md](docs/AUTH.md) for the auth flow.

## Build and release (Android)

```bash
eas login
eas init                                          # once

eas build -p android --profile development        # dev-client APK
eas build -p android --profile preview            # release APK for internal testing
eas build -p android --profile production         # AAB for Play Store
eas submit -p android --profile production        # submit to the internal track
```

`versionCode` increments automatically on production builds (`appVersionSource: "remote"` and `autoIncrement` in `eas.json`). Shortcuts are in `package.json` (`build:android:preview`, `build:android:prod`, `submit:android:prod`). See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) and [docs/RELEASE.md](docs/RELEASE.md) for the full workflow.

## Project structure

```
app/                    File-based routes (expo-router)
├── _layout.tsx         Root layout: auth and route guard
├── onboarding.tsx      First-run welcome
├── paywall.tsx         Pro upgrade modal
└── (drawer)/           Library, Chat, Today, Insights, Settings, billing-debug
components/             Shared UI (Button, Card, Chip, Header, Typography...)
constants/              Theme and URLs
hooks/                  Colour-scheme and theme hooks
lib/                    auth, db, supabase client, RevenueCat, build-mode helpers
state/                  Zustand store for Pro entitlement
storage/                AsyncStorage flag helpers
supabase/               Edge function (chat) and SQL migrations
docs/                   Auth, build pipeline, QA, release and Play Store notes
```

## Documentation

| Document | Contents |
|---|---|
| [SETUP.md](SETUP.md) | What was implemented and where |
| [DATA_LAYER.md](DATA_LAYER.md) | Database schema, access functions, error handling |
| [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) | Internal-testing release steps |
| [docs/AUTH.md](docs/AUTH.md) | Anonymous auth and device-ID fallback |
| [docs/BUILD_PIPELINE.md](docs/BUILD_PIPELINE.md) | EAS build pipeline |
| [docs/QA.md](docs/QA.md), [docs/QA_TEST_CHECKLIST.md](docs/QA_TEST_CHECKLIST.md) | Test plans |
| [docs/PLAY_STORE_CHECKLIST.md](docs/PLAY_STORE_CHECKLIST.md) | Play Store submission |
| [docs/TECH_NOTES.md](docs/TECH_NOTES.md) | Technical notes |

## Troubleshooting

| Problem | Fix |
|---|---|
| Stale screens or old routes | `npx expo start -c` |
| Purchases fail in Expo Go | Use a development build (`eas build --profile development`) |
| Chat shows generic answers | The Edge Function isn't deployed or `GEMINI_API_KEY` isn't set; the app is in demo/fallback mode |
| Billing diagnostics | Open the hidden `billing-debug` screen in the drawer |

## Status

Pre-release: core flows (library, chat, today, paywall) work; see [docs/EXECUTIVE_SUMMARY.md](docs/EXECUTIVE_SUMMARY.md) for the remaining polish items.
