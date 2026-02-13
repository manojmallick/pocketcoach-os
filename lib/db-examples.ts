/**
 * Example usage of the data layer
 * This file demonstrates how to use the typed database functions
 */

import {
    archiveCard,
    createChatSession,
    getActiveActionCards,
    getCoachTemplates,
    getUserContext,
    insertActionCards,
    markCardDone,
    upsertUserContext,
} from '@/lib/db';
import { UserContext } from '@/types';

// ====================
// COACH TEMPLATES
// ====================

async function loadCoaches() {
  const { data: coaches, error } = await getCoachTemplates();
  
  if (error) {
    console.error('Failed to load coaches:', error);
    return;
  }
  
  console.log('Available coaches:', coaches);
  // coaches is CoachTemplate[]
}

// ====================
// USER CONTEXT
// ====================

async function saveUserPreferences() {
  const context: Omit<UserContext, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
    project: 'Build a fitness app',
    blocker: 'Time management and focus',
    time_daily_min: 60,
    tone: 'supportive',
  };
  
  const { data, error } = await upsertUserContext(context);
  
  if (error) {
    console.error('Failed to save preferences:', error);
    return;
  }
  
  console.log('Saved user context:', data);
}

async function loadUserPreferences() {
  const { data: context, error } = await getUserContext();
  
  if (error) {
    console.error('Failed to load preferences:', error);
    return;
  }
  
  if (!context) {
    console.log('No user context found');
    return;
  }
  
  console.log('User project:', context.project);
  console.log('Daily time:', context.time_daily_min, 'minutes');
}

// ====================
// CHAT & ACTION CARDS
// ====================

async function processAIResponse() {
  // 1. Create a chat session
  const aiResponse = {
    cards: [
      {
        type: 'TODAY' as const,
        title: 'Morning Planning Session',
        why: 'Starting the day with clear priorities improves focus',
        steps: [
          'Review your project goals',
          'List top 3 priorities',
          'Time-block your calendar',
        ],
        time_min: 15,
      },
      {
        type: 'WEEK' as const,
        title: 'Weekly Review',
        why: 'Reflection helps identify patterns and improve',
        steps: [
          'Review what went well',
          'Identify blockers',
          'Plan next week',
        ],
        time_min: 30,
      },
    ],
    weekly_plan: [
      'Mon: Focus on core features',
      'Tue: User testing',
      'Wed: Iterate on feedback',
    ],
    coach_notes: 'Great progress this week! Keep the momentum going.',
  };
  
  const { data: session, error: sessionError } = await createChatSession(
    'focus-coach',
    'How can I stay focused on my fitness app project?',
    aiResponse
  );
  
  if (sessionError || !session) {
    console.error('Failed to create chat session:', sessionError);
    return;
  }
  
  // 2. Insert action cards from the AI response
  const { data: cards, error: cardsError } = await insertActionCards(
    session.id,
    aiResponse.cards
  );
  
  if (cardsError) {
    console.error('Failed to insert action cards:', cardsError);
    return;
  }
  
  console.log('Created', cards.length, 'action cards');
}

// ====================
// MANAGING CARDS
// ====================

async function loadTodayCards() {
  const { data: cards, error } = await getActiveActionCards();
  
  if (error) {
    console.error('Failed to load cards:', error);
    return;
  }
  
  const todayCards = cards.filter(card => card.type === 'TODAY');
  console.log('Today\'s cards:', todayCards);
  
  return cards;
}

async function completeCard(cardId: string) {
  const { data, error } = await markCardDone(cardId);
  
  if (error) {
    console.error('Failed to mark card done:', error);
    return;
  }
  
  console.log('Completed card:', data?.title);
}

async function removeCard(cardId: string) {
  const { data, error } = await archiveCard(cardId);
  
  if (error) {
    console.error('Failed to archive card:', error);
    return;
  }
  
  console.log('Archived card:', data?.title);
}

// ====================
// FULL WORKFLOW
// ====================

async function fullWorkflow() {
  // 1. Load coaches
  const { data: coaches } = await getCoachTemplates();
  console.log('Available coaches:', coaches?.length);
  
  // 2. Save user context
  await upsertUserContext({
    project: 'Build PocketCoach',
    blocker: 'Need to integrate AI chat',
    time_daily_min: 90,
    tone: 'direct',
  });
  
  // 3. Get user context
  const { data: context } = await getUserContext();
  console.log('User context loaded:', context?.project);
  
  // 4. Simulate AI chat and create action cards
  await processAIResponse();
  
  // 5. Load active cards
  const { data: activeCards } = await getActiveActionCards();
  console.log('Active cards:', activeCards?.length);
  
  // 6. Complete first card
  if (activeCards && activeCards.length > 0) {
    await markCardDone(activeCards[0].id);
    console.log('First card completed!');
  }
}

export {
    completeCard, fullWorkflow, loadCoaches, loadTodayCards, loadUserPreferences,
    processAIResponse, removeCard, saveUserPreferences
};

