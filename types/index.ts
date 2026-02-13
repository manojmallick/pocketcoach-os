/**
 * User context representing the user's coaching goals and preferences
 */
export interface UserContext {
  id?: string;
  user_id?: string;
  project: string;
  blocker: string;
  time_daily_min: number;
  tone: 'supportive' | 'direct' | 'analytical' | 'motivational';
  created_at?: string;
  updated_at?: string;
}

/**
 * Coach template configuration
 */
export interface CoachTemplate {
  id?: string;
  slug: string;
  title: string;
  description?: string;
  is_pro: boolean;
  system_prompt?: string;
  created_at?: string;
}

/**
 * Action card type
 */
export type ActionCardType = 'TODAY' | 'WEEK' | 'AVOID' | 'NEXT';

/**
 * Action card status
 */
export type ActionCardStatus = 'active' | 'done' | 'archived';

/**
 * Action card representing a task or recommendation
 */
export interface ActionCard {
  id: string;
  session_id?: string;
  user_id?: string;
  type: ActionCardType;
  title: string;
  why: string;
  steps: string[];
  time_min: number;
  status: ActionCardStatus;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

/**
 * Input type for creating action cards (without generated fields)
 */
export interface ActionCardInput {
  type: ActionCardType;
  title: string;
  why: string;
  steps: string[];
  time_min: number;
}

/**
 * Chat response from AI
 */
export interface ChatResponse {
  cards: ActionCardInput[];
  weekly_plan: string[];
  coach_notes: string;
}

/**
 * Chat session record
 */
export interface ChatSession {
  id: string;
  user_id: string;
  coach_slug: string;
  user_message: string;
  ai_response: string;
  ai_json?: ChatResponse | null;
  created_at?: string;
}

/**
 * Database operation result
 */
export interface DbResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Database list result
 */
export interface DbListResult<T> {
  data: T[];
  error: Error | null;
}
