/**
 * AI Provider Adapter — LifeOS AI
 * 
 * Supports:
 * 1. Google Gemini (via @google/generative-ai or REST API)
 * 2. Groq (via ultra-fast Llama 3.3 70B REST API)
 * 3. Supabase Edge Function proxy (if configured)
 * 
 * API Keys can be provided via .env (VITE_GEMINI_API_KEY / VITE_GROQ_API_KEY)
 * OR entered directly by the user in Settings (saved securely in localStorage).
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export type AIProviderType = 'groq' | 'gemini' | 'none'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AICompletionRequest {
  messages: AIMessage[]
  maxTokens?: number
  temperature?: number
  feature?: string
}

export interface AICompletionResponse {
  content: string
  provider: AIProviderType
  model: string
  success: boolean
  error?: string
}

export function getAIKey(provider: 'gemini' | 'groq'): string {
  if (provider === 'gemini') {
    return (
      (import.meta.env.VITE_GEMINI_API_KEY as string) ||
      localStorage.getItem('lifeos_gemini_api_key') ||
      ''
    )
  }
  return (
    (import.meta.env.VITE_GROQ_API_KEY as string) ||
    localStorage.getItem('lifeos_groq_api_key') ||
    ''
  )
}

export function saveAIKey(provider: 'gemini' | 'groq', key: string): void {
  if (provider === 'gemini') {
    localStorage.setItem('lifeos_gemini_api_key', key.trim())
  } else {
    localStorage.setItem('lifeos_groq_api_key', key.trim())
  }
}

export function getActiveProvider(): AIProviderType {
  const envProvider = (import.meta.env.VITE_AI_PROVIDER as AIProviderType)
  if (envProvider && envProvider !== 'none') return envProvider

  const savedProvider = localStorage.getItem('lifeos_active_ai_provider') as AIProviderType
  if (savedProvider && savedProvider !== 'none') return savedProvider

  if (getAIKey('gemini')) return 'gemini'
  if (getAIKey('groq')) return 'groq'
  return 'none'
}

export function setActiveProvider(provider: AIProviderType): void {
  localStorage.setItem('lifeos_active_ai_provider', provider)
}

export const isAIConfigured: boolean = Boolean(
  (typeof window !== 'undefined' && (localStorage.getItem('lifeos_gemini_api_key') || localStorage.getItem('lifeos_groq_api_key') || localStorage.getItem('lifeos_active_ai_provider'))) ||
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_GROQ_API_KEY ||
  (import.meta.env.VITE_AI_PROVIDER && import.meta.env.VITE_AI_PROVIDER !== 'none')
)

/**
 * Unified AI completion runner
 */
export async function generateCompletion(
  request: AICompletionRequest,
  _accessToken?: string
): Promise<AICompletionResponse> {
  const provider = getActiveProvider()

  // 1. Google Gemini Provider
  if (provider === 'gemini' || getAIKey('gemini')) {
    const apiKey = getAIKey('gemini')
    if (!apiKey) {
      return {
        content: '',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        success: false,
        error: 'Gemini API Key is missing. Please add it in Settings → AI Engine or in .env (VITE_GEMINI_API_KEY).',
      }
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Construct prompt from messages
      const systemMsg = request.messages.find(m => m.role === 'system')?.content || ''
      const conversation = request.messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n')

      const fullPrompt = systemMsg ? `[Instructions]:\n${systemMsg}\n\n[Conversation]:\n${conversation}` : conversation

      const result = await model.generateContent(fullPrompt)
      const text = result.response.text()

      return {
        content: text,
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        success: true,
      }
    } catch (err: any) {
      console.error('Gemini API call failed:', err)
      return {
        content: '',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        success: false,
        error: `Gemini Error: ${err.message || 'Failed to generate response'}`,
      }
    }
  }

  // 2. Groq Provider (Llama 3.3 70B)
  if (provider === 'groq' || getAIKey('groq')) {
    const apiKey = getAIKey('groq')
    if (!apiKey) {
      return {
        content: '',
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        success: false,
        error: 'Groq API Key is missing. Please add it in Settings → AI Engine or in .env (VITE_GROQ_API_KEY).',
      }
    }

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: request.messages,
          temperature: request.temperature ?? 0.5,
          max_tokens: request.maxTokens ?? 1500,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson?.error?.message || `Groq request returned status ${res.status}`)
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content || ''

      return {
        content,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        success: true,
      }
    } catch (err: any) {
      console.error('Groq API call failed:', err)
      return {
        content: '',
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        success: false,
        error: `Groq Error: ${err.message || 'Failed to generate response'}`,
      }
    }
  }

  return {
    content: '',
    provider: 'none',
    model: 'none',
    success: false,
    error: 'No AI API Key found. Go to Settings → AI Intelligence Engine and enter your free Google Gemini or Groq API key.',
  }
}

// ─── Specialized AI Features ────────────────────────────────────────────────

export async function generateLearningSummary(
  rawNotes: string,
  topic: string,
  accessToken?: string
): Promise<AICompletionResponse> {
  return generateCompletion({
    messages: [
      {
        role: 'system',
        content: `You are a learning assistant helping a CS student targeting SDE-1 roles.
Analyze their notes and return ONLY a valid JSON object without markdown formatting:
{
  "summary": "2-3 sentence concise summary",
  "key_concepts": ["concept1", "concept2"],
  "key_definitions": {"term": "definition"},
  "examples": ["example1"],
  "common_mistakes": ["mistake1"],
  "interview_takeaways": ["takeaway1"],
  "follow_up_actions": ["action1"],
  "flashcard_pairs": [{"front": "Q", "back": "A"}]
}`,
      },
      {
        role: 'user',
        content: `Topic: ${topic}\n\nMy learning notes:\n${rawNotes}`,
      },
    ],
    maxTokens: 2000,
    temperature: 0.3,
    feature: 'learning_summary',
  }, accessToken)
}

export async function generateRevisionQuestions(
  concepts: string[],
  previousMistakes: string[],
  accessToken?: string
): Promise<AICompletionResponse> {
  return generateCompletion({
    messages: [
      {
        role: 'system',
        content: `You are a revision assistant. Generate 3 spaced repetition interview questions based on concepts.
Return ONLY a valid JSON array:
[{"question": "...", "type": "short_answer", "difficulty": "medium", "answer": "...", "explanation": "..."}]`,
      },
      {
        role: 'user',
        content: `Concepts: ${concepts.join(', ')}\nMistakes: ${previousMistakes.join(', ')}`,
      },
    ],
    maxTokens: 1500,
    temperature: 0.4,
    feature: 'revision_questions',
  }, accessToken)
}

export async function generateDailyPlan(
  goals: string[],
  pendingTasks: string[],
  dueRevisions: number,
  availableHours: number,
  accessToken?: string
): Promise<AICompletionResponse> {
  return generateCompletion({
    messages: [
      {
        role: 'system',
        content: `You are a personal AI coach. Create a realistic daily study briefing for today.
Return a 2-3 sentence inspiring, actionable briefing highlighting top priority focus areas.`,
      },
      {
        role: 'user',
        content: `Goals: ${goals.join(', ')}\nPending tasks: ${pendingTasks.join(', ')}\nDue revisions: ${dueRevisions}\nAvailable hours: ${availableHours}`,
      },
    ],
    maxTokens: 500,
    temperature: 0.5,
    feature: 'daily_plan',
  }, accessToken)
}

export async function chatWithMentor(
  messages: AIMessage[],
  userContext: {
    recentTopics?: string[]
    currentGoals?: string[]
    level?: string
  },
  accessToken?: string
): Promise<AICompletionResponse> {
  const systemMessage: AIMessage = {
    role: 'system',
    content: `You are "My Mentor" — an expert AI study companion and engineering coach.
User Context:
- Targeting SDE-1 at Google, Microsoft, Amazon
- Focused on: Python, DSA, System Design, German & Spoken English
- Recent topics: ${userContext.recentTopics?.join(', ') || 'General SDE prep'}
- Current goals: ${userContext.currentGoals?.join(', ') || 'Placements 2027'}

Personality:
- Encouraging, concise, clear, and Socratic.
- For coding questions, explain intuition, time complexity, and edge cases.`,
  }

  return generateCompletion({
    messages: [systemMessage, ...messages],
    maxTokens: 1000,
    temperature: 0.7,
    feature: 'mentor_chat',
  }, accessToken)
}

export async function generateGermanExercise(
  level: string,
  topic: string,
  accessToken?: string
): Promise<AICompletionResponse> {
  return generateCompletion({
    messages: [
      {
        role: 'system',
        content: `Generate a German language exercise for level ${level}. Respond with a JSON object:
{
  "instruction": "What to do",
  "content": "The exercise sentence or prompt",
  "hints": ["hint1"],
  "answer": "correct answer",
  "explanation_en": "English explanation"
}`,
      },
      {
        role: 'user',
        content: `Level: ${level}, Topic: ${topic}`,
      },
    ],
    maxTokens: 800,
    temperature: 0.4,
    feature: 'german_exercise',
  }, accessToken)
}

export async function analyzeEnglishSpeech(
  transcript: string,
  mode: string,
  accessToken?: string
): Promise<AICompletionResponse> {
  return generateCompletion({
    messages: [
      {
        role: 'system',
        content: `You are an English speaking coach. Analyze the transcript and provide feedback in JSON:
{
  "overall_score": 85,
  "grammar_corrections": [{"original": "...", "corrected": "...", "explanation": "..."}],
  "better_alternatives": [{"phrase": "...", "alternative": "...", "reason": "..."}],
  "vocabulary_suggestions": ["word1", "word2"],
  "fluency_feedback": "...",
  "positive_highlights": ["..."],
  "practice_phrases": ["..."]
}`,
      },
      {
        role: 'user',
        content: `Mode: ${mode}\n\nTranscript:\n${transcript}`,
      },
    ],
    maxTokens: 1000,
    temperature: 0.3,
    feature: 'english_analysis',
  }, accessToken)
}
