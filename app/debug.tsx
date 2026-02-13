import Button from '@/components/Button';
import Card from '@/components/Card';
import Typography from '@/components/Typography';
import { getSession } from '@/lib/auth';
import { getRCInitError, isRCInitialized } from '@/lib/revenuecat';
import Constants from 'expo-constants';
import { Redirect } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SessionState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'active'; userId: string };

type NetworkState = 'checking' | 'online' | 'offline';

async function checkNetwork(): Promise<NetworkState> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

export default function DebugScreen() {
  if (!__DEV__) {
    return <Redirect href="/(drawer)/library" />;
  }

  const [session, setSession] = useState<SessionState>({ status: 'loading' });
  const [network, setNetwork] = useState<NetworkState>('checking');
  const [lastChecked, setLastChecked] = useState<string>('');

  const buildVersion = Constants.expoConfig?.version ?? '—';
  const buildNumber =
    Platform.OS === 'android'
      ? String(Constants.expoConfig?.android?.versionCode ?? '—')
      : String(Constants.expoConfig?.ios?.buildNumber ?? '—');

  const rcInitError = getRCInitError();
  const rcReady = isRCInitialized();

  const sessionLabel = useMemo(() => {
    if (session.status === 'loading') return 'Loading…';
    if (session.status === 'none') return 'No active session';
    return `Active (${session.userId})`;
  }, [session]);

  const refreshStatus = async () => {
    setNetwork('checking');
    const [net, currentSession] = await Promise.all([
      checkNetwork(),
      getSession(),
    ]);
    setNetwork(net);
    setLastChecked(new Date().toISOString());

    if (currentSession?.user?.id) {
      setSession({ status: 'active', userId: currentSession.user.id });
    } else {
      setSession({ status: 'none' });
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Typography variant="h1" style={styles.title}>
          Health Check
        </Typography>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>
            App
          </Typography>
          <View style={styles.row}>
            <Typography variant="caption" style={styles.label}>
              Version
            </Typography>
            <Typography variant="body">{buildVersion}</Typography>
          </View>
          <View style={styles.row}>
            <Typography variant="caption" style={styles.label}>
              Build
            </Typography>
            <Typography variant="body">{buildNumber}</Typography>
          </View>
          <View style={styles.row}>
            <Typography variant="caption" style={styles.label}>
              Platform
            </Typography>
            <Typography variant="body">
              {Platform.OS} {Platform.Version}
            </Typography>
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>
            RevenueCat
          </Typography>
          <View style={styles.row}>
            <Typography variant="caption" style={styles.label}>
              Initialized
            </Typography>
            <Typography variant="body">{rcReady ? 'Yes' : 'No'}</Typography>
          </View>
          <View style={styles.row}>
            <Typography variant="caption" style={styles.label}>
              Init error
            </Typography>
            <Typography variant="body">{rcInitError ?? '—'}</Typography>
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>
            Supabase
          </Typography>
          <View style={styles.row}>
            <Typography variant="caption" style={styles.label}>
              Session
            </Typography>
            <Typography variant="body">{sessionLabel}</Typography>
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.cardTitle}>
            Network
          </Typography>
          <View style={styles.row}>
            <Typography variant="caption" style={styles.label}>
              Status
            </Typography>
            <Typography variant="body">{network}</Typography>
          </View>
          <View style={styles.row}>
            <Typography variant="caption" style={styles.label}>
              Last check
            </Typography>
            <Typography variant="body">{lastChecked || '—'}</Typography>
          </View>
        </Card>

        <Button title="Refresh" onPress={refreshStatus} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  card: {
    gap: 10,
  },
  cardTitle: {
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    color: '#666666',
  },
});
