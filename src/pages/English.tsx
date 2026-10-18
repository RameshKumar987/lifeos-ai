import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Send, Play, Pause, Square, MessageCircle, ChevronRight, Star, BookOpen } from 'lucide-react'
import { Card, Button, Select, Tabs, EmptyState, Badge } from '../components/ui'
import { useAuthStore } from '../store'
import { analyzeEnglishSpeech, isAIConfigured } from '../lib/ai'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { Header } from '../components/layout/Sidebar'
import { Link } from 'react-router-dom'

const PRACTICE_MODES = [
  { id: 'daily_conversation', label: 'Daily Conversation' },
  { id: 'job_interview', label: 'Job Interview' },
  { id: 'technical_discussion', label: 'Technical Discussion' },
  { id: 'project_explanation', label: 'Project Explanation' },
  { id: 'hr_interview', label: 'HR Interview' },
  { id: 'ielts_speaking', label: 'IELTS Speaking' },
  { id: 'vocabulary_practice', label: 'Vocabulary Practice' },
  { id: 'grammar_correction', label: 'Grammar Correction Mode' },
  { id: 'spontaneous', label: 'Spontaneous Conversation' },
]

interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

export function EnglishPage() {
  const { session } = useAuthStore()
  const [activeTab, setActiveTab] = useState('practice')
  const [mode, setMode] = useState('daily_conversation')
  const [sessionActive, setSessionActive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speechAvailable = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
  const ttsAvailable = !!window.speechSynthesis

  useEffect(() => {
    if (session?.user.id) loadSessions()
  }, [session?.user.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    const { data } = await supabase
      .from('english_sessions')
      .select('*')
      .eq('user_id', session!.user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setSessions(data || [])
  }

  const setupSpeechRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return null
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + (prev ? ' ' : '') + transcript)
      setListening(false)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    return rec
  }

  const startSession = async () => {
    if (!session?.user.id) return
    const { data } = await supabase.from('english_sessions').insert({
      user_id: session.user.id,
      mode,
      transcript: [],
      duration_secs: 0,
    }).select().single()
    if (data) setSessionId(data.id)
    setMessages([{
      role: 'ai',
      content: getSessionOpener(mode),
      timestamp: new Date(),
    }])
    setSessionActive(true)
  }

  const endSession = async () => {
    setSessionActive(false)
    if (!sessionId || messages.length < 2) return

    // Generate feedback
    if (isAIConfigured) {
      const transcript = messages.map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`).join('\n')
      setLoading(true)
      try {
        const result = await analyzeEnglishSpeech(transcript, mode, session?.access_token)
        if (result.success) {
          try {
            const parsed = JSON.parse(result.content)
            setAnalysis(parsed)
            await supabase.from('english_sessions').update({
              transcript: messages,
              feedback: parsed,
              duration_secs: Math.round((Date.now() - messages[0].timestamp.getTime()) / 1000),
              grammar_score: parsed.overall_score,
            }).eq('id', sessionId)
          } catch {
            setAnalysis({ summary: result.content })
          }
        }
      } finally {
        setLoading(false)
      }
    }
    await loadSessions()
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { chatWithMentor } = await import('../lib/ai')
      const aiMessages = messages.concat(userMessage).slice(-6).map(m => ({
        role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }))

      const result = await chatWithMentor(
        [
          {
            role: 'system',
            content: `You are an English speaking practice partner in ${mode} mode. 
            Engage naturally in conversation. Keep responses concise (2-4 sentences).
            In ${mode === 'grammar_correction' ? 'grammar correction' : 'free conversation'} mode.
            ${mode === 'grammar_correction' ? 'After responding, note any grammar mistakes the user made.' : ''}
            Current mode: ${PRACTICE_MODES.find(m2 => m2.id === mode)?.label}`,
          },
          ...aiMessages,
        ],
        {},
        session?.access_token
      )

      const aiResponse: Message = {
        role: 'ai',
        content: result.success ? result.content : 'I had trouble responding. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiResponse])

      // TTS
      if (ttsEnabled && ttsAvailable && result.success) {
        const utterance = new SpeechSynthesisUtterance(result.content.replace(/[*_`]/g, ''))
        utterance.lang = 'en-US'
        utterance.rate = 0.9
        window.speechSynthesis.speak(utterance)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
    } else {
      const rec = setupSpeechRecognition()
      if (rec) {
        recognitionRef.current = rec
        rec.start()
        setListening(true)
      } else {
        toast.error('Speech recognition not supported in this browser')
      }
    }
  }

  function getSessionOpener(mode: string): string {
    const openers: Record<string, string> = {
      daily_conversation: "Hi! Let's have a casual conversation to practice your English. How was your day today?",
      job_interview: "Welcome! I'll be interviewing you for a Software Engineer position today. Let's start — can you tell me about yourself and your background?",
      technical_discussion: "Let's discuss some technical topics. What technology or concept would you like to explain or explore today?",
      project_explanation: "Please explain one of your current or past projects to me as if I'm a non-technical stakeholder.",
      hr_interview: "Hello! This is an HR round. Tell me about your strengths and how you handle challenges.",
      ielts_speaking: "Welcome to IELTS Speaking Part 1. I'll ask you some questions about familiar topics. Are you ready?",
      vocabulary_practice: "Let's practice vocabulary! I'll use some words in context and you should try using them in your responses.",
      grammar_correction: "Let's chat freely. I'll note any grammar mistakes in my responses to help you improve.",
      spontaneous: "Let's talk! Share something interesting that happened recently or something you've been thinking about.",
    }
    return openers[mode] || "Let's practice your English! How can I help you today?"
  }

  const tabs = [
    { id: 'practice', label: 'Practice' },
    { id: 'history', label: 'History', count: sessions.length },
  ]

  return (
    <>
      <Header title="English Lab" subtitle="Practice speaking, listening, and communication" />
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'practice' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Session controls */}
            <Card className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-surface-200 mb-4">Practice Setup</h3>
              <div className="space-y-4">
                <Select
                  label="Practice Mode"
                  value={mode}
                  onChange={e => setMode(e.target.value)}
                  options={PRACTICE_MODES.map(m => ({ value: m.id, label: m.label }))}
                  disabled={sessionActive}
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-400">Speech Input</span>
                  <span className={cn('text-xs', speechAvailable ? 'text-emerald-400' : 'text-rose-400')}>
                    {speechAvailable ? '✓ Available' : '✗ Not supported'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-400">Text-to-Speech</span>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs', ttsAvailable ? 'text-emerald-400' : 'text-rose-400')}>
                      {ttsAvailable ? '✓ Available' : '✗ Not supported'}
                    </span>
                    {ttsAvailable && (
                      <button
                        onClick={() => setTtsEnabled(!ttsEnabled)}
                        className={cn('text-xs underline', ttsEnabled ? 'text-emerald-400' : 'text-surface-500')}
                      >
                        {ttsEnabled ? 'On' : 'Off'}
                      </button>
                    )}
                  </div>
                </div>

                {!isAIConfigured && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400">AI not configured — responses won't be generated</p>
                    <Link to="/settings/ai" className="text-xs text-amber-300 underline">Configure →</Link>
                  </div>
                )}

                {!sessionActive ? (
                  <Button variant="primary" className="w-full gap-2" onClick={startSession}>
                    <Play className="h-4 w-4" /> Start Session
                  </Button>
                ) : (
                  <Button variant="danger" className="w-full gap-2" onClick={endSession}>
                    <Square className="h-4 w-4" /> End Session
                  </Button>
                )}
              </div>

              {/* Analysis results */}
              {analysis && (
                <div className="mt-4 pt-4 border-t border-surface-800 space-y-3">
                  <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Session Feedback</h4>
                  {analysis.overall_score !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-surface-50">{analysis.overall_score}</span>
                      <span className="text-xs text-surface-500">/100</span>
                    </div>
                  )}
                  {analysis.fluency_feedback && (
                    <p className="text-xs text-surface-400">{analysis.fluency_feedback}</p>
                  )}
                  {analysis.positive_highlights?.length > 0 && (
                    <div>
                      <p className="text-2xs text-emerald-400 font-medium mb-1">What went well:</p>
                      {analysis.positive_highlights.map((h: string, i: number) => (
                        <p key={i} className="text-2xs text-surface-400">• {h}</p>
                      ))}
                    </div>
                  )}
                  {analysis.grammar_corrections?.length > 0 && (
                    <div>
                      <p className="text-2xs text-amber-400 font-medium mb-1">Grammar corrections:</p>
                      {analysis.grammar_corrections.slice(0, 3).map((c: any, i: number) => (
                        <div key={i} className="text-2xs text-surface-500 mb-1">
                          <span className="line-through text-rose-400">{c.original}</span>
                          {' → '}
                          <span className="text-emerald-400">{c.corrected}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Conversation */}
            <Card padded={false} className="lg:col-span-2 flex flex-col min-h-96">
              {!sessionActive && messages.length === 0 ? (
                <EmptyState
                  icon={<MessageCircle className="h-10 w-10 text-blue-400" />}
                  title="Start a practice session"
                  description="Choose a mode and click 'Start Session' to begin practicing your English"
                />
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                          msg.role === 'user'
                            ? 'bg-accent-600 text-white'
                            : 'bg-surface-800 text-surface-200 border border-surface-700'
                        )}>
                          {msg.content}
                          <p className="text-2xs opacity-50 mt-1 text-right">
                            {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-surface-800 rounded-2xl px-3 py-2 border border-surface-700">
                          <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {sessionActive && (
                    <div className="border-t border-surface-800 p-3 flex gap-2">
                      {speechAvailable && (
                        <button
                          onClick={toggleVoice}
                          className={cn('btn-md rounded-xl shrink-0', listening ? 'bg-rose-600 text-white' : 'btn-secondary')}
                        >
                          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>
                      )}
                      <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your response..."
                        className="input flex-1 h-9 text-sm"
                        disabled={loading}
                      />
                      <Button variant="primary" size="md" onClick={sendMessage} disabled={!input.trim() || loading} className="shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <EmptyState
                title="No sessions yet"
                description="Complete a practice session to see your history"
              />
            ) : (
              sessions.map(s => (
                <Card key={s.id} hoverable>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-200">
                        {PRACTICE_MODES.find(m => m.id === s.mode)?.label || s.mode}
                      </p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {s.duration_secs && ` • ${Math.ceil(s.duration_secs / 60)}m`}
                      </p>
                    </div>
                    {s.grammar_score && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-surface-50">{s.grammar_score}</p>
                        <p className="text-2xs text-surface-500">score</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}
