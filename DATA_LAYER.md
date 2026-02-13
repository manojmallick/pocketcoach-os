# PocketCoach OS - Data Layer

Complete typed data layer with Supabase integration.

## 📁 Files Created

### Types ([types/index.ts](types/index.ts))
- `UserContext` - User coaching preferences
- `CoachTemplate` - Coach configurations
- `ActionCard` - Task/recommendation cards
- `ActionCardInput` - Input for creating cards
- `ChatResponse` - AI response structure
- `ChatSession` - Chat history record
- `DbResult<T>` - Single result wrapper
- `DbListResult<T>` - List result wrapper

### Database Functions ([lib/db.ts](lib/db.ts))

#### Coach Management
- `getCoachTemplates()` - Fetch all available coaches

#### User Context
- `upsertUserContext(context)` - Save/update user preferences
- `getUserContext()` - Get current user's context

#### Chat & Cards
- `createChatSession(coach_slug, user_message, ai_json)` - Log chat interaction
- `insertActionCards(session_id, cards)` - Create multiple action cards
- `getActiveActionCards()` - Fetch all active cards for user
- `markCardDone(card_id)` - Mark card as completed
- `archiveCard(card_id)` - Archive a card

### Examples ([lib/db-examples.ts](lib/db-examples.ts))
Complete usage examples for all database functions.

### Database Schema ([supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql))
SQL migration to create all tables with:
- Proper indexes for performance
- Row Level Security (RLS) policies
- Sample coach data
- Automatic timestamp triggers

## 🚀 Quick Start

### 1. Set Up Database

Run the migration SQL in your Supabase SQL Editor:
```bash
# Copy content from supabase/migrations/001_initial_schema.sql
# Paste and execute in Supabase Dashboard > SQL Editor
```

### 2. Configure Credentials

Add to `.env.local`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Use in Your App

```typescript
import { 
  getCoachTemplates, 
  getUserContext,
  upsertUserContext,
  getActiveActionCards,
  markCardDone 
} from '@/lib/db';

// Load coaches
const { data: coaches, error } = await getCoachTemplates();

// Save user preferences
await upsertUserContext({
  project: 'Build fitness app',
  blocker: 'Time management',
  time_daily_min: 60,
  tone: 'supportive',
});

// Get today's tasks
const { data: cards } = await getActiveActionCards();
const todayCards = cards?.filter(c => c.type === 'TODAY');

// Mark card as done
await markCardDone(cardId);
```

## 📊 Database Schema

### Tables
1. **coach_templates** - Available AI coaches
2. **user_contexts** - User preferences per user
3. **chat_sessions** - Chat history with AI
4. **action_cards** - Generated tasks/recommendations

### Relationships
```
chat_sessions
    ├─> coach_templates (via coach_slug)
    └─> action_cards (one-to-many via session_id)

user_contexts
    └─> user_id (links to auth.users)

action_cards
    ├─> user_id (links to auth.users)
    └─> session_id (links to chat_sessions)
```

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Coach templates are publicly readable
- Device-based auth supported (fallback from Supabase auth)

## 🎯 Error Handling

All database functions return a consistent structure:

```typescript
// Single result
interface DbResult<T> {
  data: T | null;
  error: Error | null;
}

// List result
interface DbListResult<T> {
  data: T[];
  error: Error | null;
}
```

Always check for errors:
```typescript
const { data, error } = await getUserContext();
if (error) {
  console.error('Failed:', error);
  return;
}
// Use data safely here
```

## 📝 Action Card Types

- `TODAY` - Tasks for today
- `WEEK` - This week's goals
- `AVOID` - Things to avoid
- `NEXT` - Next steps/future actions

## 📚 Example Workflow

See complete examples in [lib/db-examples.ts](lib/db-examples.ts):
- Loading coaches
- Saving user context
- Processing AI chat responses
- Managing action cards
- Full end-to-end workflow

## 🔧 TypeScript Support

Full type safety throughout:
- All functions properly typed
- Return types explicit
- Input validation via TypeScript
- Autocomplete in VS Code

## ⚡ Performance

- Indexed queries for fast lookups
- Efficient filtering at database level
- Automatic timestamp management
- Optimized for mobile/offline usage
