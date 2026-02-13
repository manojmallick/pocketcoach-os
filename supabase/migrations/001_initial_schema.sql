-- PocketCoach OS - Supabase Database Schema
-- Run this in your Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- COACH TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS coach_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_pro BOOLEAN DEFAULT false,
  system_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add description column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coach_templates' AND column_name = 'description'
  ) THEN
    ALTER TABLE coach_templates ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add system_prompt column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coach_templates' AND column_name = 'system_prompt'
  ) THEN
    ALTER TABLE coach_templates ADD COLUMN system_prompt TEXT;
  END IF;
END $$;

-- Insert sample coaches
INSERT INTO coach_templates (slug, title, description, is_pro, system_prompt) VALUES
  ('focus-coach', 'Focus Coach', 'Helps you eliminate distractions and stay on track', false, 'You are a supportive coach focused on helping users maintain deep focus and eliminate distractions.'),
  ('productivity-coach', 'Productivity Coach', 'Optimize your workflow and get more done', false, 'You are a productivity expert helping users optimize their time and workflow.'),
  ('mindset-coach', 'Mindset Coach', 'Build resilience and positive thinking', true, 'You are a mindset coach helping users build mental resilience and positive thinking patterns.'),
  ('habit-coach', 'Habit Coach', 'Build lasting habits and routines', false, 'You are a habit formation expert helping users build and maintain positive habits.')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- USER CONTEXTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  project TEXT NOT NULL,
  blocker TEXT NOT NULL,
  time_daily_min INTEGER NOT NULL DEFAULT 30,
  tone TEXT NOT NULL DEFAULT 'supportive' CHECK (tone IN ('supportive', 'direct', 'analytical', 'motivational')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_contexts_user_id ON user_contexts(user_id);

-- =============================================
-- CHAT SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  coach_slug TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  ai_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat history queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- =============================================
-- ACTION CARDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS action_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TODAY', 'WEEK', 'AVOID', 'NEXT')),
  title TEXT NOT NULL,
  why TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_min INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for action cards queries
CREATE INDEX IF NOT EXISTS idx_action_cards_user_id ON action_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_action_cards_status ON action_cards(status);
CREATE INDEX IF NOT EXISTS idx_action_cards_user_status ON action_cards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_action_cards_type ON action_cards(type);
CREATE INDEX IF NOT EXISTS idx_action_cards_created_at ON action_cards(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE coach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_cards ENABLE ROW LEVEL SECURITY;

-- Coach templates: Public read access (everyone can see coaches)
DROP POLICY IF EXISTS "coach_templates_select" ON coach_templates;
CREATE POLICY "coach_templates_select" ON coach_templates
  FOR SELECT USING (true);

-- User contexts: Allow all operations for now (for development with device UUID fallback)
-- TODO: Restrict these policies once proper authentication is implemented
DROP POLICY IF EXISTS "user_contexts_select" ON user_contexts;
CREATE POLICY "user_contexts_select" ON user_contexts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_contexts_insert" ON user_contexts;
CREATE POLICY "user_contexts_insert" ON user_contexts
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "user_contexts_update" ON user_contexts;
CREATE POLICY "user_contexts_update" ON user_contexts
  FOR UPDATE USING (true);

-- Chat sessions: Allow all operations for now (for development)
DROP POLICY IF EXISTS "chat_sessions_select" ON chat_sessions;
CREATE POLICY "chat_sessions_select" ON chat_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "chat_sessions_insert" ON chat_sessions;
CREATE POLICY "chat_sessions_insert" ON chat_sessions
  FOR INSERT WITH CHECK (true);

-- Action cards: Allow all operations for now (for development)
DROP POLICY IF EXISTS "action_cards_select" ON action_cards;
CREATE POLICY "action_cards_select" ON action_cards
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "action_cards_insert" ON action_cards;
CREATE POLICY "action_cards_insert" ON action_cards
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "action_cards_update" ON action_cards;
CREATE POLICY "action_cards_update" ON action_cards
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "action_cards_delete" ON action_cards;
CREATE POLICY "action_cards_delete" ON action_cards
  FOR DELETE USING (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_contexts
DROP TRIGGER IF EXISTS update_user_contexts_updated_at ON user_contexts;
CREATE TRIGGER update_user_contexts_updated_at
  BEFORE UPDATE ON user_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for action_cards
DROP TRIGGER IF EXISTS update_action_cards_updated_at ON action_cards;
CREATE TRIGGER update_action_cards_updated_at
  BEFORE UPDATE ON action_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify tables were created
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('coach_templates', 'user_contexts', 'chat_sessions', 'action_cards')
ORDER BY tablename;

-- Check sample coaches
SELECT slug, title, is_pro FROM coach_templates ORDER BY title;
