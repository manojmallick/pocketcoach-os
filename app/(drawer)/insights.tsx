import Button from '@/components/Button';
import Card from '@/components/Card';
import Typography from '@/components/Typography';
import { getUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

type ActionCardRow = {
  id: string;
  type: string;
  status: string;
  created_at?: string;
  completed_at?: string | null;
  time_min?: number | null;
};

type ChatSessionRow = {
  id: string;
  coach_slug: string;
  created_at?: string;
};

type WeeklySummary = {
  weekKey: string;
  rangeLabel: string;
  generatedAt: string;
  headline: string;
  highlights: string[];
  nextFocus: string;
  stats: {
    sessions: number;
    actions: number;
    completed: number;
    completionRate: number;
    topCoach?: string;
  };
};

const INSIGHTS_WEEK_KEY = 'insights_week_key';
const INSIGHTS_PAYLOAD_KEY = 'insights_payload';

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(start: Date): Date {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function rangeLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
}

function coachLabel(slug: string): string {
  const names: Record<string, string> = {
    'focus-coach': 'Focus Coach',
    'productivity-coach': 'Productivity Coach',
    'mindset-coach': 'Mindset Coach',
    'habit-coach': 'Habit Coach',
    'time-coach': 'Time Coach',
    'energy-coach': 'Energy Coach',
    'clarity-coach': 'Clarity Coach',
  };
  return names[slug] ?? 'AI Coach';
}

function topCoach(sessions: ChatSessionRow[]): string | undefined {
  if (sessions.length === 0) return undefined;
  const counts = sessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.coach_slug] = (acc[session.coach_slug] || 0) + 1;
    return acc;
  }, {});
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return top ? coachLabel(top) : undefined;
}

function buildSummary(cards: ActionCardRow[], sessions: ChatSessionRow[], start: Date, end: Date): WeeklySummary {
  const actions = cards.length;
  const completed = cards.filter((c) => c.status === 'done').length;
  const completionRate = actions > 0 ? Math.round((completed / actions) * 100) : 0;
  const sessionsCount = sessions.length;
  const top = topCoach(sessions);

  const actionTypes = cards.reduce<Record<string, number>>((acc, card) => {
    acc[card.type] = (acc[card.type] || 0) + 1;
    return acc;
  }, {});
  const primaryType = Object.keys(actionTypes).sort((a, b) => actionTypes[b] - actionTypes[a])[0];

  const headline = actions > 0 || sessionsCount > 0
    ? 'Your week in review'
    : 'Get your first week started';

  const highlights: string[] = [];
  if (sessionsCount > 0) {
    highlights.push(`You completed ${sessionsCount} coaching session${sessionsCount === 1 ? '' : 's'}.`);
  }
  if (actions > 0) {
    highlights.push(`You created ${actions} action card${actions === 1 ? '' : 's'} and completed ${completed}.`);
  }
  if (top) {
    highlights.push(`Your most active coach was ${top}.`);
  }
  if (primaryType) {
    highlights.push(`Most of your actions were ${primaryType.toLowerCase()} focused.`);
  }

  const nextFocus = completionRate < 50
    ? 'Aim to complete at least half of your daily actions to build momentum.'
    : 'Keep the streak alive by setting one small win each morning.';

  return {
    weekKey: dateKey(start),
    rangeLabel: rangeLabel(start, end),
    generatedAt: new Date().toISOString(),
    headline,
    highlights: highlights.length ? highlights : ['Start a chat to generate your first action cards.'],
    nextFocus,
    stats: {
      sessions: sessionsCount,
      actions,
      completed,
      completionRate,
      topCoach: top,
    },
  };
}

export default function InsightsScreen() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekWindow = useMemo(() => {
    const start = startOfWeek(new Date());
    const end = endOfWeek(start);
    return { start, end, key: dateKey(start) };
  }, []);

  const loadInsights = async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!force) {
        const [cachedWeek, cachedPayload] = await Promise.all([
          AsyncStorage.getItem(INSIGHTS_WEEK_KEY),
          AsyncStorage.getItem(INSIGHTS_PAYLOAD_KEY),
        ]);

        if (cachedWeek === weekWindow.key && cachedPayload) {
          const parsed = JSON.parse(cachedPayload) as WeeklySummary;
          setSummary(parsed);
          setLoading(false);
          return;
        }
      }

      const userId = await getUserId();
      const startIso = weekWindow.start.toISOString();
      const endIso = weekWindow.end.toISOString();

      const [cardsResult, sessionsResult] = await Promise.all([
        supabase
          .from('action_cards')
          .select('id,type,status,created_at,completed_at,time_min')
          .eq('user_id', userId)
          .gte('created_at', startIso)
          .lte('created_at', endIso),
        supabase
          .from('chat_sessions')
          .select('id,coach_slug,created_at')
          .eq('user_id', userId)
          .gte('created_at', startIso)
          .lte('created_at', endIso),
      ]);

      if (cardsResult.error) throw new Error(cardsResult.error.message);
      if (sessionsResult.error) throw new Error(sessionsResult.error.message);

      const nextSummary = buildSummary(
        (cardsResult.data as ActionCardRow[]) || [],
        (sessionsResult.data as ChatSessionRow[]) || [],
        weekWindow.start,
        weekWindow.end,
      );

      await Promise.all([
        AsyncStorage.setItem(INSIGHTS_WEEK_KEY, weekWindow.key),
        AsyncStorage.setItem(INSIGHTS_PAYLOAD_KEY, JSON.stringify(nextSummary)),
      ]);

      setSummary(nextSummary);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const stats = summary?.stats;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Typography variant="h2">Weekly Insights</Typography>
          <Typography variant="caption" style={styles.subtitle}>
            {summary ? `Week of ${summary.rangeLabel}` : 'Your summaries will appear here after a week of activity.'}
          </Typography>
        </View>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#000000" />
            <Typography variant="caption" style={styles.loadingText}>
              Generating insights...
            </Typography>
          </View>
        )}

        {error && !loading && (
          <Card style={styles.card}>
            <Typography variant="h3" style={styles.cardTitle}>
              Unable to load insights
            </Typography>
            <Typography variant="body" style={styles.cardBody}>
              {error}
            </Typography>
            <Button title="Try again" onPress={() => loadInsights(true)} />
          </Card>
        )}

        {!loading && !error && summary && (
          <>
            <Card style={styles.card}>
              <Typography variant="h3" style={styles.cardTitle}>
                {summary.headline}
              </Typography>
              {summary.highlights.map((line) => (
                <Typography key={line} variant="body" style={styles.cardBody}>
                  {line}
                </Typography>
              ))}
            </Card>

            <Card style={styles.card}>
              <Typography variant="h3" style={styles.cardTitle}>
                Focus for next week
              </Typography>
              <Typography variant="body" style={styles.cardBody}>
                {summary.nextFocus}
              </Typography>
            </Card>

            <Card style={styles.card}>
              <Typography variant="h3" style={styles.cardTitle}>
                Stats
              </Typography>
              <View style={styles.statsRow}>
                <Typography variant="caption" style={styles.statLabel}>
                  Sessions
                </Typography>
                <Typography variant="body">{stats?.sessions ?? 0}</Typography>
              </View>
              <View style={styles.statsRow}>
                <Typography variant="caption" style={styles.statLabel}>
                  Actions
                </Typography>
                <Typography variant="body">{stats?.actions ?? 0}</Typography>
              </View>
              <View style={styles.statsRow}>
                <Typography variant="caption" style={styles.statLabel}>
                  Completed
                </Typography>
                <Typography variant="body">{stats?.completed ?? 0}</Typography>
              </View>
              <View style={styles.statsRow}>
                <Typography variant="caption" style={styles.statLabel}>
                  Completion rate
                </Typography>
                <Typography variant="body">{stats?.completionRate ?? 0}%</Typography>
              </View>
              {stats?.topCoach && (
                <View style={styles.statsRow}>
                  <Typography variant="caption" style={styles.statLabel}>
                    Top coach
                  </Typography>
                  <Typography variant="body">{stats.topCoach}</Typography>
                </View>
              )}
            </Card>

            <Button title="Refresh summary" onPress={() => loadInsights(true)} />
          </>
        )}

        {!loading && !error && !summary && (
          <Card style={styles.card}>
            <Typography variant="h3" style={styles.cardTitle}>
              No insights yet
            </Typography>
            <Typography variant="body" style={styles.cardBody}>
              Start chatting with coaches and creating action cards to see your weekly insights appear here.
            </Typography>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  subtitle: {
    color: '#777777',
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: '#777777',
  },
  card: {
    gap: 10,
  },
  cardTitle: {
    marginBottom: 2,
  },
  cardBody: {
    color: '#444444',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#777777',
  },
});
