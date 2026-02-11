import Card from '@/components/Card';
import Typography from '@/components/Typography';
import {
    billingWarning,
    collectBuildDiagnostics,
    getBuildMode,
} from '@/lib/build-mode';
import {
    getAndroidKey,
    getCustomerInfo,
    getIosKey,
    getRCInitError,
    isRCInitialized,
} from '@/lib/revenuecat';
import { useProStatus } from '@/state/entitlements';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomerInfo } from 'react-native-purchases';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskKey(key: string | undefined): string {
  if (!key) return '(not set)';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <View
      style={[
        styles.dot,
        { backgroundColor: ok ? '#4CAF50' : '#F44336' },
      ]}
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BillingDebugPanel() {
  const { isPro, isLoading, customerInfo: storeInfo, lastError, refresh } = useProStatus();
  const [freshInfo, setFreshInfo] = useState<CustomerInfo | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const diag = collectBuildDiagnostics();
  const warning = billingWarning();
  const rcInitialized = isRCInitialized();
  const rcError = getRCInitError();

  const fetchFreshInfo = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const info = await getCustomerInfo();
      setFreshInfo(info);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e));
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchFreshInfo();
  }, [fetchFreshInfo]);

  const info = freshInfo ?? storeInfo;
  const activeEntitlements = info
    ? Object.keys(info.entitlements.active)
    : [];
  const allEntitlements = info
    ? Object.keys(info.entitlements.all)
    : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Warning banner */}
        {warning && (
          <View style={styles.banner}>
            <MaterialIcons name="warning" size={20} color="#E65100" />
            <Text style={styles.bannerText}>{warning}</Text>
          </View>
        )}

        {/* ── Build Environment ─────────────────────────────────── */}
        <SectionHeader title="Build Environment" />
        <Card style={styles.card}>
          <Row label="Build Mode" value={diag.buildModeLabel} />
          <Row label="Platform" value={`${diag.platform} ${diag.platformVersion}`} />
          <Row label="App Version" value={diag.appVersion} />
          <Row label="Runtime Version" value={diag.runtimeVersion} />
          <Row label="Bundle ID" value={diag.bundleId} />
          <Row label="Expo SDK" value={diag.expoSdkVersion} />
          <Row label="Hermes" value={diag.isHermes ? 'Yes' : 'No'} />
          <Row label="__DEV__" value={diag.isDev ? 'true' : 'false'} />
        </Card>

        {/* ── RevenueCat Status ──────────────────────────────────── */}
        <SectionHeader title="RevenueCat SDK" />
        <Card style={styles.card}>
          <Row
            label="Initialized"
            value={rcInitialized ? 'Yes' : 'No'}
            icon={<StatusDot ok={rcInitialized} />}
          />
          {rcError && <Row label="Init Error" value={rcError} error />}
          <Row
            label="Android Key"
            value={maskKey(getAndroidKey())}
            icon={<StatusDot ok={!!getAndroidKey()} />}
          />
          <Row
            label="iOS Key"
            value={maskKey(getIosKey())}
            icon={<StatusDot ok={!!getIosKey()} />}
          />
          <Row
            label="Active Platform"
            value={Platform.OS === 'android' ? 'Android' : 'iOS'}
          />
        </Card>

        {/* ── Pro Status ─────────────────────────────────────────── */}
        <SectionHeader title="Pro Status (Zustand Store)" />
        <Card style={styles.card}>
          <Row
            label="isPro"
            value={isPro ? 'true' : 'false'}
            icon={<StatusDot ok={isPro} />}
          />
          <Row label="isLoading" value={isLoading ? 'true' : 'false'} />
          {lastError && <Row label="lastError" value={lastError} error />}
        </Card>

        {/* ── Customer Info ──────────────────────────────────────── */}
        <SectionHeader title="Customer Info (Live)" />
        <Card style={styles.card}>
          {fetching && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>Fetching from RevenueCat…</Text>
            </View>
          )}
          {fetchError && <Row label="Fetch Error" value={fetchError} error />}
          {info && (
            <>
              <Row label="Original App User ID" value={info.originalAppUserId} />
              <Row
                label="Active Entitlements"
                value={activeEntitlements.length > 0
                  ? activeEntitlements.join(', ')
                  : '(none)'}
                icon={<StatusDot ok={activeEntitlements.length > 0} />}
              />
              <Row
                label="All Entitlements"
                value={allEntitlements.length > 0
                  ? allEntitlements.join(', ')
                  : '(none)'}
              />
              <Row
                label="Active Subscriptions"
                value={info.activeSubscriptions.length > 0
                  ? info.activeSubscriptions.join(', ')
                  : '(none)'}
              />
              <Row
                label="First Seen"
                value={info.firstSeen ?? '—'}
              />
              <Row
                label="Request Date"
                value={info.requestDate ?? '—'}
              />
            </>
          )}
          {!info && !fetching && (
            <Text style={styles.emptyText}>
              No customer info available. RevenueCat may not be initialized.
            </Text>
          )}
        </Card>

        {/* ── Actions ────────────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { refresh(); fetchFreshInfo(); }}
          >
            <MaterialIcons name="refresh" size={18} color="#FFF" />
            <Text style={styles.actionBtnText}>Refresh All</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          This panel is only visible in development builds or via long-press on "App Version" in Settings.
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Typography variant="h3" style={styles.sectionTitle}>
      {title}
    </Typography>
  );
}

function Row({
  label,
  value,
  icon,
  error,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  error?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon && <View style={styles.rowIcon}>{icon}</View>}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text
        style={[styles.rowValue, error && { color: '#C62828' }]}
        numberOfLines={2}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 19,
    fontWeight: '500',
  },

  // Sections
  sectionTitle: {
    marginBottom: 10,
    marginTop: 20,
    color: '#555',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    gap: 12,
  },

  // Rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  rowIcon: {
    width: 14,
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  rowValue: {
    fontSize: 13,
    color: '#333',
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 13,
    color: '#888',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#BBB',
    marginTop: 24,
    lineHeight: 16,
  },
});
