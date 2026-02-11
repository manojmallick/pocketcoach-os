import Card from '@/components/Card';
import Chip from '@/components/Chip';
import Typography from '@/components/Typography';
import { getUserId } from '@/lib/auth';
import { markCardDone } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { ActionCard } from '@/types';
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

export default function TodayScreen() {
  const [cards, setCards] = useState<ActionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('active');
  const [error, setError] = useState<string | null>(null);

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

      setCards(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cards');
      setLoading(false);
    }
  };

  const handleToggleComplete = async (card: ActionCard) => {
    // Only allow marking active cards as done
    if (card.status !== 'active') return;

    // Optimistic UI update
    setCards(prevCards =>
      prevCards.map(c =>
        c.id === card.id
          ? { ...c, status: 'done' as const, completed_at: new Date().toISOString() }
          : c
      )
    );

    try {
      const { error } = await markCardDone(card.id);
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Error marking card done:', err);
      Alert.alert('Error', 'Failed to mark card as done');
      
      // Rollback on error
      setCards(prevCards =>
        prevCards.map(c =>
          c.id === card.id
            ? { ...c, status: 'active' as const, completed_at: undefined }
            : c
        )
      );
    }
  };

  const filteredCards = cards.filter(card => card.status === filter);
  const activeCount = cards.filter(c => c.status === 'active').length;
  const doneCount = cards.filter(c => c.status === 'done').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="body" style={styles.subtitle}>
          {doneCount} of {activeCount + doneCount} completed
        </Typography>
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
  subtitle: {
    marginTop: 8,
    color: '#666666',
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
