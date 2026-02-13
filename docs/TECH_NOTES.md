# TECH_NOTES

## App entry points

- Expo entry: package.json -> main = expo-router/entry
- Root layout: app/_layout.tsx
- Drawer layout: app/(drawer)/_layout.tsx

## Routes (expo-router)

- /(drawer)/library
- /(drawer)/chat
- /(drawer)/today
- /(drawer)/settings
- /(drawer)/billing-debug (hidden)
- /(drawer)/index -> redirects to /(drawer)/library
- /onboarding
- /paywall (modal)
- /debug (dev-only)

## Providers and boot sequence

- ThemeProvider from @react-navigation/native (root layout)
- Root initialization order:
  - ensureAuth()
  - initPurchases() + startProStatusListener() + refresh()
  - hasCompletedOnboarding() -> routing guard

## Environment variables

App (.env):
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
- EXPO_PUBLIC_REVENUECAT_IOS_KEY

Supabase Edge Function env (supabase/functions/chat):
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## Build commands

- npm install
- npm run start
- npx expo start -c
- eas build -p android --profile development
- eas build -p android --profile preview
- eas build -p android --profile production
- eas submit -p android --profile production
