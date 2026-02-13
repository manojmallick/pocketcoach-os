import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  coach_slug: string
  message: string
  demo_mode?: boolean
}

interface ActionCard {
  type: 'TODAY' | 'WEEK' | 'AVOID' | 'NEXT'
  title: string
  why: string
  steps: string[]
  time_min: number
}

interface ChatResponse {
  cards: ActionCard[]
  weekly_plan: string[]
  coach_notes: string
}

// Deterministic fallback response
const FALLBACK_RESPONSE: ChatResponse = {
  cards: [
    {
      type: 'TODAY',
      title: 'Morning Focus Block',
      why: 'Starting your day with focused work ensures you make progress on what matters most before distractions arise.',
      steps: [
        'Close email and non-essential apps',
        'Set timer for 90 minutes',
        'Work on your top priority task',
        'Take a 15-minute break when done'
      ],
      time_min: 90
    },
    {
      type: 'TODAY',
      title: 'Priority Planning',
      why: 'Clear priorities prevent reactive work and keep you aligned with your goals.',
      steps: [
        'Review your key objectives',
        'Identify 3 most important tasks',
        'Schedule them in your calendar',
        'Say no to non-essential requests'
      ],
      time_min: 15
    },
    {
      type: 'WEEK',
      title: 'Weekly Review',
      why: 'Regular reflection helps you learn from experience and adjust your approach.',
      steps: [
        'Review what you accomplished',
        'Note what worked well',
        'Identify improvements',
        'Plan next week\'s priorities'
      ],
      time_min: 30
    },
    {
      type: 'AVOID',
      title: 'Avoid Email Until Priorities Done',
      why: 'Email is often urgent but not important. Tackle your priorities first to be proactive, not reactive.',
      steps: [
        'Keep email closed until after focus work',
        'Batch email processing',
        'Use templates for common replies',
        'Unsubscribe from low-value messages'
      ],
      time_min: 0
    }
  ],
  weekly_plan: [
    'Block 90 minutes each morning for deep work',
    'Schedule weekly review every Friday',
    'Batch communication into specific time slots',
    'Protect focus time by declining non-essential meetings'
  ],
  coach_notes: 'I\'ve created a balanced action plan focused on protecting your most valuable resource: focused time. Start with the morning focus block tomorrow, and build from there. Remember, consistency beats perfection. You\'ve got this!'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body first — demo mode doesn't need auth
    const reqData: ChatRequest = await req.json()
    const { coach_slug, message, demo_mode = false } = reqData

    if (!coach_slug || !message) {
      throw new Error('Missing required fields: coach_slug and message')
    }

    // If demo mode, return fallback immediately (no auth required)
    if (demo_mode) {
      return new Response(
        JSON.stringify(FALLBACK_RESPONSE),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
    
    if (authError || !user) {
      throw new Error('Invalid authorization token')
    }

    // Load user context
    const { data: userContext } = await supabaseClient
      .from('user_contexts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Load coach template
    const { data: coachTemplate, error: coachError } = await supabaseClient
      .from('coach_templates')
      .select('*')
      .eq('slug', coach_slug)
      .single()

    if (coachError || !coachTemplate) {
      throw new Error('Coach template not found')
    }

    // Build context for prompt
    const userContextStr = userContext ? `
User's Context:
- Current Role: ${userContext.current_role || 'Not specified'}
- Goals: ${userContext.goals || 'Not specified'}
- Challenges: ${userContext.challenges || 'Not specified'}
- Work Style: ${userContext.work_style || 'Not specified'}
- Available Time: ${userContext.available_time_per_day || 'Not specified'} minutes per day
    `.trim() : 'No user context available'

    // Build prompt that forces strict JSON
    const prompt = `You are ${coachTemplate.name}: ${coachTemplate.description}

${coachTemplate.system_prompt || ''}

${userContextStr}

User's Message: "${message}"

CRITICAL: You MUST respond with ONLY valid JSON in this EXACT format (no markdown, no code blocks, no explanations):
{
  "cards": [
    {
      "type": "TODAY",
      "title": "Action card title",
      "why": "Brief explanation of why this matters",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "time_min": 30
    }
  ],
  "weekly_plan": ["Weekly strategy point 1", "Weekly strategy point 2"],
  "coach_notes": "Personalized coaching message"
}

Rules:
- type must be one of: TODAY, WEEK, AVOID, NEXT
- Include 3-5 action cards
- time_min should be realistic (0-180 minutes)
- steps array should have 3-5 concrete steps
- Coach notes should be encouraging and personalized
- Return ONLY the JSON object, nothing else`

    // Call Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not set, using fallback')
      return new Response(
        JSON.stringify(FALLBACK_RESPONSE),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text())
      return new Response(
        JSON.stringify(FALLBACK_RESPONSE),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const geminiData = await geminiResponse.json()
    const generatedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON from response
    let chatResponse: ChatResponse
    try {
      // Extract JSON between first { and last }
      const firstBrace = generatedText.indexOf('{')
      const lastBrace = generatedText.lastIndexOf('}')
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON found in response')
      }

      const jsonStr = generatedText.substring(firstBrace, lastBrace + 1)
      const parsed = JSON.parse(jsonStr)

      // Validate structure
      if (!parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
        throw new Error('Invalid cards array')
      }
      if (!parsed.weekly_plan || !Array.isArray(parsed.weekly_plan)) {
        throw new Error('Invalid weekly_plan array')
      }
      if (typeof parsed.coach_notes !== 'string') {
        throw new Error('Invalid coach_notes')
      }

      // Validate each card
      for (const card of parsed.cards) {
        if (!['TODAY', 'WEEK', 'AVOID', 'NEXT'].includes(card.type)) {
          throw new Error('Invalid card type')
        }
        if (!card.title || !card.why || !Array.isArray(card.steps) || typeof card.time_min !== 'number') {
          throw new Error('Invalid card structure')
        }
      }

      chatResponse = parsed
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      chatResponse = FALLBACK_RESPONSE
    }

    // Insert chat session
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        coach_slug: coach_slug,
        user_message: message
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Failed to insert chat session:', sessionError)
      // Still return response even if DB insert fails
      return new Response(
        JSON.stringify(chatResponse),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Insert action cards
    const cardsToInsert = chatResponse.cards.map(card => ({
      session_id: sessionData.id,
      user_id: user.id,
      type: card.type,
      title: card.title,
      why: card.why,
      steps: card.steps,
      time_min: card.time_min,
      status: 'active'
    }))

    const { error: cardsError } = await supabaseClient
      .from('action_cards')
      .insert(cardsToInsert)

    if (cardsError) {
      console.error('Failed to insert action cards:', cardsError)
      // Still return response even if DB insert fails
    }

    // Return successful response
    return new Response(
      JSON.stringify(chatResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in chat function:', error)
    
    // Always return valid JSON response, never break contract
    return new Response(
      JSON.stringify(FALLBACK_RESPONSE),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }
})
