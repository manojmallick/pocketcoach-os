import { ensureAuth } from '@/lib/auth';
import { initPurchases } from '@/lib/revenuecat';
import { startProStatusListener, useProStatus } from '@/state/entitlements';
import { hasCompletedOnboarding } from '@/storage/flags';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import type { Href } from 'expo-router';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

export const unstable_settings = {
  initialRouteName: '(drawer)',
};

const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#000000',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    border: '#F5F5F5',
    notification: '#000000',
  },
};

export default function RootLayout() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 1. Ensure authentication is set up first
      await ensureAuth();
      
      // 2. Initialize RevenueCat + start foreground listener + first refresh
      await initPurchases();
      startProStatusListener();
      useProStatus.getState().refresh();
      
      // 3. Check onboarding flag (single source of truth)
      const done = await hasCompletedOnboarding();
      setOnboardingDone(done);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (isCheckingAuth) return;

    const seg = segments[0] as string;
    const inDrawerGroup = seg === '(drawer)';
    const onPaywall = seg === 'paywall';

    // Never interrupt paywall — it can be pushed from anywhere
    if (onPaywall) return;

    if (!onboardingDone && inDrawerGroup) {
      // First launch → show onboarding
      router.replace('/onboarding');
    } else if (onboardingDone && segments[0] === 'onboarding') {
      // Already onboarded but somehow on onboarding screen → library
      router.replace('/(drawer)/library' as Href);
    }
  }, [isCheckingAuth, onboardingDone, segments]);

  if (isCheckingAuth) {
    return null; // Or a loading screen
  }

  return (
    <ThemeProvider value={lightTheme}>
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="paywall" 
          options={{ 
            presentation: 'modal',
            headerShown: false,
          }} 
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
