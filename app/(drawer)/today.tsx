import Card from '@/components/Card';
import Chip from '@/components/Chip';
import Typography from '@/components/Typography';
import { getUserId } from '@/lib/auth';
import { markCardDone } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { ActionCard } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

type FilterType = 'active' | 'done';

const STREAK_COUNT_KEY = 'streak_count';
const STREAK_LAST_COMPLETED_KEY = 'streak_last_completed';
const STREAK_LAST_EVAL_KEY = 'streak_last_eval';

function dateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

function isTodayCard(card: ActionCard): boolean {
  if (!card.created_at) return false;
  return card.created_at.slice(0, 10) === dateKey();
}

async function getStreakState(): Promise<{ count: number; lastCompleted: string; lastEvaluated: string }> {
  const [countRaw, lastCompleted, lastEvaluated] = await Promise.all([
    AsyncStorage.getItem(STREAK_COUNT_KEY),
    AsyncStorage.getItem(STREAK_LAST_COMPLETED_KEY),
    AsyncStorage.getItem(STREAK_LAST_EVAL_KEY),
  ]);

  return {
    count: countRaw ? Number(countRaw) : 0,
    lastCompleted: lastCompleted ?? '',
    lastEvaluated: lastEvaluated ?? '',
  };
}

async function setStreakState(count: number, lastCompleted: string, lastEvaluated: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(STREAK_COUNT_KEY, String(count)),
    AsyncStorage.setItem(STREAK_LAST_COMPLETED_KEY, lastCompleted),
    AsyncStorage.setItem(STREAK_LAST_EVAL_KEY, lastEvaluated),
  ]);
}

export default function TodayScreen() {
  const [cards, setCards] = useState<ActionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('active');
  const [error, setError] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = await getUserId();

      // Get both active and done cards
      const { data, error: fetchError } = await supabase
        .from('action_cards')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'done'])
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const allCards = data || [];
      setCards(allCards);

      const todayCards = allCards.filter(isTodayCard);
      const updatedStreak = await updateStreak(todayCards);
      setStreakCount(updatedStreak);

      setLoading(false);
    } catch (err) {
      console.error('Error loading cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cards');
      setLoading(false);
    }
  };

  const updateStreak = async (todayCards: ActionCard[]): Promise<number> => {
    const today = dateKey();
    const yesterday = yesterdayKey();
    const { count, lastCompleted, lastEvaluated } = await getStreakState();

    let nextCount = count;
    let nextLastCompleted = lastCompleted;
    let nextLastEvaluated = lastEvaluated;

    if (lastEvaluated !== today) {
      if (lastCompleted !== yesterday) {
        nextCount = 0;
      }
      nextLastEvaluated = today;
    }

    const todayComplete = todayCards.length > 0 && todayCards.every((card) => card.status === 'done');

    if (todayComplete && nextLastCompleted !== today) {
      nextCount = nextCount > 0 ? nextCount + 1 : 1;
      nextLastCompleted = today;
    }

    if (
      nextCount !== count ||
      nextLastCompleted !== lastCompleted ||
      nextLastEvaluated !== lastEvaluated
    ) {
      await setStreakState(nextCount, nextLastCompleted, nextLastEvaluated);
    }

    return nextCount;
  };

  const handleToggleComplete = async (card: ActionCard) => {
    // Only allow marking active cards as done
    if (card.status !== 'active') return;

    let nextCards: ActionCard[] = [];
    // Optimistic UI update
    setCards(prevCards => {
      nextCards = prevCards.map(c =>
        c.id === card.id
          ? { ...c, status: 'done' as const, completed_at: new Date().toISOString() }
          : c
      );
      return nextCards;
    });
    const updatedStreak = await updateStreak(nextCards.filter(isTodayCard));
    setStreakCount(updatedStreak);

    try {
      const { error } = await markCardDone(card.id);
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Error marking card done:', err);
      Alert.alert('Error', 'Failed to mark card as done');
      
      // Rollback on error
      let rollbackCards: ActionCard[] = [];
      setCards(prevCards => {
        rollbackCards = prevCards.map(c =>
          c.id === card.id
            ? { ...c, status: 'active' as const, completed_at: undefined }
            : c
        );
        return rollbackCards;
      });
      const rollbackStreak = await updateStreak(rollbackCards.filter(isTodayCard));
      setStreakCount(rollbackStreak);
    }
  };

  const filteredCards = cards.filter(card => card.status === filter);
  const activeCount = cards.filter(c => c.status === 'active').length;
  const doneCount = cards.filter(c => c.status === 'done').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Typography variant="body" style={styles.subtitle}>
            {doneCount} of {activeCount + doneCount} completed
          </Typography>
          <View style={styles.streakPill}>
            <Typography variant="caption" style={styles.streakText}>
              Streak: {streakCount}
            </Typography>
          </View>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => setFilter('active')}>
          <Chip 
            label={`Active (${activeCount})`}
            variant={filter === 'active' ? 'success' : 'default'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('done')}>
          <Chip 
            label={`Done (${doneCount})`}
            variant={filter === 'done' ? 'warning' : 'default'}
          />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Typography variant="body" style={styles.errorText}>
            {error}
          </Typography>
          <TouchableOpacity onPress={loadCards} style={styles.retryButton}>
            <Typography variant="body" style={styles.retryText}>
              Tap to retry
            </Typography>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCards.length === 0 && (
        <View style={styles.emptyContainer}>
          <Typography variant="h3" style={styles.emptyTitle}>
            {filter === 'active' ? 'No active cards' : 'No completed cards'}
          </Typography>
          <Typography variant="body" style={styles.emptyText}>
            {filter === 'active'
              ? 'Go chat with a coach to create action cards'
              : 'Complete some cards to see them here'}
          </Typography>
        </View>
      )}

      {/* Cards List */}
      {!loading && !error && (
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={loadCards}
          refreshing={loading}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => handleToggleComplete(item)}
              disabled={item.status === 'done'}
            >
              <Card style={item.status === 'done' ? {...styles.card, ...styles.completedCard} : styles.card}>
                <View style={styles.cardContent}>
                  {/* Custom Checkbox */}
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      item.status === 'done' ? styles.checkboxChecked : undefined
                    ]}>
                      {item.status === 'done' && (
                        <Typography variant="body" style={styles.checkmark}>
                          ✓
                        </Typography>
                      )}
                    </View>
                  </View>

                  {/* Card Info */}
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTitleRow}>
                      <Typography 
                        variant="h3" 
                        style={item.status === 'done' ? {...styles.cardTitle, ...styles.completedText} : styles.cardTitle}
                      >
                        {item.title}
                      </Typography>
                      <Chip 
                        label={item.type}
                        variant={item.type === 'TODAY' ? 'success' : 'default'}
                      />
                    </View>
                    
                    <Typography variant="caption" style={styles.timeEstimate}>
                      {item.time_min} min
                    </Typography>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
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
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  subtitle: {
    marginTop: 8,
    color: '#666666',
  },
  streakPill: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  streakText: {
    color: '#444444',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  retryText: {
    color: '#000000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
  },
  completedCard: {
    opacity: 0.6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    paddingTop: 2,
    marginRight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 12,
  },
  cardTitle: {
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  timeEstimate: {
    color: '#999999',
  },
});
