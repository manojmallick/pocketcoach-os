import Button from '@/components/Button';
import Card from '@/components/Card';
import Chip from '@/components/Chip';
import Typography from '@/components/Typography';
import {
    DELETE_ACCOUNT_URL,
    PRIVACY_POLICY_URL,
    SUPPORT_MAILTO,
    TERMS_URL,
    getManageSubscriptionUrl,
} from '@/constants/urls';
import { getUserId, signOut } from '@/lib/auth';
import { isDevBuild } from '@/lib/build-mode';
import { restorePurchases } from '@/lib/revenuecat';
import { useProStatus } from '@/state/entitlements';
import { clearOnboardingFlag } from '@/storage/flags';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function openUrl(url: string) {
  Linking.openURL(url).catch((err) =>
    Alert.alert('Cannot open link', err.message),
  );
}

/** Derive a human-readable renewal/expiration line from customerInfo. */
function renewalLabel(customerInfo: any, isPro: boolean): string | null {
  if (!isPro || !customerInfo) return null;
  const proEntitlement = customerInfo.entitlements?.active?.pro;
  if (!proEntitlement) return null;

  if (proEntitlement.willRenew) {
    const next = proEntitlement.expirationDate;
    if (next) {
      const d = new Date(next);
      return `Renews ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return 'Auto-renewing';
  }

  // Not renewing — show expiration
  const exp = proEntitlement.expirationDate;
  if (exp) {
    const d = new Date(exp);
    return `Expires ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  return 'Lifetime access';
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsRow = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  action: () => void;
  /** Optional right-hand text instead of the default arrow. */
  detail?: string;
  /** Show in destructive red style. */
  destructive?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const {
    isPro: pro,
    isLoading: loading,
    customerInfo,
    refresh: refreshEntitlements,
  } = useProStatus();
  const [restoring, setRestoring] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const versionPressCount = useRef(0);
  const versionPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const renewal = renewalLabel(customerInfo, pro);

  useEffect(() => {
    loadAuthStatus();
    loadDemoMode();
    refreshEntitlements();
  }, []);

  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadAuthStatus = async () => {
    const id = await getUserId();
    setUserId(id);
  };

  const loadDemoMode = async () => {
    try {
      const value = await AsyncStorage.getItem('demo_mode');
      if (value !== null) setDemoMode(value === 'true');
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
          : 'Demo mode disabled.',
      );
    } catch (error) {
      console.error('Error toggling demo mode:', error);
      Alert.alert('Error', 'Failed to update demo mode');
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    await clearOnboardingFlag();
    router.replace('/onboarding');
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      const { customerInfo: info, error } = await restorePurchases();

      if (error) {
        Alert.alert('Restore Failed', error.message);
        setRestoring(false);
        return;
      }
      if (info) {
        await refreshEntitlements();
        const hasPro = info.entitlements.active['pro'] !== undefined;
        Alert.alert(
          hasPro ? 'Restored!' : 'No Purchases Found',
          hasPro
            ? 'Your Pro subscription has been restored.'
            : 'No previous purchases to restore.',
        );
      }
      setRestoring(false);
    } catch (err) {
      console.error('Restore error:', err);
      Alert.alert('Error', 'Failed to restore purchases');
      setRestoring(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will open a page where you can request account and data deletion. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => openUrl(DELETE_ACCOUNT_URL),
        },
      ],
    );
  };

  const handleVersionPress = () => {
    if (isDevBuild()) {
      router.push('/(drawer)/billing-debug' as any);
      return;
    }
    versionPressCount.current += 1;
    if (versionPressTimer.current) clearTimeout(versionPressTimer.current);
    versionPressTimer.current = setTimeout(() => {
      versionPressCount.current = 0;
    }, 2000);
    if (versionPressCount.current >= 7) {
      versionPressCount.current = 0;
      router.push('/(drawer)/billing-debug' as any);
    }
  };

  // ── Section data ──────────────────────────────────────────────────────────

  const subscriptionSection: SettingsRow[] = [
    ...(!pro
      ? [
          {
            icon: 'star' as const,
            label: 'Upgrade to Pro',
            action: () => router.push('/paywall'),
          },
        ]
      : []),
    {
      icon: 'refresh',
      label: restoring ? 'Restoring…' : 'Restore Purchases',
      action: handleRestore,
    },
    ...(pro
      ? [
          {
            icon: 'credit-card' as const,
            label: 'Manage Subscription',
            action: () => openUrl(getManageSubscriptionUrl()),
          },
        ]
      : []),
  ];

  const supportSection: SettingsRow[] = [
    {
      icon: 'mail-outline',
      label: 'Contact Support',
      action: () => openUrl(SUPPORT_MAILTO),
    },
    {
      icon: 'shield',
      label: 'Privacy Policy',
      action: () => openUrl(PRIVACY_POLICY_URL),
    },
    {
      icon: 'description',
      label: 'Terms of Service',
      action: () => openUrl(TERMS_URL),
    },
  ];

  const accountSection: SettingsRow[] = [
    {
      icon: 'delete-outline',
      label: 'Delete Account & Data',
      action: handleDeleteAccount,
      destructive: true,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Pro Status Card ──────────────────────────────────── */}
        <Card style={styles.proCard}>
          <View style={styles.proHeader}>
            <View style={styles.proTitleRow}>
              <MaterialIcons
                name={pro ? 'verified' : 'lock-outline'}
                size={22}
                color={pro ? '#4CAF50' : '#999'}
              />
              <Typography variant="h3" style={styles.proTitle}>
                Pro Status
              </Typography>
            </View>
            <Chip
              label={pro ? 'Active' : 'Free'}
              variant={pro ? 'success' : 'default'}
            />
          </View>

          <Typography variant="body" style={styles.proDesc}>
            {pro
              ? 'You have access to all premium coaches and features.'
              : 'Upgrade to unlock every coach, unlimited chats, and more.'}
          </Typography>

          {renewal && (
            <View style={styles.renewalRow}>
              <MaterialIcons name="event" size={16} color="#666" />
              <Typography variant="caption" style={styles.renewalText}>
                {renewal}
              </Typography>
            </View>
          )}

          <View style={styles.proActions}>
            <Button
              title={loading ? 'Refreshing…' : 'Refresh Status'}
              onPress={() => refreshEntitlements()}
              variant="secondary"
              disabled={loading}
              style={styles.actionBtn}
            />
          </View>
        </Card>

        {/* ── Subscription section ─────────────────────────────── */}
        <SettingsSection title="Subscription" rows={subscriptionSection} />

        {/* ── Demo Mode Card ───────────────────────────────────── */}
        <Card style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <View>
              <Typography variant="h3">Demo Mode</Typography>
              <Typography variant="caption" style={styles.demoDesc}>
                Use fallback responses if network fails
              </Typography>
            </View>
            <TouchableOpacity
              style={[styles.toggle, demoMode && styles.toggleActive]}
              onPress={toggleDemoMode}
            >
              <View
                style={[
                  styles.toggleThumb,
                  demoMode && styles.toggleThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* ── Support & Legal section ──────────────────────────── */}
        <SettingsSection title="Support & Legal" rows={supportSection} />

        {/* ── Account section ──────────────────────────────────── */}
        <SettingsSection title="Account" rows={accountSection} />

        {/* ── Auth info (dev-useful) ───────────────────────────── */}
        {userId ? (
          <View style={styles.authBox}>
            <Typography variant="caption" style={styles.authLabel}>
              User ID
            </Typography>
            <Typography variant="caption" style={styles.authValue}>
              {userId.substring(0, 12)}…
            </Typography>
          </View>
        ) : null}

        {/* ── Log Out ──────────────────────────────────────────── */}
        <View style={styles.logoutSection}>
          <Button title="Log Out" onPress={handleLogout} variant="secondary" />
        </View>

        {/* ── Version (tap to open billing debug) ──────────────── */}
        <Typography
          variant="caption"
          style={styles.version}
          onPress={handleVersionPress}
        >
          PocketCoach OS v{appVersion} • {Platform.OS === 'android' ? 'Android' : 'iOS'}
        </Typography>
      </ScrollView>
    </View>
  );
}

// ─── Reusable section renderer ────────────────────────────────────────────────

function SettingsSection({
  title,
  rows,
}: {
  title: string;
  rows: SettingsRow[];
}) {
  return (
    <View style={styles.section}>
      <Typography variant="h3" style={styles.sectionTitle}>
        {title}
      </Typography>
      <Card>
        {rows.map((row, idx) => (
          <TouchableOpacity
            key={row.label}
            style={[
              styles.row,
              idx < rows.length - 1 && styles.rowBorder,
            ]}
            onPress={row.action}
            activeOpacity={0.6}
          >
            <View style={styles.rowLeft}>
              <MaterialIcons
                name={row.icon}
                size={20}
                color={row.destructive ? '#D32F2F' : '#333'}
              />
              <Typography
                variant="body"
                style={[
                  styles.rowLabel,
                  row.destructive && styles.rowLabelDestructive,
                ]}
              >
                {row.label}
              </Typography>
            </View>
            {row.detail ? (
              <Typography variant="caption" style={styles.rowDetail}>
                {row.detail}
              </Typography>
            ) : (
              <MaterialIcons name="chevron-right" size={20} color="#CCC" />
            )}
          </TouchableOpacity>
        ))}
      </Card>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { paddingHorizontal: 24, paddingBottom: 48 },

  // Pro card
  proCard: { marginBottom: 24 },
  proHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  proTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  proTitle: { marginBottom: 0 },
  proDesc: { color: '#666', marginBottom: 12, lineHeight: 20 },
  renewalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  renewalText: { color: '#555' },
  proActions: { gap: 10 },
  actionBtn: { marginBottom: 0 },

  // Demo card
  demoCard: { marginBottom: 24 },
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoDesc: { color: '#666', marginTop: 4 },

  // Sections
  section: { marginBottom: 28 },
  sectionTitle: { marginBottom: 10, color: '#666' },

  // Rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F3F3' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { color: '#222' },
  rowLabelDestructive: { color: '#D32F2F' },
  rowDetail: { color: '#999' },

  // Auth
  authBox: {
    backgroundColor: '#F9F9F9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authLabel: { color: '#666' },
  authValue: { color: '#000', fontFamily: 'monospace' },

  // Misc
  logoutSection: { marginTop: 8 },
  version: { textAlign: 'center', marginTop: 28, color: '#BBB' },

  // Toggle
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#E5E5E5',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: '#4CAF50' },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
});
