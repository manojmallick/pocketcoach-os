import Button from '@/components/Button';
import Typography from '@/components/Typography';
import { markOnboardingComplete } from '@/storage/flags';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Features shown on the welcome screen ─────────────────────────────────────

const HIGHLIGHTS: { icon: React.ComponentProps<typeof MaterialIcons>['name']; text: string }[] = [
  { icon: 'psychology', text: 'AI-powered coaching tailored to you' },
  { icon: 'menu-book', text: 'Choose from a library of expert coaches' },
  { icon: 'check-circle-outline', text: 'Daily tasks to keep you on track' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();

  const handleContinue = async () => {
    await markOnboardingComplete();
    router.replace('/(drawer)/library');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="rocket-launch" size={48} color="#000" />
          </View>
          <Typography variant="h1" style={styles.title}>
            Welcome to{'\n'}PocketCoach OS
          </Typography>
          <Typography variant="body" style={styles.subtitle}>
            Your personal AI coaching assistant.{'\n'}Let's get started.
          </Typography>
        </View>

        {/* Highlight cards */}
        <View style={styles.highlights}>
          {HIGHLIGHTS.map((h) => (
            <View key={h.text} style={styles.highlightRow}>
              <View style={styles.highlightIcon}>
                <MaterialIcons name={h.icon} size={24} color="#000" />
              </View>
              <Typography variant="body" style={styles.highlightText}>
                {h.text}
              </Typography>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          <Button title="Continue" onPress={handleContinue} />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },

  // Hero
  hero: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 38,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },

  // Highlights
  highlights: {
    gap: 18,
    paddingHorizontal: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    flex: 1,
    color: '#333',
  },

  // Footer
  footer: {
    gap: 12,
  },
});
