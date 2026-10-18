import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, CheckSquare, FolderKanban, Languages, Lightbulb, Bug, Bookmark } from 'lucide-react'
import { Modal, Button, Input, Textarea, Select, Badge } from '../ui'
import { useUIStore, useAuthStore } from '../../store'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'

type CaptureType = 'task' | 'learning' | 'project_idea' | 'word' | 'bug' | 'bookmark' | 'question'

const CAPTURE_TYPES: { id: CaptureType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'task', label: 'Task', icon: <CheckSquare className="h-4 w-4" />, color: 'badge-accent' },
  { id: 'learning', label: 'Learning', icon: <BookOpen className="h-4 w-4" />, color: 'badge-blue' },
  { id: 'project_idea', label: 'Project Idea', icon: <FolderKanban className="h-4 w-4" />, color: 'badge-green' },
  { id: 'word', label: 'Word/Phrase', icon: <Languages className="h-4 w-4" />, color: 'badge-yellow' },
  { id: 'bug', label: 'Bug', icon: <Bug className="h-4 w-4" />, color: 'badge-red' },
  { id: 'bookmark', label: 'Resource', icon: <Bookmark className="h-4 w-4" />, color: 'badge-gray' },
  { id: 'question', label: 'Question', icon: <Lightbulb className="h-4 w-4" />, color: 'badge-yellow' },
]

export function QuickAdd() {
  const { quickAddOpen, setQuickAddOpen } = useUIStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [type, setType] = useState<CaptureType>('task')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setTitle('')
    setNotes('')
    setType('task')
  }

  const handleClose = () => {
    setQuickAddOpen(false)
    reset()
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!user) {
      toast.error('Please sign in to save items')
      return
    }

    setLoading(true)
    try {
      if (type === 'task') {
        const { error } = await supabase.from('tasks').insert({
          user_id: user.id,
          title: title.trim(),
          description: notes.trim() || null,
          status: 'todo',
          priority: 'medium',
          tags: [],
          resources: [],
          actual_duration_mins: 0,
          order_index: 0,
          is_recurring: false,
        })
        if (error) throw error
        toast.success('Task added!')
        navigate('/tasks')
      } else if (type === 'learning') {
        const { error } = await supabase.from('learning_entries').insert({
          user_id: user.id,
          title: title.trim(),
          raw_notes: notes.trim() || title.trim(),
          key_concepts: [],
          examples: [],
          common_mistakes: [],
          interview_takeaways: [],
          follow_up_actions: [],
          ai_processed: false,
        })
        if (error) throw error
        toast.success('Learning entry saved!')
        navigate('/learning')
      } else {
        // Generic quick-capture as task with appropriate tags
        const { error } = await supabase.from('tasks').insert({
          user_id: user.id,
          title: title.trim(),
          description: notes.trim() || null,
          status: 'todo',
          priority: 'low',
          tags: [type],
          resources: [],
          actual_duration_mins: 0,
          order_index: 0,
          is_recurring: false,
          notes: `Quick capture type: ${type}`,
        })
        if (error) throw error
        toast.success('Captured!')
      }
      handleClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={quickAddOpen}
      onClose={handleClose}
      title="Quick Capture"
      description="Capture anything instantly — tasks, ideas, words, bugs"
      size="md"
    >
      <div className="space-y-4">
        {/* Type selector */}
        <div>
          <p className="label mb-2">What are you capturing?</p>
          <div className="flex flex-wrap gap-2">
            {CAPTURE_TYPES.map((ct) => (
              <button
                key={ct.id}
                onClick={() => setType(ct.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                  type === ct.id
                    ? 'border-accent-500 bg-accent-500/10 text-accent-300'
                    : 'border-surface-700 text-surface-400 hover:border-surface-600 hover:text-surface-300'
                }`}
              >
                {ct.icon}
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Title"
          placeholder={`${type === 'word' ? 'Word or phrase...' : type === 'bug' ? 'Bug description...' : 'What do you want to capture?'}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && notes === '') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          autoFocus
        />

        <Textarea
          label="Notes (optional)"
          placeholder="Add context, details, or a link..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
