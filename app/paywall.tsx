import Button from '@/components/Button';
import Card from '@/components/Card';
import Typography from '@/components/Typography';
import { billingWarning, getBuildModeLabel } from '@/lib/build-mode';
import { getOfferings, purchase, restorePurchases } from '@/lib/revenuecat';
import { useProStatus } from '@/state/entitlements';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaywallState =
  | { kind: 'loading' }
  | { kind: 'ready'; packages: PurchasesPackage[] }
  | { kind: 'error'; message: string; raw?: string };

type PurchaseState =
  | { kind: 'idle' }
  | { kind: 'purchasing'; packageId: string }
  | { kind: 'restoring' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function billingLabel(pkg: PurchasesPackage): { title: string; period: string; badge?: string } {
  const price = pkg.product.priceString;
  switch (pkg.packageType) {
    case 'ANNUAL':
      return { title: 'Annual', period: `${price} / year`, badge: 'Best value' };
    case 'MONTHLY':
      return { title: 'Monthly', period: `${price} / month` };
    case 'WEEKLY':
      return { title: 'Weekly', period: `${price} / week` };
    case 'LIFETIME':
      return { title: 'Lifetime', period: `${price} one-time` };
    default:
      return { title: pkg.identifier, period: price };
  }
}

function diagInfo(): { label: string; value: string }[] {
  const isExpoGo = Constants.appOwnership === 'expo';
  const androidKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
    || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  const iosKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    || process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  const hasKey = Platform.OS === 'android' ? !!androidKey : !!iosKey;

  return [
    { label: 'Build Mode', value: getBuildModeLabel() },
    { label: 'Platform', value: `${Platform.OS} ${Platform.Version}` },
    { label: 'Bundle', value: Constants.expoConfig?.android?.package ?? Constants.expoConfig?.ios?.bundleIdentifier ?? '—' },
    { label: 'Expo Go', value: isExpoGo ? 'Yes (native IAP unavailable)' : 'No (dev build)' },
    { label: 'RC key set', value: hasKey ? 'Yes' : 'No — add to .env' },
    { label: 'Environment', value: __DEV__ ? 'Development' : 'Production' },
  ];
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────

function Shimmer({ width, height = 16 }: { width: number | string; height?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{
        width: width as any,
        height,
        borderRadius: height / 2,
        backgroundColor: '#E5E5E5',
        opacity,
      }}
    />
  );
}

// ─── Feature list ──────────────────────────────────────────────────────────────

const FEATURES = [
  'Access to all AI coaches',
  'Unlimited action cards',
  'Weekly planning features',
  'Priority support',
  'Cancel anytime',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const router = useRouter();
  const refresh = useProStatus((s) => s.refresh);

  const [state, setState] = useState<PaywallState>({ kind: 'loading' });
  const [purchaseState, setPurchaseState] = useState<PurchaseState>({ kind: 'idle' });
  const [showDiag, setShowDiag] = useState(false);

  // ── Load offerings ──────────────────────────────────────────────────────────

  const loadOfferings = async () => {
    setState({ kind: 'loading' });
    try {
      const offerings = await getOfferings();

      if (!offerings?.current || offerings.current.availablePackages.length === 0) {
        setState({
          kind: 'error',
          message: 'No subscription plans are available right now.',
          raw: offerings
            ? `Offerings fetched but current is ${offerings.current ? 'empty' : 'null'}`
            : 'getOfferings() returned null',
        });
        return;
      }

      // Sort: annual first, then monthly, then others
      const sorted = [...offerings.current.availablePackages].sort((a, b) => {
        const order: Record<string, number> = { ANNUAL: 0, MONTHLY: 1, WEEKLY: 2 };
        return (order[a.packageType] ?? 3) - (order[b.packageType] ?? 3);
      });

      setState({ kind: 'ready', packages: sorted });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState({ kind: 'error', message: 'Failed to load plans.', raw: msg });
    }
  };

  useEffect(() => {
    loadOfferings();
  }, []);

  // ── Purchase ────────────────────────────────────────────────────────────────

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchaseState({ kind: 'purchasing', packageId: pkg.identifier });
    try {
      const { customerInfo, error } = await purchase(pkg);
      if (error) {
        Alert.alert('Purchase failed', error.message);
        setPurchaseState({ kind: 'idle' });
        return;
      }
      if (customerInfo) {
        await refresh();
        Alert.alert('Welcome to Pro!', 'You now have full access to every coach.', [
          { text: 'Let's go', onPress: () => router.back() },
        ]);
      }
      setPurchaseState({ kind: 'idle' });
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setPurchaseState({ kind: 'idle' });
    }
  };

  // ── Restore ─────────────────────────────────────────────────────────────────

  const handleRestore = async () => {
    setPurchaseState({ kind: 'restoring' });
    try {
      const { customerInfo, error } = await restorePurchases();
      if (error) {
        Alert.alert('Restore failed', error.message);
        setPurchaseState({ kind: 'idle' });
        return;
      }
      if (customerInfo) {
        await refresh();
        const hasPro = customerInfo.entitlements.active['pro'] !== undefined;
        if (hasPro) {
          Alert.alert('Restored!', 'Your Pro subscription is active again.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        } else {
          Alert.alert('Nothing found', 'We couldn't find a previous Pro purchase on this account.');
        }
      }
      setPurchaseState({ kind: 'idle' });
    } catch {
      Alert.alert('Error', 'Failed to restore purchases.');
      setPurchaseState({ kind: 'idle' });
    }
  };

  const busy = purchaseState.kind !== 'idle';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
        <MaterialIcons name="close" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Typography variant="h1" style={styles.heroTitle}>
            Upgrade to Pro
          </Typography>
          <Typography variant="body" style={styles.heroSub}>
            Unlock every coach, unlimited cards, and weekly plans.
          </Typography>
        </View>

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {state.kind === 'loading' && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#000" />
            <Typography variant="caption" style={styles.loadingLabel}>
              Fetching plans…
            </Typography>
            {/* skeleton cards */}
            <View style={styles.skeletonWrap}>
              {[1, 2].map((i) => (
                <Card key={i} style={styles.skeletonCard}>
                  <Shimmer width="50%" height={18} />
                  <View style={{ height: 10 }} />
                  <Shimmer width="35%" height={14} />
                  <View style={{ height: 16 }} />
                  <Shimmer width="100%" height={48} />
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* ── Error + diagnostics ──────────────────────────────────────────── */}
        {state.kind === 'error' && (
          <View style={styles.errorWrap}>
            <View style={styles.errorIconCircle}>
              <MaterialIcons name="warning-amber" size={32} color="#E88A1A" />
            </View>

            <Typography variant="h3" style={styles.errorTitle}>
              {state.message}
            </Typography>

            <Typography variant="caption" style={styles.errorHint}>
              This usually means RevenueCat isn't configured yet, you're in Expo Go,
              or the offering hasn't been created in the RevenueCat dashboard.
            </Typography>

            <Button title="Retry" onPress={loadOfferings} style={styles.retryBtn} />

            {/* Diagnostics toggle */}
            <TouchableOpacity
              style={styles.diagToggle}
              onPress={() => setShowDiag((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.diagToggleText}>
                {showDiag ? 'Hide diagnostics' : 'Show diagnostics'}
              </Text>
              <MaterialIcons
                name={showDiag ? 'expand-less' : 'expand-more'}
                size={18}
                color="#888"
              />
            </TouchableOpacity>

            {showDiag && (
              <Card style={styles.diagCard}>
                {billingWarning() && (
                  <View style={styles.diagBanner}>
                    <MaterialIcons name="warning" size={16} color="#E65100" />
                    <Text style={styles.diagBannerText}>{billingWarning()}</Text>
                  </View>
                )}
                {state.raw && (
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Error</Text>
                    <Text style={[styles.diagValue, { color: '#C62828' }]}>{state.raw}</Text>
                  </View>
                )}
                {diagInfo().map((d) => (
                  <View key={d.label} style={styles.diagRow}>
                    <Text style={styles.diagLabel}>{d.label}</Text>
                    <Text style={styles.diagValue}>{d.value}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Restore still available on error screen */}
            <Button
              title={purchaseState.kind === 'restoring' ? 'Restoring…' : 'Restore purchases'}
              onPress={handleRestore}
              variant="secondary"
              disabled={busy}
              style={styles.restoreBtnError}
            />
          </View>
        )}

        {/* ── Ready — packages available ───────────────────────────────────── */}
        {state.kind === 'ready' && (
          <>
            {/* Features */}
            <View style={styles.features}>
              {FEATURES.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <MaterialIcons name="check-circle" size={20} color="#2AAF74" />
                  <Typography variant="body" style={styles.featureText}>
                    {f}
                  </Typography>
                </View>
              ))}
            </View>

            {/* Package cards */}
            <View style={styles.packagesWrap}>
              {state.packages.map((pkg) => {
                const { title, period, badge } = billingLabel(pkg);
                const isPurchasing =
                  purchaseState.kind === 'purchasing' &&
                  purchaseState.packageId === pkg.identifier;

                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    activeOpacity={0.8}
                    onPress={() => handlePurchase(pkg)}
                    disabled={busy}
                    style={[
                      styles.pkgCard,
                      badge ? styles.pkgCardHighlight : undefined,
                    ]}
                  >
                    {badge && (
                      <View style={styles.pkgBadge}>
                        <Text style={styles.pkgBadgeText}>{badge}</Text>
                      </View>
                    )}

                    <View style={styles.pkgInfo}>
                      <Typography variant="h3">{title}</Typography>
                      <Typography variant="caption" style={styles.pkgPeriod}>
                        {period}
                      </Typography>
                    </View>

                    <View style={[styles.pkgBtn, busy && styles.pkgBtnDisabled]}>
                      {isPurchasing ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.pkgBtnText}>Subscribe</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Restore */}
            <TouchableOpacity
              onPress={handleRestore}
              disabled={busy}
              style={styles.restoreLink}
              activeOpacity={0.6}
            >
              {purchaseState.kind === 'restoring' ? (
                <ActivityIndicator size="small" color="#888" />
              ) : (
                <Text style={styles.restoreLinkText}>Restore purchases</Text>
              )}
            </TouchableOpacity>

            {/* Legal */}
            <Typography variant="caption" style={styles.legal}>
              Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.
              Subscriptions auto-renew unless canceled at least 24 hours before the end of the
              current period. Manage subscriptions in your device settings.
            </Typography>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  /* Hero */
  hero: { alignItems: 'center', marginBottom: 28 },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: { textAlign: 'center' },
  heroSub: { textAlign: 'center', color: '#666', marginTop: 8, maxWidth: 280 },

  /* Loading */
  loadingWrap: { alignItems: 'center', gap: 12, paddingTop: 8 },
  loadingLabel: { color: '#888' },
  skeletonWrap: { width: '100%', gap: 14, marginTop: 16 },
  skeletonCard: { padding: 20 },

  /* Error */
  errorWrap: { alignItems: 'center', paddingTop: 8, gap: 12 },
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  errorTitle: { textAlign: 'center' },
  errorHint: { textAlign: 'center', color: '#888', lineHeight: 20, maxWidth: 300 },
  retryBtn: { width: '100%', marginTop: 4 },
  diagToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  diagToggleText: { fontSize: 13, color: '#888' },
  diagCard: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    padding: 16,
    gap: 10,
  },
  diagRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  diagLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  diagValue: { fontSize: 13, color: '#333', flexShrink: 1, textAlign: 'right' },
  diagBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  diagBannerText: { fontSize: 12, color: '#E65100', flex: 1, lineHeight: 18 },
  restoreBtnError: { width: '100%', marginTop: 8 },

  /* Features */
  features: { marginBottom: 24, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { flex: 1, color: '#333' },

  /* Packages */
  packagesWrap: { gap: 14, marginBottom: 20 },
  pkgCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  pkgCardHighlight: {
    borderColor: '#000',
    backgroundColor: '#FAFAFA',
  },
  pkgBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 10,
  },
  pkgBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  pkgInfo: { flex: 1 },
  pkgPeriod: { color: '#666', marginTop: 2 },
  pkgBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 100,
    alignItems: 'center',
  },
  pkgBtnDisabled: { opacity: 0.5 },
  pkgBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  /* Restore */
  restoreLink: { alignSelf: 'center', paddingVertical: 12 },
  restoreLinkText: { fontSize: 14, color: '#888', textDecorationLine: 'underline' },

  /* Legal */
  legal: { textAlign: 'center', color: '#AAA', lineHeight: 18, marginTop: 8 },
});
