import Button from '@/components/Button';
import Card from '@/components/Card';
import Chip from '@/components/Chip';
import Typography from '@/components/Typography';
import { getUserId, signOut } from '@/lib/auth';
import { restorePurchases } from '@/lib/revenuecat';
import { useProStatus } from '@/state/entitlements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const { isPro: pro, isLoading: loading, refresh: refreshEntitlements } = useProStatus();
  const [restoring, setRestoring] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    loadAuthStatus();
    loadDemoMode();
    refreshEntitlements();
  }, []);

  const loadAuthStatus = async () => {
    const id = await getUserId();
    setUserId(id);
  };

  const loadDemoMode = async () => {
    try {
      const value = await AsyncStorage.getItem('demo_mode');
      if (value !== null) {
        setDemoMode(value === 'true');
      }
    } catch (error) {
      console.error('Error loading demo mode:', error);
    }
  };

  const toggleDemoMode = async () => {
    try {
      const newValue = !demoMode;
      await AsyncStorage.setItem('demo_mode', String(newValue));
      setDemoMode(newValue);
      Alert.alert(
        'Demo Mode',
        newValue 
          ? 'Demo mode enabled. Chat will use fallback responses if network fails.'
          : 'Demo mode disabled.'
      );
    } catch (error) {
      console.error('Error toggling demo mode:', error);
      Alert.alert('Error', 'Failed to update demo mode');
    }
  };

  const handleLogout = async () => {
    // Sign out from Supabase
    await signOut();
    // Clear user context and navigate to onboarding
    await AsyncStorage.removeItem('user_context');
    router.replace('/onboarding');
  };

  const handleRefreshEntitlements = async () => {
    await refreshEntitlements();
    Alert.alert('Refreshed', `Pro Status: ${pro ? 'Active' : 'Inactive'}`);
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      const { customerInfo, error } = await restorePurchases();
      
      if (error) {
        Alert.alert('Restore Failed', error.message);
        setRestoring(false);
        return;
      }

      if (customerInfo) {
        await refreshEntitlements();
        const hasPro = customerInfo.entitlements.active['pro'] !== undefined;
        
        if (hasPro) {
          Alert.alert('Restored!', 'Your Pro subscription has been restored');
        } else {
          Alert.alert('No Purchases Found', 'No previous purchases to restore');
        }
      }
      
      setRestoring(false);
    } catch (err) {
      console.error('Restore error:', err);
      Alert.alert('Error', 'Failed to restore purchases');
      setRestoring(false);
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { label: 'Profile', action: () => {} },
        { label: 'Subscription', action: () => router.push('/paywall') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Notifications', action: () => {} },
        { label: 'Language', action: () => {} },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center', action: () => {} },
        { label: 'Privacy Policy', action: () => {} },
        { label: 'Terms of Service', action: () => {} },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Pro Status Card */}
        <Card style={styles.proStatusCard}>
          <View style={styles.proStatusHeader}>
            <Typography variant="h3">Pro Status</Typography>
            <Chip 
              label={pro ? 'Active' : 'Free'} 
              variant={pro ? 'success' : 'default'}
            />
          </View>
          <Typography variant="caption" style={styles.proStatusDescription}>
            {pro 
              ? 'You have access to all premium features' 
              : 'Upgrade to unlock all coaches and features'}
          </Typography>
          
          <View style={styles.proActions}>
            <Button
              title={loading ? 'Refreshing...' : 'Refresh Status'}
              onPress={handleRefreshEntitlements}
              variant="secondary"
              disabled={loading}
              style={styles.actionButton}
            />
            <Button
              title={restoring ? 'Restoring...' : 'Restore Purchases'}
              onPress={handleRestore}
              variant="secondary"
              disabled={restoring || loading}
              style={styles.actionButton}
            />
          </View>
        </Card>

        {/* Demo Mode Card */}
        <Card style={styles.demoModeCard}>
          <View style={styles.demoModeHeader}>
            <View>
              <Typography variant="h3">Demo Mode</Typography>
              <Typography variant="caption" style={styles.demoModeDescription}>
                Use fallback responses if network fails
              </Typography>
            </View>
            <TouchableOpacity
              style={[styles.toggle, demoMode && styles.toggleActive]}
              onPress={toggleDemoMode}
            >
              <View style={[styles.toggleThumb, demoMode && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Auth Status */}
        {userId && (
          <View style={styles.authStatus}>
            <Typography variant="caption" style={styles.authLabel}>
              Auth Status
            </Typography>
            <Typography variant="caption" style={styles.authUserId}>
              User ID: {userId.substring(0, 8)}...
            </Typography>
          </View>
        )}

        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              {section.title}
            </Typography>
            <Card>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < section.items.length - 1 && styles.settingItemBorder,
                  ]}
                  onPress={item.action}
                >
                  <Typography variant="body">{item.label}</Typography>
                  <Typography variant="body" style={styles.arrow}>›</Typography>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}
        
        <View style={styles.logoutSection}>
          <Button title="Log Out" onPress={handleLogout} variant="secondary" />
        </View>
        
        <Typography variant="caption" style={styles.version}>
          Version 1.0.0
        </Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#666666',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  arrow: {
    fontSize: 24,
    color: '#CCCCCC',
  },
  logoutSection: {
    marginTop: 16,
  },
  version: {
    textAlign: 'center',
    marginTop: 32,
    color: '#999999',
  },
  authStatus: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  authLabel: {
    color: '#666666',
    marginBottom: 4,
  },
  authUserId: {
    color: '#000000',
    fontFamily: 'monospace',
  },
  proStatusCard: {
    marginBottom: 24,
  },
  proStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  proStatusDescription: {
    color: '#666666',
    marginBottom: 16,
  },
  proActions: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 0,
  },
  demoModeCard: {
    marginBottom: 24,
  },
  demoModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoModeDescription: {
    color: '#666666',
    marginTop: 4,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#E5E5E5',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});
