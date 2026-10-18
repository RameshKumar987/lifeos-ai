import React, { useState } from 'react'
import {
  Bell, Plus, CheckCircle2, Clock, Calendar, AlertCircle, Trash2,
  Sparkles, Check, ChevronRight
} from 'lucide-react'
import { Header } from '../components/layout/Sidebar'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState } from '../components/ui'
import { toast } from 'sonner'

interface ReminderItem {
  id: string
  title: string
  description?: string
  remind_at: string
  category: 'study' | 'revision' | 'deadline' | 'custom'
  is_active: boolean
}

const INITIAL_REMINDERS: ReminderItem[] = []

export function Reminders() {
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const saved = localStorage.getItem('lifeos_reminders')
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS
  })
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [remindAt, setRemindAt] = useState('')
  const [category, setCategory] = useState<ReminderItem['category']>('study')

  const handleToggle = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r))
    toast.success('Reminder updated')
  }

  const handleDelete = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id))
    toast.success('Reminder deleted')
  }

  const handleAdd = () => {
    if (!title.trim() || !remindAt) {
      toast.error('Please specify title and reminder time')
      return
    }

    const newR: ReminderItem = {
      id: `r-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      remind_at: remindAt,
      category,
      is_active: true,
    }

    setReminders([newR, ...reminders])
    localStorage.setItem('lifeos_reminders', JSON.stringify([newR, ...reminders]))
    setIsAddModalOpen(false)
    setTitle('')
    setDescription('')
    setRemindAt('')
    toast.success('Reminder scheduled!')
  }

  return (
    <div className="min-h-full flex flex-col bg-surface-950">
      <Header
        title="Reminders & Alerts"
        subtitle="Stay consistent with scheduled notifications for reviews, deadlines, and focus sessions"
        actions={
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>New Reminder</span>
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-10 w-10 text-surface-600" />}
              title="No active reminders"
              description="Schedule reminders for your daily study habits, deadlines, and revisions."
              action={
                <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                  Add Reminder
                </Button>
              }
            />
          ) : (
            reminders.map((r) => (
              <Card
                key={r.id}
                className={`p-4 transition-all flex items-start justify-between gap-4 ${
                  r.is_active ? 'bg-surface-900/60 border-surface-800' : 'bg-surface-950/40 border-surface-800/40 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(r.id)}
                    className="mt-0.5 text-surface-400 hover:text-accent-400"
                  >
                    {r.is_active ? (
                      <Bell className="h-5 w-5 text-accent-400" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-surface-600" />
                    )}
                  </button>
                  <div>
                    <h4 className={`text-sm font-semibold ${r.is_active ? 'text-surface-100' : 'text-surface-500 line-through'}`}>
                      {r.title}
                    </h4>
                    {r.description && (
                      <p className="text-xs text-surface-400 mt-0.5">{r.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-2xs font-mono text-surface-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(r.remind_at).toLocaleString()}
                      </span>
                      <span className="capitalize px-1.5 py-0.5 rounded bg-surface-800 text-surface-300">
                        {r.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="btn-ghost p-1.5 rounded text-surface-500 hover:text-rose-400"
                    title="Delete reminder"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Reminder"
      >
        <div className="space-y-4">
          <Input
            label="Reminder Title *"
            placeholder="e.g. Daily German A2 flashcard review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Trigger Date & Time *"
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
          />
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            options={[
              { value: 'study', label: 'Study Session' },
              { value: 'revision', label: 'Flashcard Revision' },
              { value: 'deadline', label: 'Project Milestone Deadline' },
              { value: 'custom', label: 'Custom Alert' },
            ]}
          />
          <Textarea
            label="Optional Description"
            placeholder="Notes or links to review..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Set Reminder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
