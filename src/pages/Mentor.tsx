import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Volume2, VolumeX, Bot, User, Sparkles, AlertCircle, RefreshCw, X } from 'lucide-react'
import { Card, Button, Badge, EmptyState, Skeleton, Select } from '../components/ui'
import { useAuthStore } from '../store'
import { cn } from '../lib/utils'
import { chatWithMentor, isAIConfigured } from '../lib/ai'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Header } from '../components/layout/Sidebar'
import type { AIMessage } from '../lib/ai'
import { Link } from 'react-router-dom'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function MentorPage() {
  const { session, profile } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your personal AI mentor. I'm here to help you with Python, DSA, AI engineering concepts, interview preparation, and your learning journey.\n\n**I can help you with:**\n- Explaining concepts at your level\n- Generating practice questions from your completed topics\n- Reviewing your code and explaining mistakes\n- Planning your learning path\n- Interview preparation\n\nWhat would you like to work on today?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const [listening, setListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechEnabled(true)
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(prev => prev + (prev ? ' ' : '') + transcript)
        setListening(false)
      }
      recognitionRef.current.onend = () => setListening(false)
      recognitionRef.current.onerror = () => setListening(false)
    }
  }, [])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Build context from user's learning data
      const { data: recentTopics } = await supabase
        .from('learning_entries')
        .select('title')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: goals } = await supabase
        .from('goals')
        .select('title')
        .eq('user_id', session!.user.id)
        .eq('status', 'active')
        .limit(5)

      const aiMessages: AIMessage[] = newMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const result = await chatWithMentor(
        aiMessages,
        {
          recentTopics: recentTopics?.map(t => t.title),
          currentGoals: goals?.map(g => g.title),
          level: 'Intermediate CS student',
        },
        session?.access_token
      )

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.success
          ? result.content
          : `I encountered an issue: ${result.error}\n\nIf the AI is not configured, you can set it up in [Settings → AI Configuration](/settings/ai).`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])

      // Log interaction
      if (session?.user.id) {
        await supabase.from('ai_interactions').insert({
          user_id: session.user.id,
          provider: result.provider,
          model: result.model,
          feature: 'mentor_chat',
          success: result.success,
          error_message: result.error || null,
        })
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceInput = () => {
    if (!speechEnabled || !recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you today?',
      timestamp: new Date(),
    }])
  }

  // Quick prompts
  const quickPrompts = [
    'Explain binary search with an example',
    'Quiz me on Python OOP concepts',
    'What should I learn next based on my goals?',
    'Help me understand time complexity',
    'Prepare me for a behavioral interview question',
    'Review my approach to a DSA problem',
  ]

  return (
    <>
      <Header title="My Mentor" subtitle="Personal AI study companion" />
      <div className="flex h-[calc(100vh-56px)]">

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!isAIConfigured && (
            <div className="mx-4 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-400 font-medium">AI not configured</p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  Configure Groq or Gemini in{' '}
                  <Link to="/settings/ai" className="underline">Settings → AI Configuration</Link>
                  {' '}to enable the mentor.
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex gap-3 max-w-3xl', msg.role === 'user' && 'ml-auto flex-row-reverse')}
              >
                {/* Avatar */}
                <div className={cn(
                  'h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold',
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-accent-600 to-electric-600 text-white'
                    : 'bg-surface-700 text-surface-200'
                )}>
                  {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Message bubble */}
                <div className={cn(
                  'rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-surface-800/60 border border-surface-700/50 text-surface-200'
                    : 'bg-accent-600 text-white'
                )}>
                  <MessageContent content={msg.content} />
                  <p className={cn(
                    'text-2xs mt-2 opacity-50',
                    msg.role === 'user' ? 'text-right' : ''
                  )}>
                    {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-3xl">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-accent-600 to-electric-600 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-surface-800/60 border border-surface-700/50 rounded-2xl px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick prompts */}
            {messages.length === 1 && (
              <div className="pt-4">
                <p className="text-xs text-surface-500 mb-3">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); }}
                      className="text-xs px-3 py-1.5 rounded-full bg-surface-800 text-surface-300 border border-surface-700 hover:border-accent-500/50 hover:text-surface-100 transition-all duration-150"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-surface-800 p-4">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={isAIConfigured ? 'Ask your mentor... (Enter to send, Shift+Enter for new line)' : 'Configure AI to start chatting'}
                  disabled={!isAIConfigured}
                  rows={1}
                  className="input pr-10 resize-none min-h-[40px] max-h-32 overflow-y-auto"
                  style={{ height: 'auto' }}
                />
              </div>
              {speechEnabled && (
                <button
                  onClick={handleVoiceInput}
                  className={cn(
                    'btn-md rounded-xl shrink-0 transition-all',
                    listening
                      ? 'bg-rose-600 text-white hover:bg-rose-500'
                      : 'btn-secondary'
                  )}
                  title={listening ? 'Stop listening' : 'Voice input'}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={handleSend}
                disabled={!input.trim() || loading || !isAIConfigured}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center mt-2 max-w-3xl mx-auto">
              <p className="text-2xs text-surface-600">
                Mentor uses your learning records for context. AI may make mistakes — verify important information.
              </p>
              <button onClick={clearChat} className="text-2xs text-surface-600 hover:text-surface-400 flex items-center gap-1">
                <RefreshCw className="h-2.5 w-2.5" /> Clear chat
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="hidden xl:flex flex-col w-72 border-l border-surface-800 p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">About My Mentor</h3>
            <p className="text-xs text-surface-500 leading-relaxed">
              My Mentor has access to your learning entries, goals, and completed topics to provide personalized guidance.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Capabilities</h3>
            <ul className="space-y-1.5">
              {[
                'Explain concepts at your level',
                'Generate practice questions',
                'Review code & explain mistakes',
                'Interview preparation',
                'Learning path recommendations',
                'Step-by-step problem solving',
              ].map(cap => (
                <li key={cap} className="flex items-center gap-1.5 text-xs text-surface-400">
                  <div className="h-1 w-1 rounded-full bg-accent-500 shrink-0" />
                  {cap}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">AI Provider</h3>
            <div className={cn(
              'p-2.5 rounded-lg text-xs',
              isAIConfigured
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            )}>
              {isAIConfigured ? '✓ AI is configured' : '⚠ AI not configured'}
              {!isAIConfigured && (
                <Link to="/settings/ai" className="block mt-1 underline">Configure →</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Simple markdown-like message renderer ────────────────────────────────────

function MessageContent({ content }: { content: string }) {
  // Convert simple markdown patterns
  const lines = content.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-current shrink-0 opacity-60" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
            </div>
          )
        }
        if (line.match(/^\d+\. /)) {
          const match = line.match(/^(\d+)\. (.*)/)
          if (match) {
            return (
              <div key={i} className="flex items-start gap-1.5">
                <span className="font-medium text-accent-400 shrink-0">{match[1]}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(match[2]) }} />
              </div>
            )
          }
        }
        if (line === '') return <div key={i} className="h-1" />
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      })}
    </div>
  )
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-surface-700 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-accent-400 hover:underline">$1</a>')
}
