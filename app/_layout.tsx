import { ensureAuth } from '@/lib/auth';
import { initPurchases } from '@/lib/revenuecat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 1. Ensure authentication is set up first
      await ensureAuth();
      
      // 2. Initialize RevenueCat
      await initPurchases();
      
      // 3. Check onboarding status
      const userContext = await AsyncStorage.getItem('user_context');
      if (userContext) {
        const parsed = JSON.parse(userContext);
        setHasCompletedOnboarding(!!parsed.onboardingCompleted);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (isCheckingAuth) return;

    const inDrawerGroup = segments[0] === '(drawer)';
    
    if (!hasCompletedOnboarding && inDrawerGroup) {
      // User hasn't completed onboarding, redirect to onboarding
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && segments[0] === 'onboarding') {
      // User has completed onboarding but is on onboarding screen, redirect to drawer
      router.replace('/(drawer)/today');
    }
  }, [isCheckingAuth, hasCompletedOnboarding, segments]);

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
