# QA Checklist

## Onboarding guard (Step 2)

Manual tests:

- Fresh install (delete app + clear storage) -> /onboarding always shows
- Tap Continue -> routes to /(drawer)/library
- Force-quit + relaunch -> never returns to onboarding
- Deep link to /onboarding when already onboarded -> redirects to /(drawer)/library
- Open paywall from any screen -> onboarding guard does not interrupt
- App launch shows loading screen without flicker
