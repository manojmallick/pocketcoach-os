import {
    ActionCard,
    ActionCardInput,
    ActionCardStatus,
    ChatSession,
    CoachTemplate,
    DbListResult,
    DbResult,
    UserContext,
} from '@/types';
import { getUserId } from './auth';
import { supabase } from './supabase';

/**
 * Get all available coach templates
 */
export async function getCoachTemplates(): Promise<DbListResult<CoachTemplate>> {
  try {
    const { data, error } = await supabase
      .from('coach_templates')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching coach templates:', error);
      return { data: [], error: new Error(error.message) };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception fetching coach templates:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Unknown error fetching coach templates') 
    };
  }
}

/**
 * Upsert (insert or update) user context
 */
export async function upsertUserContext(context: Omit<UserContext, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DbResult<UserContext>> {
  try {
    const userId = await getUserId();

    // First, try to find existing context
    const { data: existing } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', userId)
      .single();

    const contextData = {
      user_id: userId,
      project: context.project,
      blocker: context.blocker,
      time_daily_min: context.time_daily_min,
      tone: context.tone,
      updated_at: new Date().toISOString(),
    };

    let data, error;

    if (existing) {
      // Update existing record
      const result = await supabase
        .from('user_contexts')
        .update(contextData)
        .eq('user_id', userId)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from('user_contexts')
        .insert(contextData)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error upserting user context:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception upserting user context:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error upserting user context') 
    };
  }
}

/**
 * Get user context for the current user
 */
export async function getUserContext(): Promise<DbResult<UserContext>> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('user_contexts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Not found is not an error, return null data
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      console.error('Error fetching user context:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception fetching user context:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error fetching user context') 
    };
  }
}

/**
 * Create a chat session record
 */
export async function createChatSession(
  coach_slug: string,
  user_message: string,
  ai_json?: any
): Promise<DbResult<ChatSession>> {
  try {
    const userId = await getUserId();

    const sessionData = {
      user_id: userId,
      coach_slug,
      user_message,
      ai_response: JSON.stringify(ai_json || {}),
      ai_json,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating chat session:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception creating chat session:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error creating chat session') 
    };
  }
}

/**
 * Insert action cards linked to a session
 */
export async function insertActionCards(
  session_id: string,
  cards: ActionCardInput[]
): Promise<DbListResult<ActionCard>> {
  try {
    const userId = await getUserId();

    const cardsData = cards.map((card) => ({
      session_id,
      user_id: userId,
      type: card.type,
      title: card.title,
      why: card.why,
      steps: card.steps,
      time_min: card.time_min,
      status: 'active' as ActionCardStatus,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('action_cards')
      .insert(cardsData)
      .select();

    if (error) {
      console.error('Error inserting action cards:', error);
      return { data: [], error: new Error(error.message) };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception inserting action cards:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Unknown error inserting action cards') 
    };
  }
}

/**
 * Get active action cards for the current user
 */
export async function getActiveActionCards(): Promise<DbListResult<ActionCard>> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('action_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active action cards:', error);
      return { data: [], error: new Error(error.message) };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Exception fetching active action cards:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Unknown error fetching active action cards') 
    };
  }
}

/**
 * Mark an action card as done
 */
export async function markCardDone(card_id: string): Promise<DbResult<ActionCard>> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('action_cards')
      .update({
        status: 'done' as ActionCardStatus,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', card_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking card as done:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception marking card as done:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error marking card as done') 
    };
  }
}

/**
 * Archive an action card
 */
export async function archiveCard(card_id: string): Promise<DbResult<ActionCard>> {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('action_cards')
      .update({
        status: 'archived' as ActionCardStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', card_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error archiving card:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception archiving card:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error archiving card') 
    };
  }
}
