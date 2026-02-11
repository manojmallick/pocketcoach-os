# PocketCoach OS - Setup Documentation

## 🚀 What Was Implemented

### 1. Dependencies Installed
```bash
npm install @supabase/supabase-js react-native-purchases zustand @react-native-async-storage/async-storage
```

**Already included:**
- expo-router (navigation)
- react-native-gesture-handler
- react-native-reanimated
- react-native-safe-area-context

### 2. File Structure Created

```
app/
├── _layout.tsx                 # Root layout with auth + route guard
├── onboarding.tsx             # Single welcome screen
├── paywall.tsx                # Pro upgrade modal with diagnostics
└── (drawer)/
    ├── _layout.tsx            # Drawer sidebar navigator
    ├── index.tsx              # Redirect → library
    ├── library.tsx            # Coach cards library
    ├── chat.tsx               # AI coach chat
    ├── today.tsx              # Action-card checklist
    ├── settings.tsx           # Settings, billing, legal
    └── billing-debug.tsx      # Hidden billing diagnostics

components/
├── Button.tsx                 # Primary & secondary button
├── Card.tsx                   # Card container component
├── Chip.tsx                   # Label/tag chip component
├── Breadcrumb.tsx             # Header breadcrumb
├── Header.tsx                 # App header bar
└── Typography.tsx             # Text component with variants

lib/
├── supabase.ts               # Supabase client configuration
├── db.ts                     # Database queries
├── revenuecat.ts             # RevenueCat wrappers (never throw)
├── auth.ts                   # Anonymous auth bootstrap
└── build-mode.ts             # Dev / Expo Go / store detection

state/
└── entitlements.ts           # useProStatus zustand store

storage/
└── flags.ts                  # Onboarding AsyncStorage flag
```

## 🎨 Design System

### Typography Variants
- **h1**: 32px, bold - Page titles
- **h2**: 24px, semi-bold - Section headers
- **h3**: 18px, semi-bold - Card titles
- **body**: 16px - Regular text
- **caption**: 14px - Small text, labels

### Color Palette
- **Primary**: `#000000` (Black)
- **Background**: `#FFFFFF` (White)
- **Surface**: `#F5F5F5` (Light gray)
- **Text Secondary**: `#666666`
- **Text Tertiary**: `#999999`
- **Border**: `#E5E5E5`

### Spacing
- **High spacing**: 24px padding on main containers
- **Card margins**: 16px between cards
- **Component gaps**: 12px between related items

## 📱 Navigation Flow

### Initial Load
1. App bootstraps anonymous auth via `ensureAuth()`
2. Initializes RevenueCat + starts entitlement listener
3. Checks `onboarding_done` flag in AsyncStorage
4. If **not found** → Navigate to `/onboarding`
5. If **found** → Navigate to `/(drawer)/library`

### Onboarding Flow
1. **Single welcome screen** with feature highlights
2. Tap "Get Started" → marks flag + navigates to Library

### Drawer Structure
- **Library**: Browse AI coach cards (fallback data if offline)
- **Chat**: AI coaching conversation (with demo mode)
- **Today**: Action-card checklist with toggle completion
- **Settings**: Pro status, billing, legal, account

## 🔧 Configuration Needed

### 1. Supabase Setup
Create a `.env.local` file (use `.env.example` as template):
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. RevenueCat Setup
Add to `.env.local`:
```env
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your_android_key
EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_ios_key
```

RevenueCat is initialized automatically in the root layout via `initPurchases()`.
All SDK calls are wrapped in `lib/revenuecat.ts` and **never throw**.

## 📦 State Management

### Zustand Stores

State is managed with Zustand in focused, domain-specific stores:

#### Pro Status (entitlements)
```typescript
import { useProStatus } from '@/state/entitlements';

const { isPro, refresh } = useProStatus();
```

#### Onboarding Flag
```typescript
import { hasCompletedOnboarding, markOnboardingComplete } from '@/storage/flags';
```

Legacy template stores (`useUserStore`, `useActionCardsStore`, `useTodayStore`)
have been removed — all data now lives in Supabase.

## 🎯 Remaining Work

### 1. Production AI Backend
- Wire Supabase Edge Function (`supabase/functions/chat`) to a real LLM
- Finish action-card extraction from AI responses

### 2. Deep Linking & Notifications
- Push notification setup
- Deep links to specific coaches

### 3. Analytics & Crash Reporting
- Sentry or similar crash tracking
- Event analytics for onboarding / paywall funnel

## 🚦 Running the App

```bash
# Start development server
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📝 Key Features Implemented

✅ Clean, minimal UI with white background and high spacing  
✅ Drawer sidebar navigation (Library, Chat, Today, Settings)  
✅ Single-screen onboarding with AsyncStorage persistence  
✅ Paywall modal with skeleton loading + diagnostics panel  
✅ RevenueCat integration with graceful degradation  
✅ Pro gating on coach cards with PRO pill  
✅ Pull-to-refresh on action card list  
✅ Shared UI components (Button, Card, Chip, Typography)  
✅ TypeScript strict mode throughout  
✅ Zustand store for entitlement state  
✅ Supabase auth + database integration  
✅ EAS build profiles (dev / preview / production)  

## 🎨 Component Examples

### Button
```tsx
<Button title="Continue" onPress={handlePress} />
<Button title="Cancel" onPress={handlePress} variant="secondary" />
<Button title="Disabled" onPress={handlePress} disabled />
```

### Card
```tsx
<Card>
  <Typography variant="h3">Card Title</Typography>
  <Typography variant="body">Card content</Typography>
</Card>
```

### Chip
```tsx
<Chip label="Done" variant="success" />
<Chip label="Pending" variant="warning" />
<Chip label="Error" variant="error" />
```

### Typography
```tsx
<Typography variant="h1">Page Title</Typography>
<Typography variant="body">Regular text</Typography>
<Typography variant="caption" style={{ color: '#999' }}>Small text</Typography>
```

---

**Built with Expo SDK 54, TypeScript, and modern React Native best practices.**
