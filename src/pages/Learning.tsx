import React, { useState, useEffect, useCallback } from 'react'
import { Plus, BookOpen, Brain, Sparkles, ChevronRight, Clock, CheckCircle2, Edit3, Trash2, Loader2 } from 'lucide-react'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, Skeleton, ProgressBar } from '../components/ui'
import { useAuthStore } from '../store'
import { supabase } from '../lib/supabase'
import { cn, formatDuration } from '../lib/utils'
import { generateLearningSummary } from '../lib/ai'
import { toast } from 'sonner'
import type { LearningEntry, Category, Flashcard } from '../types/database.types'
import { Header } from '../components/layout/Sidebar'
import { format } from 'date-fns'
import { isAIConfigured } from '../lib/ai'

export function LearningPage() {
  const { session } = useAuthStore()
  const [entries, setEntries] = useState<LearningEntry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; entry: LearningEntry | null }>({ open: false, entry: null })
  const [selected, setSelected] = useState<LearningEntry | null>(null)
  const [aiProcessing, setAiProcessing] = useState(false)

  const load = useCallback(async () => {
    if (!session?.user.id) return
    setLoading(true)
    const [{ data: e }, { data: c }] = await Promise.all([
      supabase.from('learning_entries').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', session.user.id).order('order_index'),
    ])
    setEntries(e || [])
    setCategories(c || [])
    setLoading(false)
  }, [session?.user.id])

  useEffect(() => { load() }, [load])

  const handleProcessWithAI = async (entry: LearningEntry) => {
    if (!isAIConfigured) {
      toast.error('AI not configured. Set up your AI API key in Settings.')
      return
    }
    setAiProcessing(true)
    try {
      const result = await generateLearningSummary(entry.raw_notes, entry.title, session?.access_token)
      if (!result.success) throw new Error(result.error)

      let parsed: any = {}
      try {
        parsed = JSON.parse(result.content)
      } catch {
        parsed = { summary: result.content }
      }

      // Update the learning entry with AI-generated content
      const { error: updateError } = await supabase.from('learning_entries').update({
        ai_summary: parsed.summary || null,
        key_concepts: parsed.key_concepts || [],
        key_definitions: parsed.key_definitions || {},
        examples: parsed.examples || [],
        common_mistakes: parsed.common_mistakes || [],
        interview_takeaways: parsed.interview_takeaways || [],
        follow_up_actions: parsed.follow_up_actions || [],
        ai_processed: true,
        ai_processed_at: new Date().toISOString(),
      }).eq('id', entry.id)

      if (updateError) throw updateError

      // Create flashcards
      if (parsed.flashcard_pairs?.length) {
        const flashcards = parsed.flashcard_pairs.map((fp: any) => ({
          learning_entry_id: entry.id,
          user_id: session!.user.id,
          front: fp.front,
          back: fp.back,
          category_id: entry.category_id,
          tags: [],
          difficulty: 'intermediate',
          ease_factor: 2.5,
          interval_days: 1,
          review_count: 0,
          next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }))
        await supabase.from('flashcards').insert(flashcards)
      }

      toast.success(`AI processed! Created ${parsed.flashcard_pairs?.length || 0} flashcards.`)
      await load()
      if (selected?.id === entry.id) {
        const { data } = await supabase.from('learning_entries').select('*').eq('id', entry.id).single()
        if (data) setSelected(data)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI processing failed')
    } finally {
      setAiProcessing(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('learning_entries').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setEntries(e => e.filter(x => x.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success('Entry deleted')
  }

  const categoryMap = new Map(categories.map(c => [c.id, c]))

  return (
    <>
      <Header title="Learning Memory" subtitle="Capture knowledge and let AI process it" />
      <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">

        {/* Entry list */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-surface-800 flex flex-col">
          <div className="p-3 border-b border-surface-800">
            <Button
              variant="primary"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => setModal({ open: true, entry: null })}
            >
              <Plus className="h-3.5 w-3.5" /> New Learning Entry
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : entries.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title="No learning entries yet"
                description="Capture what you learn — the AI will help you remember it"
                action={<Button variant="primary" size="sm" onClick={() => setModal({ open: true, entry: null })}>Add First Entry</Button>}
              />
            ) : (
              entries.map(entry => {
                const cat = entry.category_id ? categoryMap.get(entry.category_id) : null
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all duration-150',
                      selected?.id === entry.id
                        ? 'border-accent-500/50 bg-accent-500/5'
                        : 'border-surface-800 bg-surface-900/40 hover:border-surface-700'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-surface-100 leading-snug line-clamp-2">
                        {entry.title}
                      </p>
                      {entry.ai_processed && (
                        <span className="ai-badge shrink-0">AI</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-2xs text-surface-500">
                      {cat && (
                        <span style={{ color: cat.color }}>{cat.icon}</span>
                      )}
                      <span>{format(new Date(entry.created_at), 'd MMM')}</span>
                      {entry.key_concepts.length > 0 && (
                        <span>{entry.key_concepts.length} concepts</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Entry detail */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon={<Brain className="h-12 w-12 text-accent-400" />}
                title="Select a learning entry"
                description="Click on an entry to view its details and AI-generated materials"
              />
            </div>
          ) : (
            <div className="p-6 max-w-3xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold font-display text-surface-50">{selected.title}</h2>
                  <p className="text-xs text-surface-500 mt-1">
                    {format(new Date(selected.created_at), 'd MMMM yyyy, h:mm a')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setModal({ open: true, entry: selected })}
                    className="gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  {!selected.ai_processed && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleProcessWithAI(selected)}
                      loading={aiProcessing}
                      className="gap-1.5"
                      disabled={!isAIConfigured}
                      title={!isAIConfigured ? 'Configure AI in Settings to enable this' : ''}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {isAIConfigured ? 'Process with AI' : 'AI Not Configured'}
                    </Button>
                  )}
                  {selected.ai_processed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProcessWithAI(selected)}
                      loading={aiProcessing}
                      className="gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Reprocess
                    </Button>
                  )}
                </div>
              </div>

              {/* Raw notes */}
              <Card padded={false}>
                <div className="p-4 border-b border-surface-800">
                  <h3 className="text-sm font-semibold text-surface-200">My Notes</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
                    {selected.raw_notes}
                  </p>
                </div>
              </Card>

              {/* AI Summary */}
              {selected.ai_summary && (
                <Card padded={false}>
                  <div className="flex items-center gap-2 p-4 border-b border-surface-800">
                    <Sparkles className="h-4 w-4 text-accent-400" />
                    <h3 className="text-sm font-semibold text-surface-200">AI Summary</h3>
                    <span className="ai-badge ml-1">AI Generated</span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-surface-300 leading-relaxed">{selected.ai_summary}</p>
                  </div>
                </Card>
              )}

              {/* Key Concepts */}
              {selected.key_concepts.length > 0 && (
                <Card padded={false}>
                  <div className="p-4 border-b border-surface-800">
                    <h3 className="text-sm font-semibold text-surface-200">Key Concepts</h3>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {selected.key_concepts.map((concept, i) => (
                      <span key={i} className="badge-accent text-xs">{concept}</span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Interview Takeaways */}
              {selected.interview_takeaways.length > 0 && (
                <Card padded={false}>
                  <div className="p-4 border-b border-surface-800">
                    <h3 className="text-sm font-semibold text-surface-200 flex items-center gap-2">
                      🎯 Interview Takeaways
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {selected.interview_takeaways.map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-accent-500 font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
                        <p className="text-sm text-surface-300">{t}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Common Mistakes */}
              {selected.common_mistakes.length > 0 && (
                <Card padded={false}>
                  <div className="p-4 border-b border-surface-800">
                    <h3 className="text-sm font-semibold text-surface-200 flex items-center gap-2">
                      ⚠️ Common Mistakes to Avoid
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {selected.common_mistakes.map((m, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                        <span className="text-rose-400 font-bold text-xs shrink-0 mt-0.5">!</span>
                        <p className="text-sm text-surface-300">{m}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Follow-up Actions */}
              {selected.follow_up_actions.length > 0 && (
                <Card padded={false}>
                  <div className="p-4 border-b border-surface-800">
                    <h3 className="text-sm font-semibold text-surface-200">📋 Follow-up Actions</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {selected.follow_up_actions.map((action, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-accent-500 shrink-0" />
                        <p className="text-sm text-surface-300">{action}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Delete button */}
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(selected.id)}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Entry
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <LearningModal
        open={modal.open}
        entry={modal.entry}
        categories={categories}
        onClose={() => setModal({ open: false, entry: null })}
        onSave={async (saved) => {
          await load()
          setSelected(saved)
          setModal({ open: false, entry: null })
        }}
        userId={session?.user.id}
      />
    </>
  )
}

// ─── Learning Entry Modal ────────────────────────────────────────────────────────

function LearningModal({ open, entry, categories, onClose, onSave, userId }: {
  open: boolean
  entry: LearningEntry | null
  categories: Category[]
  onClose: () => void
  onSave: (saved: LearningEntry) => void
  userId?: string
}) {
  const [form, setForm] = useState({ title: '', raw_notes: '', category_id: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (entry) {
      setForm({ title: entry.title, raw_notes: entry.raw_notes, category_id: entry.category_id || '' })
    } else {
      setForm({ title: '', raw_notes: '', category_id: '' })
    }
  }, [entry, open])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.raw_notes.trim() || !userId) return
    setLoading(true)
    try {
      const payload = {
        user_id: userId,
        title: form.title.trim(),
        raw_notes: form.raw_notes.trim(),
        category_id: form.category_id || null,
        key_concepts: [],
        examples: [],
        common_mistakes: [],
        interview_takeaways: [],
        follow_up_actions: [],
        ai_processed: false,
      }
      if (entry) {
        const { data, error } = await supabase.from('learning_entries').update(payload).eq('id', entry.id).select().single()
        if (error) throw error
        toast.success('Entry updated!')
        onSave(data)
      } else {
        const { data, error } = await supabase.from('learning_entries').insert(payload).select().single()
        if (error) throw error
        toast.success('Learning entry saved!')
        onSave(data)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Edit Learning Entry' : 'New Learning Entry'} size="lg">
      <div className="space-y-4">
        <Input
          label="Topic / Title *"
          placeholder="What did you learn? e.g. 'Binary Search Trees in Python'"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />
        <Select
          label="Category"
          value={form.category_id}
          onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
          options={[{ value: '', label: 'No category' }, ...categories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))]}
        />
        <Textarea
          label="Your Notes *"
          placeholder="Write what you learned, what confused you, what you implemented, code snippets, insights, links, anything..."
          value={form.raw_notes}
          onChange={e => setForm(f => ({ ...f, raw_notes: e.target.value }))}
          rows={10}
          hint="Be detailed — the AI will process your notes into structured learning materials, flashcards, and quiz questions"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
            {entry ? 'Save Changes' : 'Save & Process'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
