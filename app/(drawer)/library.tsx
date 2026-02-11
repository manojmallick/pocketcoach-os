import Card from '@/components/Card';
import Typography from '@/components/Typography';
import { getCoachTemplates } from '@/lib/db';
import { useProStatus } from '@/state/entitlements';
import { CoachTemplate } from '@/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Coach metadata for rich cards ────────────────────────────────────────────

type CoachMeta = {
  emoji: string;
  subtitle: string;
  color: string;          // accent bg for icon circle
  colorLight: string;     // tinted card background
};

const COACH_META: Record<string, CoachMeta> = {
  'focus-coach': {
    emoji: '🎯',
    subtitle: 'Eliminate distractions and sharpen deep focus',
    color: '#5B5FED',
    colorLight: '#EDEDFD',
  },
  'productivity-coach': {
    emoji: '⚡',
    subtitle: 'Optimize your workflow and ship faster',
    color: '#E8A317',
    colorLight: '#FFF7E6',
  },
  'mindset-coach': {
    emoji: '🧠',
    subtitle: 'Build resilience and a growth mindset',
    color: '#2AAF74',
    colorLight: '#E8F8F0',
  },
  'habit-coach': {
    emoji: '🔁',
    subtitle: 'Create lasting habits, break bad ones',
    color: '#E0598B',
    colorLight: '#FDEDF3',
  },
  'clarity-coach': {
    emoji: '💎',
    subtitle: 'Get clarity on goals and next steps',
    color: '#3FA0D8',
    colorLight: '#EAF5FC',
  },
};

const DEFAULT_META: CoachMeta = {
  emoji: '🤖',
  subtitle: 'Your personal AI coach',
  color: '#888888',
  colorLight: '#F5F5F5',
};

/** Hardcoded fallback so the screen is never blank. */
const FALLBACK_COACHES: CoachTemplate[] = [
  { slug: 'focus-coach', title: 'Focus Coach', is_pro: false },
  { slug: 'productivity-coach', title: 'Productivity Coach', is_pro: false },
  { slug: 'mindset-coach', title: 'Mindset Coach', is_pro: true },
  { slug: 'habit-coach', title: 'Habit Coach', is_pro: true },
  { slug: 'clarity-coach', title: 'Clarity Coach', is_pro: true },
];

const getMeta = (slug: string): CoachMeta => COACH_META[slug] ?? DEFAULT_META;

// ─── Skeleton placeholder ─────────────────────────────────────────────────────

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <Animated.View style={[styles.skeletonCircle, { opacity }]} />
        <View style={styles.skeletonLines}>
          <Animated.View style={[styles.skeletonBar, { width: '55%', opacity }]} />
          <Animated.View style={[styles.skeletonBar, { width: '80%', marginTop: 8, opacity }]} />
        </View>
      </View>
    </Card>
  );
}

// ─── Coach Card ───────────────────────────────────────────────────────────────

function CoachCard({
  coach,
  isPro,
  onPress,
}: {
  coach: CoachTemplate;
  isPro: boolean;
  onPress: () => void;
}) {
  const meta = getMeta(coach.slug);
  const locked = coach.is_pro && !isPro;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.cardTouchable}
    >
      <Card style={[styles.card, { backgroundColor: meta.colorLight }]}>        
        <View style={styles.cardRow}>
          {/* Emoji icon */}
          <View style={[styles.emojiCircle, { backgroundColor: meta.color + '22' }]}>  
            <Text style={styles.emoji}>{meta.emoji}</Text>
          </View>

          {/* Text content */}
          <View style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Typography variant="h3" style={styles.cardTitle}>
                {coach.title}
              </Typography>
              {coach.is_pro && (
                <View style={styles.proPill}>
                  <Text style={styles.proPillText}>PRO</Text>
                </View>
              )}
            </View>

            <Typography variant="caption" style={styles.cardSubtitle}>
              {coach.description || meta.subtitle}
            </Typography>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaRow}>
          {locked ? (
            <View style={styles.ctaLocked}>
              <MaterialIcons name="lock" size={14} color="#FFFFFF" />
              <Text style={styles.ctaLockedText}>Unlock with Pro</Text>
            </View>
          ) : (
            <View style={styles.ctaStart}>
              <Text style={styles.ctaStartText}>Start</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ─── Library Screen ───────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<CoachTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const pro = useProStatus((s) => s.isPro);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    setLoading(true);
    const { data, error } = await getCoachTemplates();

    if (error || data.length === 0) {
      // Fallback so the screen is never empty
      setCoaches(FALLBACK_COACHES);
    } else {
      setCoaches(data);
    }
    setLoading(false);
  };

  const handleCoachPress = useCallback(
    (coach: CoachTemplate) => {
      if (coach.is_pro && !pro) {
        router.push('/paywall');
        return;
      }
      router.push({
        pathname: '/(drawer)/chat',
        params: { coach_slug: coach.slug },
      } as Href);
    },
    [pro, router],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Section heading */}
      <View style={styles.sectionHeader}>
        <Typography variant="h2" style={styles.sectionTitle}>
          AI Coaches
        </Typography>
        <Typography variant="caption" style={styles.sectionSubtitle}>
          Pick a coach and start a conversation
        </Typography>
      </View>

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={coaches}
          keyExtractor={(item) => item.id ?? item.slug}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CoachCard
              coach={item}
              isPro={pro}
              onPress={() => handleCoachPress(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="school" size={48} color="#CCCCCC" />
              <Typography variant="body" style={styles.emptyText}>
                No coaches available yet
              </Typography>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Section heading */
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: '#000000',
  },
  sectionSubtitle: {
    marginTop: 4,
    color: '#888888',
  },

  /* List */
  list: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },

  /* Card */
  cardTouchable: {
    marginBottom: 14,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 0,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  emojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    color: '#000000',
  },
  cardSubtitle: {
    marginTop: 4,
    color: '#666666',
    lineHeight: 20,
  },

  /* PRO pill */
  proPill: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  proPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* CTA buttons */
  ctaRow: {
    marginTop: 14,
    alignItems: 'flex-end',
  },
  ctaStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000000',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  ctaStartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ctaLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#AAAAAA',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  ctaLockedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Skeleton */
  skeletonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
  },
  skeletonLines: {
    flex: 1,
    justifyContent: 'center',
    gap: 0,
  },
  skeletonBar: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0E0E0',
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
  },
});
