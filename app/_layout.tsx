import Typography from '@/components/Typography';
import { ensureAuth } from '@/lib/auth';
import { initPurchases } from '@/lib/revenuecat';
import { startProStatusListener, useProStatus } from '@/state/entitlements';
import { hasCompletedOnboarding } from '@/storage/flags';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import type { Href } from 'expo-router';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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
  const [hasRouted, setHasRouted] = useState(false);
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

    const seg = segments[0] as string | undefined;
    const inDrawerGroup = seg === '(drawer)';
    const onOnboarding = seg === 'onboarding';
    const onPaywall = seg === 'paywall';

    // Never interrupt paywall — it can be pushed from anywhere
    if (onPaywall) {
      setHasRouted(true);
      return;
    }

    if (!onboardingDone) {
      if (!onOnboarding) {
        router.replace('/onboarding');
      }
      setHasRouted(true);
      return;
    }

    if (!inDrawerGroup) {
      router.replace('/(drawer)/library' as Href);
      setHasRouted(true);
      return;
    }

    setHasRouted(true);
  }, [isCheckingAuth, onboardingDone, segments, router]);

  const isBooting = useMemo(() => isCheckingAuth || !hasRouted, [isCheckingAuth, hasRouted]);

  if (isBooting) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#000000" />
        <Typography variant="caption" style={styles.loadingLabel}>
          Loading PocketCoach…
        </Typography>
      </View>
    );
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
        <Stack.Screen
          name="debug"
          options={{
            title: 'Debug',
            headerShown: true,
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  loadingLabel: {
    color: '#666666',
  },
});
