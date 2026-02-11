import Button from '@/components/Button';
import Card from '@/components/Card';
import Chip from '@/components/Chip';
import Typography from '@/components/Typography';
import { createChatSession, insertActionCards } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { ActionCardInput, ChatResponse } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';

// Fallback demo response for when network fails
const DEMO_RESPONSE: ChatResponse = {
  cards: [
    {
      type: 'TODAY',
      title: 'Morning Focus Block',
      why: 'Starting your day with focused work sets the tone and builds momentum for the rest of the day.',
      steps: [
        'Close all notifications and unnecessary apps',
        'Set a timer for 90 minutes',
        'Work on your most important task',
        'Take a 15-minute break after',
      ],
      time_min: 90,
    },
    {
      type: 'TODAY',
      title: 'Priority Planning Session',
      why: 'Clear priorities prevent you from getting distracted by urgent but unimportant tasks.',
      steps: [
        'List all tasks for today',
        'Identify the top 3 most important ones',
        'Schedule specific time blocks for each',
        'Say no to anything else',
      ],
      time_min: 15,
    },
    {
      type: 'WEEK',
      title: 'Weekly Review & Planning',
      why: 'Regular reviews help you stay aligned with your goals and adjust your approach.',
      steps: [
        'Review what you accomplished this week',
        'Identify what worked and what didn\'t',
        'Plan your top 3 priorities for next week',
        'Block time on your calendar',
      ],
      time_min: 30,
    },
    {
      type: 'AVOID',
      title: 'Don\'t Check Email First Thing',
      why: 'Starting your day reactive to others\' priorities kills your focus and momentum.',
      steps: [
        'Wait until after your morning focus block',
        'Batch email checking to 2-3 times per day',
        'Turn off email notifications',
      ],
      time_min: 0,
    },
  ],
  weekly_plan: [
    'Monday: Deep work on your most important project',
    'Tuesday: Team collaboration and meetings',
    'Wednesday: Learning and skill development',
    'Thursday: Review and planning for next week',
    'Friday: Wrap up loose ends and prep for Monday',
  ],
  coach_notes:
    'Focus is a skill that improves with practice. Start with these foundational habits and build from there. Remember: what you say no to is just as important as what you say yes to.',
};

export default function ChatScreen() {
  const { coach_slug } = useLocalSearchParams<{ coach_slug?: string }>();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionCards, setActionCards] = useState<ActionCardInput[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<string[]>([]);
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [addingCardId, setAddingCardId] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    loadDemoMode();
  }, []);

  const loadDemoMode = async () => {
    try {
      const value = await AsyncStorage.getItem('demo_mode');
      if (value !== null) {
        setDemoMode(value === 'true');
      }
    } catch (error) {
      console.error('Error loading demo mode:', error);
    }
  };

  const getCoachName = (slug: string): string => {
    const names: Record<string, string> = {
      'focus-coach': 'Focus Coach',
      'productivity-coach': 'Productivity Coach',
      'mindset-coach': 'Mindset Coach',
      'habit-coach': 'Habit Coach',
      'time-coach': 'Time Coach',
      'energy-coach': 'Energy Coach',
      'clarity-coach': 'Clarity Coach',
    };
    return names[slug] || 'AI Coach';
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const message = inputText.trim();
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      // Call Supabase Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('chat', {
        body: {
          coach_slug: coach_slug || 'focus-coach',
          message,
          demo_mode: demoMode,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to get response');
      }

      // Parse response as ChatResponse
      const chatResponse = data as ChatResponse;

      // Validate response structure
      if (!chatResponse || (!chatResponse.cards && !chatResponse.coach_notes)) {
        throw new Error('Invalid response format');
      }

      // Store in database
      const { data: session, error: sessionError } = await createChatSession(
        coach_slug || 'focus-coach',
        message,
        chatResponse
      );

      if (sessionError) {
        console.error('Failed to save chat session:', sessionError);
      } else if (session) {
        setSessionId(session.id);
      }

      // Update UI state
      setActionCards(chatResponse.cards || []);
      setWeeklyPlan(chatResponse.weekly_plan || []);
      setCoachNotes(chatResponse.coach_notes || '');
      setLoading(false);
    } catch (err) {
      console.error('Chat error:', err);
      
      // Use fallback response for any error (Edge Function not deployed, network issues, etc.)
      console.log('Using demo fallback response due to error');
      try {
        // Use fallback response
        const fallbackResponse = DEMO_RESPONSE;
        
        // Try to save to database (may fail, that's ok)
        try {
          const { data: session } = await createChatSession(
            coach_slug || 'focus-coach',
            message,
            fallbackResponse
          );
          if (session) {
            setSessionId(session.id);
          }
        } catch (dbErr) {
          console.log('Database save failed, continuing with demo response');
        }
        
        // Update UI with fallback data
        setActionCards(fallbackResponse.cards || []);
        setWeeklyPlan(fallbackResponse.weekly_plan || []);
        setCoachNotes(fallbackResponse.coach_notes || '');
        setError(null); // Clear error since we have fallback
        setLoading(false);
        return;
      } catch (fallbackErr) {
        console.error('Fallback failed:', fallbackErr);
        
        // If even fallback fails, show error
        setError(
          err instanceof Error 
            ? err.message 
            : 'Something went wrong. Please try again.'
        );
        setLoading(false);
      }
    }
  };

  const handleAddToToday = async (card: ActionCardInput) => {
    if (!sessionId) {
      Alert.alert('Error', 'No active session. Please send a message first.');
      return;
    }

    try {
      setAddingCardId(card.title);
      const { error } = await insertActionCards(sessionId, [card]);
      
      if (error) {
        throw new Error(error.message);
      }

      Alert.alert('Success', 'Action card added to Today');
      setAddingCardId(null);
    } catch (err) {
      console.error('Error adding card:', err);
      Alert.alert('Error', 'Failed to add card');
      setAddingCardId(null);
    }
  };

  const activeCoachName = getCoachName(coach_slug || 'focus-coach');

  return (
    <View style={styles.container}>
      {coach_slug && (
        <View style={styles.header}>
          <Typography variant="caption" style={styles.coachLabel}>
            with {activeCoachName}
          </Typography>
        </View>
      )}
      
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Welcome Message */}
          {actionCards.length === 0 && !loading && (
            <View style={styles.welcomeContainer}>
              <Typography variant="h2" style={styles.welcomeTitle}>
                Hi! I'm your {activeCoachName}
              </Typography>
              <Typography variant="body" style={styles.welcomeText}>
                Tell me what you'd like to work on, and I'll create personalized action cards for you.
              </Typography>
            </View>
          )}

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Typography variant="body" style={styles.loadingText}>
                Creating your action plan...
              </Typography>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <Typography variant="body" style={styles.errorText}>
                {error}
              </Typography>
            </View>
          )}

          {/* Coach Notes */}
          {coachNotes && (
            <View style={styles.notesContainer}>
              <Typography variant="h3" style={styles.sectionTitle}>
                Coach's Notes
              </Typography>
              <Card style={styles.notesCard}>
                <Typography variant="body" style={styles.notesText}>
                  {coachNotes}
                </Typography>
              </Card>
            </View>
          )}

          {/* Action Cards */}
          {actionCards.length > 0 && (
            <View style={styles.cardsContainer}>
              <Typography variant="h3" style={styles.sectionTitle}>
                Your Action Cards
              </Typography>
              {actionCards.map((card, index) => (
                <Card key={index} style={styles.actionCard}>
                  <View style={styles.cardHeader}>
                    <Chip 
                      label={card.type} 
                      variant={card.type === 'TODAY' ? 'success' : 'default'} 
                    />
                    <Typography variant="caption" style={styles.timeEstimate}>
                      {card.time_min} min
                    </Typography>
                  </View>
                  
                  <Typography variant="h3" style={styles.cardTitle}>
                    {card.title}
                  </Typography>
                  
                  <Typography variant="body" style={styles.cardWhy}>
                    {card.why}
                  </Typography>
                  
                  <View style={styles.stepsContainer}>
                    <Typography variant="h3" style={styles.stepsTitle}>
                      Steps:
                    </Typography>
                    {card.steps.map((step, stepIndex) => (
                      <View key={stepIndex} style={styles.stepItem}>
                        <Typography variant="body" style={styles.stepBullet}>
                          •
                        </Typography>
                        <Typography variant="body" style={styles.stepText}>
                          {step}
                        </Typography>
                      </View>
                    ))}
                  </View>
                  
                  <Button
                    title="Add to Today"
                    onPress={() => handleAddToToday(card)}
                    disabled={addingCardId === card.title}
                    style={styles.addButton}
                  />
                </Card>
              ))}
            </View>
          )}

          {/* Weekly Plan */}
          {weeklyPlan.length > 0 && (
            <View style={styles.planContainer}>
              <Typography variant="h3" style={styles.sectionTitle}>
                Your Weekly Plan
              </Typography>
              <Card style={styles.planCard}>
                {weeklyPlan.map((item, index) => (
                  <View key={index} style={styles.planItem}>
                    <Typography variant="body" style={styles.planText}>
                      • {item}
                    </Typography>
                  </View>
                ))}
              </Card>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="What would you like to work on?"
            placeholderTextColor="#999999"
            multiline
            maxLength={500}
            editable={!loading}
          />
          <Button 
            title="Send" 
            onPress={handleSend} 
            disabled={!inputText.trim() || loading} 
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  coachLabel: {
    marginTop: 4,
    color: '#999999',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  welcomeContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    textAlign: 'center',
    color: '#666666',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#666666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
  },
  notesContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  notesCard: {
    backgroundColor: '#F9F9F9',
  },
  notesText: {
    color: '#333333',
    lineHeight: 24,
  },
  cardsContainer: {
    marginTop: 24,
  },
  actionCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeEstimate: {
    color: '#999999',
  },
  cardTitle: {
    marginBottom: 8,
  },
  cardWhy: {
    color: '#666666',
    marginBottom: 16,
    lineHeight: 22,
  },
  stepsContainer: {
    marginBottom: 16,
  },
  stepsTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666666',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  stepBullet: {
    marginRight: 8,
    color: '#000000',
  },
  stepText: {
    flex: 1,
    color: '#333333',
    lineHeight: 22,
  },
  addButton: {
    marginTop: 8,
  },
  planContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#F9F9F9',
  },
  planItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  planText: {
    color: '#333333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
});
