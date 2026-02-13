import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

const DEVICE_ID_KEY = 'device_user_id';
const ANON_DISABLED_KEY = 'flag:anon_disabled';

/**
 * Get or create a device-unique user ID for fallback authentication
 */
async function getOrCreateDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      // Generate a unique device ID using UUID
      deviceId = Crypto.randomUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error with device ID:', error);
    // Fallback to timestamp-based ID
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('Exception getting session:', error);
    return null;
  }
}

/**
 * Ensure user is authenticated. 
 * Returns the user ID (Supabase user ID or device ID as fallback)
 */
export async function ensureAuth(): Promise<string> {
  try {
    // Check if we have an existing session
    const session = await getSession();
    
    if (session?.user) {
      console.log('✅ Existing session found:', session.user.id);
      return session.user.id;
    }

    // Skip anonymous sign-in if we've already detected it is disabled
    const anonDisabled = await AsyncStorage.getItem(ANON_DISABLED_KEY);
    if (anonDisabled === 'true') {
      const deviceId = await getOrCreateDeviceId();
      console.log('📱 Using device ID (anonymous auth disabled):', deviceId);
      return deviceId;
    }

    // Try to sign in anonymously
    console.log('🔐 No session found, attempting anonymous sign-in...');
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      if (error.message.includes('Anonymous sign-ins are disabled')) {
        await AsyncStorage.setItem(ANON_DISABLED_KEY, 'true');
      }
      if (__DEV__) {
        console.log('Anonymous auth failed:', error.message);
      }
      // Fall back to device-unique pseudo user
      const deviceId = await getOrCreateDeviceId();
      console.log('📱 Using device ID as fallback:', deviceId);
      return deviceId;
    }

    if (data.user) {
      console.log('✅ Anonymous sign-in successful:', data.user.id);
      return data.user.id;
    }

    // Last resort: use device ID
    const deviceId = await getOrCreateDeviceId();
    console.log('📱 Using device ID:', deviceId);
    return deviceId;
  } catch (error) {
    console.error('❌ Auth error:', error);
    // Even with errors, return a device ID so app can function
    const deviceId = await getOrCreateDeviceId();
    console.log('📱 Using device ID due to error:', deviceId);
    return deviceId;
  }
}

/**
 * Get current user ID (from session or device)
 */
export async function getUserId(): Promise<string> {
  const session = await getSession();
  if (session?.user) {
    return session.user.id;
  }
  return await getOrCreateDeviceId();
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  } catch (error) {
    console.error('Exception during sign out:', error);
  }
}
