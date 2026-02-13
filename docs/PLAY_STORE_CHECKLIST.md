# Google Play Store Checklist for PocketCoach OS

Complete this checklist before submitting to Google Play Console.

## Store Listing

### Basic Information
- [ ] App name: **PocketCoach OS**
- [ ] Short description (80 chars max):
  - Example: "Your personal AI coaching assistant. Get actionable advice, daily tasks, and weekly insights."
- [ ] Full description (4000 chars max):
  - Highlight: AI coaches, personalized action cards, daily tracking, weekly insights
  - Include core features: Chat with coaches, Today (action list), Library, Insights, Settings
  - Mention subscription model (free limited use, Pro unlimited)
- [ ] App icon: 512×512 PNG (required)
- [ ] Feature graphic: 1024×500 PNG (required for listing)
- [ ] Screenshots (5–8 recommended):
  - Library (coach selection)
  - Chat (conversation + action cards)
  - Today (checklist + streak)
  - Insights (weekly summary)
  - Paywall (upgrade prompt)

### Content Rating Questionnaire
**Path:** App details > Content rating > Fill out questionnaire

Answer honestly:
- Does the app contain violence? **No**
- Does the app contain sexual content? **No**
- Does the app contain profanity? **No**
- Does the app contain substance abuse? **No**
- Does the app collect personal data? **Yes** → See Data Safety below

---

## Data Safety Form

**Path:** App details > Data safety

### Data Collected
- [ ] User ID (from Supabase or device) → **Stored locally & in Supabase**
- [ ] Chat messages (user-to-coach conversations) → **Stored in Supabase**
- [ ] Action cards (tasks, completions) → **Stored in Supabase**
- [ ] Coaching sessions (activity history) → **Stored in Supabase**
- [ ] Pro/free subscription status → **Stored via RevenueCat + cached**
- [ ] Streak data (daily completion) → **Stored in AsyncStorage**

### Data Sharing
- [ ] Do you share data with third parties?
  - **Yes**: Supabase (backend), RevenueCat (billing), Google Play Services (IAP)
  - NOT shared with advertising networks or data brokers

### Data Retention
- [ ] Remove data on uninstall? **Yes** (AsyncStorage is cleared)
- [ ] Users can request deletion? **Yes** (via Settings > Delete Account link)

### Encryption in Transit
- [ ] HTTPS/TLS for Supabase and RevenueCat API calls? **Yes** (always)

### User Data Access
- [ ] Can users access/export their data?
  - **Currently**: No direct export feature (can be added later)
  - Link to privacy policy for details

---

## Privacy Policy

- [ ] Create and host privacy policy (see PRIVACY_POLICY_TEMPLATE.md)
- [ ] Privacy policy URL in app.json: `https://yoursite.com/privacy`
  - Add to Settings > Privacy Policy link
- [ ] URL must be **publicly accessible** and **explain**:
  - What data is collected
  - How it's used (coaching, retention, billing)
  - User rights (deletion, access)
  - Third-party services (Supabase, RevenueCat)

---

## Target Audience

**Path:** App details > Target audience

- [ ] E-rating / PEGI / etc.
  - **Recommended**: 12+ (contains minimal text, no violence)
- [ ] Target age: **13+** (COPPA compliance — no targeting under 13)

---

## App Access (Billing)

**Path:** App details > App access

- [ ] Does your app contain ads? **No**
- [ ] Does your app use In-App Purchase? **Yes**
  - Product: "PocketCoach Pro" subscription (monthly + yearly)
  - Managed by: RevenueCat (linked to Google Play console)
- [ ] Does your app integrate third-party services?
  - **Yes**: Supabase (backend), RevenueCat (billing)
  - Disclose in Settings > Manage Subscription / Contact Support links

---

## Subscription Policy

**Path:** App details > Subscription product (set up in Monetization)

### Create "PocketCoach Pro" subscription in Play Console:

**Product Settings:**
- [ ] Product ID: `pocket_coach_pro_monthly` and `pocket_coach_pro_annual`
- [ ] Pricing: (set your own, e.g., $9.99/month, $79.99/year)
- [ ] Billing cycle: 1 month / 1 year (separate products)
- [ ] Free trial: **Optional** (e.g., 7 days for testing, remove before launch)

**Subscription Terms:**
- [ ] Billing period: 1 month / 1 year
- [ ] Auto-renewal: Yes (users can disable in Google Play > Manage subscriptions)
- [ ] Allow free trial: Yes/No (your choice)
- [ ] Promotional offers: (optional) Configure if offering first-month discount

**Description for users in Google Play:**
```
✨ Unlock Premium Coaching

• Access all AI coaches (Focus, Productivity, Mindset, Habit, etc.)
• Unlimited action cards per day
• Weekly planning features
• Priority support
• Cancel anytime via Google Play settings

Subscription auto-renews monthly/yearly unless canceled 24 hours before renewal.
```

---

## App Content Rating

**Path:** App details > App rating > Re-answer or view existing rating

- [ ] Received rating from Google?
  - If not, questionnaire automatically assigned one
- [ ] Expected rating: **PEGI 3 / E / 4+** (no violence, no adult content)

---

## Required Links in App

**Add to Settings screen:**
- [ ] **Privacy Policy** → https://yoursite.com/privacy
- [ ] **Terms of Service** → https://yoursite.com/terms (optional, but recommended)
- [ ] **Contact Support** → https://yoursite.com/support or support@email.com
- [ ] **Manage Subscription** → Links to Google Play subscription settings
- [ ] **Delete Account** → Secure form to request data deletion

---

## Before Submitting to Internal Testing

- [ ] App version code incremented in `eas.json` (auto-increment enabled)
- [ ] App version `1.0.0` set in `app.json`
- [ ] Package name: `com.manoj.pocketcoachos` (matches app.json)
- [ ] Bundle ID (iOS): `com.manoj.pocketcoachos`
- [ ] All required screenshots uploaded (minimum 2, recommended 5+)
- [ ] Privacy policy URL live and valid
- [ ] No hardcoded test API keys or secrets
- [ ] RevenueCat sandbox keys configured for testing
- [ ] Supabase connection working

---

## Closed Testing → Production Promotion

See `RELEASE.md` for step-by-step instructions on:
- Creating release in Internal Testing track
- Promoting to Closed Testing (need 12+ testers for 14+ days)
- Resolving Play Console review issues
- Promoting to Production (general availability)

---

## Play Console Review Common Rejection Reasons

- ❌ **No privacy policy** → Add URL to Settings + Play Console
- ❌ **Vague subscription terms** → Be explicit about auto-renewal, cancellation
- ❌ **Missing contact support link** → Required for user issues
- ❌ **Test credentials visible** → Remove debug screens from production build
- ❌ **Misleading content** → Ensure app behavior matches store listing

---

## Quick Checklist Summary

- [ ] Store listing: Name, description, screenshots, icon
- [ ] Content rating: Filled questionnaire
- [ ] Data safety: Disclosed all data types and retention
- [ ] Privacy policy: URL live in Settings and Play Console
- [ ] Subscription: Product IDs created, pricing set
- [ ] Target audience: Age rating assigned
- [ ] Links: Privacy, Terms, Support, Delete Account in Settings
- [ ] Version: Code and version number incremented
- [ ] Keys: No test/sandbox keys in production build

---

**Next:** Follow [`RELEASE.md`](RELEASE.md) to submit to Internal Testing track.
