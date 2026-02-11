import Card from '@/components/Card';
import Chip from '@/components/Chip';
import Typography from '@/components/Typography';
import { getCoachTemplates } from '@/lib/db';
import { useEntitlements } from '@/state/entitlements';
import { CoachTemplate } from '@/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

// Helper to get coach description based on slug
const getCoachDescription = (slug: string): string => {
  const descriptions: Record<string, string> = {
    'focus-coach': 'Eliminate distractions and maintain deep focus on your work',
    'productivity-coach': 'Optimize your workflow and get more done in less time',
    'mindset-coach': 'Build mental resilience and develop a growth mindset',
    'habit-coach': 'Create lasting positive habits and break negative patterns',
    'time-coach': 'Master time management and prioritize effectively',
    'energy-coach': 'Boost your energy levels and avoid burnout',
    'clarity-coach': 'Get clarity on your goals and direction',
  };
  return descriptions[slug] || 'Your personal AI coach to help you achieve your goals';
};

export default function LibraryScreen() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<CoachTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pro = useEntitlements((state) => state.pro);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error: dbError } = await getCoachTemplates();
    
    if (dbError) {
      setError('Failed to load coaches');
      setLoading(false);
      return;
    }
    
    setCoaches(data);
    setLoading(false);
  };

  const handleCoachPress = (coach: CoachTemplate) => {
    // Check if coach is pro and user doesn't have access
    if (coach.is_pro && !pro) {
      router.push('/paywall');
      return;
    }
    
    // Navigate to chat with coach slug as param
    router.push({
      pathname: '/(drawer)/chat',
      params: { coach_slug: coach.slug },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Typography variant="body" style={styles.loadingText}>
            Loading coaches...
          </Typography>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Typography variant="body" style={styles.errorText}>
            {error}
          </Typography>
          <TouchableOpacity onPress={loadCoaches} style={styles.retryButton}>
            <Typography variant="body" style={styles.retryText}>
              Retry
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="body" style={styles.subtitle}>
          Choose your AI coach
        </Typography>
      </View>
      
      <FlatList
        data={coaches}
        keyExtractor={(item) => item.id || item.slug}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleCoachPress(item)}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Typography variant="h3">{item.title}</Typography>
                {item.is_pro && <Chip label="PRO" variant="default" />}
              </View>
              <Typography variant="body" style={styles.description}>
                {item.description || getCoachDescription(item.slug)}
              </Typography>
              <View style={styles.cardFooter}>
                <Typography variant="caption" style={styles.tapHint}>
                  Tap to start coaching →
                </Typography>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typography variant="body" style={styles.emptyText}>
              No coaches available yet
            </Typography>
          </View>
        }
      />
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
  subtitle: {
    marginTop: 8,
    color: '#666666',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  description: {
    marginTop: 4,
    color: '#666666',
    lineHeight: 22,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  tapHint: {
    color: '#999999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
  },
});
