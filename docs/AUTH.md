# AUTH

## Current model

We use Supabase anonymous auth when it is enabled. If anonymous auth is disabled,
we automatically fall back to a device-based guest identity stored in
AsyncStorage. This keeps a stable user key across sessions without blocking the
app.

## How it works

- ensureAuth() checks for an existing Supabase session.
- If none exists, it attempts anonymous sign-in.
- If anonymous sign-in is disabled (or fails), it uses a device ID stored in
  AsyncStorage as the user key.

## Enabling anonymous auth (recommended)

In Supabase Dashboard:

1. Authentication -> Providers
2. Enable Anonymous sign-ins

Once enabled, the app will create anonymous users automatically.

## Guest mode behavior

- User key is stable per device (AsyncStorage).
- All database writes are scoped to user_id via getUserId().
- Signing out clears the Supabase session but does not reset the device ID.
  Use the onboarding reset flow if you want a full local reset.
