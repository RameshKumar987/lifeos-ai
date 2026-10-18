import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, CheckCircle2, Circle, Target, Edit3, Trash2, MoreHorizontal, Flag, Clock, Tag, ChevronDown, ChevronRight, X, Archive, RotateCcw } from 'lucide-react'
import { Card, Button, Input, Textarea, Select, Badge, Modal, ConfirmDialog, EmptyState, Skeleton, Tabs, ProgressBar } from '../components/ui'
import { useAuthStore } from '../store'
import { supabase } from '../lib/supabase'
import { cn, getLocalDate, formatDuration, getPriorityColor, getStatusColor } from '../lib/utils'
import { toast } from 'sonner'
import type { Task, Goal, Category } from '../types/database.types'
import { Header } from '../components/layout/Sidebar'
import { format, parseISO } from 'date-fns'

const INITIAL_CATEGORIES = [
  { name: 'Python', color: '#3b82f6', icon: '🐍' },
  { name: 'DSA', color: '#8b5cf6', icon: '🌳' },
  { name: 'AI Engineering', color: '#06b6d4', icon: '🤖' },
  { name: 'English', color: '#10b981', icon: '💬' },
  { name: 'German', color: '#f59e0b', icon: '🇩🇪' },
  { name: 'Projects', color: '#f43f5e', icon: '🚀' },
  { name: 'Open Source / GSoC', color: '#84cc16', icon: '🌿' },
  { name: 'CS Fundamentals', color: '#6366f1', icon: '📚' },
  { name: 'Interview Prep', color: '#ef4444', icon: '🎯' },
  { name: 'Health & Personal', color: '#14b8a6', icon: '🧘' },
]

export function TasksPage() {
  const { session } = useAuthStore()
  const [activeTab, setActiveTab] = useState('tasks')
  const [tasks, setTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null })
  const [goalModal, setGoalModal] = useState<{ open: boolean; goal: Goal | null }>({ open: false, goal: null })
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; type: 'task' | 'goal' }>({ open: false, id: '', type: 'task' })

  const loadData = useCallback(async () => {
    if (!session?.user.id) return
    setLoading(true)
    try {
      const userId = session.user.id
      const [{ data: tasksData }, { data: goalsData }, { data: catsData }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', userId).neq('status', 'archived').order('order_index'),
        supabase.from('goals').select('*').eq('user_id', userId).neq('status', 'archived').order('priority'),
        supabase.from('categories').select('*').eq('user_id', userId).order('order_index'),
      ])
      setTasks(tasksData || [])
      setGoals(goalsData || [])

      // Seed categories if empty
      if (!catsData?.length) {
        const newCats = INITIAL_CATEGORIES.map((c, i) => ({
          user_id: userId,
          name: c.name,
          color: c.color,
          icon: c.icon,
          order_index: i,
          is_active: true,
        }))
        const { data: seeded } = await supabase.from('categories').insert(newCats).select()
        setCategories(seeded || [])
      } else {
        setCategories(catsData)
      }
    } finally {
      setLoading(false)
    }
  }, [session?.user.id])

  useEffect(() => { loadData() }, [loadData])

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false
    if (filterCategory !== 'all' && task.category_id !== filterCategory) return false
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    const { error } = await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    }).eq('id', task.id)
    if (error) { toast.error('Failed to update'); return }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    if (newStatus === 'completed') toast.success('Task completed! +5 XP 🎉')
  }

  const handleDeleteTask = async () => {
    const { error } = await supabase.from('tasks').update({ status: 'archived' }).eq('id', deleteConfirm.id)
    if (error) { toast.error('Failed to delete'); return }
    setTasks(prev => prev.filter(t => t.id !== deleteConfirm.id))
    setDeleteConfirm({ open: false, id: '', type: 'task' })
    toast.success('Task archived')
  }

  const handleDeleteGoal = async () => {
    const { error } = await supabase.from('goals').update({ status: 'archived' }).eq('id', deleteConfirm.id)
    if (error) { toast.error('Failed to archive'); return }
    setGoals(prev => prev.filter(g => g.id !== deleteConfirm.id))
    setDeleteConfirm({ open: false, id: '', type: 'task' })
    toast.success('Goal archived')
  }

  const categoryMap = new Map(categories.map(c => [c.id, c]))

  const tabs = [
    { id: 'tasks', label: 'Tasks', count: tasks.filter(t => t.status !== 'completed').length },
    { id: 'goals', label: 'Goals', count: goals.filter(g => g.status === 'active').length },
    { id: 'categories', label: 'Categories', count: categories.length },
  ]

  return (
    <>
      <Header title="Tasks & Goals" subtitle="Manage your tasks, goals, and categories" />
      <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-4">

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          <div className="flex gap-2">
            {activeTab === 'tasks' && (
              <Button variant="primary" size="sm" onClick={() => setTaskModal({ open: true, task: null })} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Task
              </Button>
            )}
            {activeTab === 'goals' && (
              <Button variant="primary" size="sm" onClick={() => setGoalModal({ open: true, goal: null })} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Goal
              </Button>
            )}
          </div>
        </div>

        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-surface-500" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-9 h-8 text-xs"
                />
              </div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="input h-8 text-xs w-auto"
              >
                <option value="all">All Status</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
              </select>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="input h-8 text-xs w-auto"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Task list */}
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : filteredTasks.length === 0 ? (
              <EmptyState
                title="No tasks found"
                description="Add a task or adjust your filters"
                action={<Button variant="primary" size="sm" onClick={() => setTaskModal({ open: true, task: null })}>Add Task</Button>}
              />
            ) : (
              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    category={task.category_id ? categoryMap.get(task.category_id) : undefined}
                    onToggle={() => handleToggleTask(task)}
                    onEdit={() => setTaskModal({ open: true, task })}
                    onDelete={() => setDeleteConfirm({ open: true, id: task.id, type: 'task' })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
            ) : goals.length === 0 ? (
              <EmptyState
                title="No goals yet"
                description="Set meaningful goals to drive your progress"
                action={<Button variant="primary" size="sm" onClick={() => setGoalModal({ open: true, goal: null })}>Add Goal</Button>}
              />
            ) : (
              <div className="grid gap-3">
                {goals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    category={goal.category_id ? categoryMap.get(goal.category_id) : undefined}
                    onEdit={() => setGoalModal({ open: true, goal })}
                    onDelete={() => setDeleteConfirm({ open: true, id: goal.id, type: 'goal' })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map(cat => (
              <Card key={cat.id} hoverable className="flex items-center gap-3">
                <span className="text-lg">{cat.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-200 truncate">{cat.name}</p>
                  <p className="text-xs text-surface-500">
                    {tasks.filter(t => t.category_id === cat.id).length} tasks
                  </p>
                </div>
                <div
                  className="h-2 w-2 rounded-full ml-auto shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        open={taskModal.open}
        task={taskModal.task}
        categories={categories}
        goals={goals}
        onClose={() => setTaskModal({ open: false, task: null })}
        onSave={loadData}
        userId={session?.user.id}
      />

      {/* Goal Modal */}
      <GoalModal
        open={goalModal.open}
        goal={goalModal.goal}
        categories={categories}
        onClose={() => setGoalModal({ open: false, goal: null })}
        onSave={loadData}
        userId={session?.user.id}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '', type: 'task' })}
        onConfirm={deleteConfirm.type === 'task' ? handleDeleteTask : handleDeleteGoal}
        title={`Archive ${deleteConfirm.type}?`}
        description="This will archive the item. You can restore it later from settings."
        confirmLabel="Archive"
      />
    </>
  )
}

// ─── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task, category, onToggle, onEdit, onDelete
}: {
  task: Task
  category?: Category
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 group',
      'bg-surface-900/60 border-surface-800/60 hover:border-surface-700/60',
      task.status === 'completed' && 'opacity-60'
    )}>
      <button
        onClick={onToggle}
        className={cn(
          'h-4 w-4 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-all duration-150',
          task.status === 'completed'
            ? 'bg-emerald-600 border-emerald-600'
            : 'border-surface-600 hover:border-accent-500'
        )}
        aria-label="Toggle completion"
      >
        {task.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className={cn(
            'text-sm font-medium leading-snug',
            task.status === 'completed' ? 'line-through text-surface-500' : 'text-surface-100'
          )}>
            {task.title}
          </p>
        </div>
        {task.description && (
          <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{task.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-1.5">
          {category && (
            <span
              className="text-2xs px-1.5 py-0.5 rounded-md font-medium"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              {category.icon} {category.name}
            </span>
          )}
          {task.planned_duration_mins && (
            <span className="text-2xs text-surface-500 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" /> {formatDuration(task.planned_duration_mins)}
            </span>
          )}
          {task.planned_date && (
            <span className="text-2xs text-surface-500">
              {format(parseISO(task.planned_date), 'd MMM')}
            </span>
          )}
          {task.tags.map(tag => (
            <span key={tag} className="tag text-2xs">{tag}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <div className={cn(
          'h-1.5 w-1.5 rounded-full',
          task.priority === 'critical' ? 'bg-rose-500' :
          task.priority === 'high' ? 'bg-orange-500' :
          task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
        )} />
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 btn-ghost p-1 rounded-md transition-opacity"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-lg bg-surface-800 border border-surface-700 shadow-xl z-10">
              <button onClick={() => { onEdit(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-surface-300 hover:bg-surface-700 transition-colors">
                <Edit3 className="h-3 w-3" /> Edit
              </button>
              <button onClick={() => { onDelete(); setMenuOpen(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-400 hover:bg-surface-700 transition-colors">
                <Archive className="h-3 w-3" /> Archive
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({ goal, category, onEdit, onDelete }: {
  goal: Goal
  category?: Category
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card hoverable className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 min-w-0">
          <Target className="h-4 w-4 text-electric-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-100">{goal.title}</p>
            {goal.description && (
              <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{goal.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="btn-ghost p-1 rounded">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="btn-ghost p-1 rounded text-rose-400">
            <Archive className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-surface-500">Progress</span>
          <span className="text-surface-300 font-medium">{goal.progress_percent}%</span>
        </div>
        <ProgressBar value={goal.progress_percent} color="electric" size="sm" />
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-surface-500">
        {category && (
          <span style={{ color: category.color }}>
            {category.icon} {category.name}
          </span>
        )}
        <span className={getPriorityColor(goal.priority).split(' ')[0]}>
          {goal.priority} priority
        </span>
        {goal.deadline && (
          <span>Due {format(parseISO(goal.deadline), 'd MMM yyyy')}</span>
        )}
        {goal.target_hours && (
          <span>{goal.actual_hours}/{goal.target_hours}h</span>
        )}
      </div>
    </Card>
  )
}

// ─── Task Modal ─────────────────────────────────────────────────────────────────

function TaskModal({ open, task, categories, goals, onClose, onSave, userId }: {
  open: boolean
  task: Task | null
  categories: Category[]
  goals: Goal[]
  onClose: () => void
  onSave: () => void
  userId?: string
}) {
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', goal_id: '',
    status: 'todo' as Task['status'], priority: 'medium' as Task['priority'],
    difficulty: '' as Task['difficulty'] | '',
    planned_date: getLocalDate(), deadline: '',
    planned_duration_mins: '', notes: '', tags: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        category_id: task.category_id || '',
        goal_id: task.goal_id || '',
        status: task.status,
        priority: task.priority,
        difficulty: task.difficulty || '',
        planned_date: task.planned_date || getLocalDate(),
        deadline: task.deadline || '',
        planned_duration_mins: task.planned_duration_mins?.toString() || '',
        notes: task.notes || '',
        tags: task.tags.join(', '),
      })
    } else {
      setForm({
        title: '', description: '', category_id: '', goal_id: '',
        status: 'todo', priority: 'medium', difficulty: '',
        planned_date: getLocalDate(), deadline: '',
        planned_duration_mins: '', notes: '', tags: '',
      })
    }
  }, [task, open])

  const handleSubmit = async () => {
    if (!form.title.trim() || !userId) return
    setLoading(true)
    try {
      const payload = {
        user_id: userId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id || null,
        goal_id: form.goal_id || null,
        status: form.status,
        priority: form.priority,
        difficulty: form.difficulty || null,
        planned_date: form.planned_date || null,
        deadline: form.deadline || null,
        planned_duration_mins: form.planned_duration_mins ? parseInt(form.planned_duration_mins) : null,
        notes: form.notes.trim() || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        resources: [],
        actual_duration_mins: 0,
        order_index: 0,
        is_recurring: false,
      }

      if (task) {
        const { error } = await supabase.from('tasks').update(payload).eq('id', task.id)
        if (error) throw error
        toast.success('Task updated!')
      } else {
        const { error } = await supabase.from('tasks').insert(payload)
        if (error) throw error
        toast.success('Task added!')
      }
      onSave()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit Task' : 'New Task'} size="lg">
      <div className="space-y-4">
        <Input label="Title *" placeholder="What needs to be done?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Textarea label="Description" placeholder="Add more context..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            value={form.category_id}
            onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
            options={[{ value: '', label: 'No category' }, ...categories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))]}
          />
          <Select
            label="Goal"
            value={form.goal_id}
            onChange={e => setForm(f => ({ ...f, goal_id: e.target.value }))}
            options={[{ value: '', label: 'No goal' }, ...goals.map(g => ({ value: g.id, label: g.title }))]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
            options={[
              { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
            ]}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))}
            options={[
              { value: 'todo', label: 'Todo' }, { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' }, { value: 'skipped', label: 'Skipped' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Planned Date"
            type="date"
            value={form.planned_date}
            onChange={e => setForm(f => ({ ...f, planned_date: e.target.value }))}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            placeholder="e.g. 45"
            value={form.planned_duration_mins}
            onChange={e => setForm(f => ({ ...f, planned_duration_mins: e.target.value }))}
          />
        </div>

        <Input
          label="Tags (comma separated)"
          placeholder="python, interview, urgent"
          value={form.tags}
          onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
        />

        <Textarea label="Notes" placeholder="Additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
            {task ? 'Save Changes' : 'Add Task'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Goal Modal ─────────────────────────────────────────────────────────────────

function GoalModal({ open, goal, categories, onClose, onSave, userId }: {
  open: boolean
  goal: Goal | null
  categories: Category[]
  onClose: () => void
  onSave: () => void
  userId?: string
}) {
  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
    status: 'active' as Goal['status'], priority: 'medium' as Goal['priority'],
    target_hours: '', start_date: '', deadline: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (goal) {
      setForm({
        title: goal.title, description: goal.description || '',
        category_id: goal.category_id || '', status: goal.status, priority: goal.priority,
        target_hours: goal.target_hours?.toString() || '',
        start_date: goal.start_date || '', deadline: goal.deadline || '',
      })
    } else {
      setForm({ title: '', description: '', category_id: '', status: 'active', priority: 'medium', target_hours: '', start_date: '', deadline: '' })
    }
  }, [goal, open])

  const handleSubmit = async () => {
    if (!form.title.trim() || !userId) return
    setLoading(true)
    try {
      const payload = {
        user_id: userId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id || null,
        status: form.status,
        priority: form.priority,
        target_hours: form.target_hours ? parseFloat(form.target_hours) : null,
        start_date: form.start_date || null,
        deadline: form.deadline || null,
        actual_hours: goal?.actual_hours || 0,
        progress_percent: goal?.progress_percent || 0,
        tags: [],
      }
      if (goal) {
        const { error } = await supabase.from('goals').update(payload).eq('id', goal.id)
        if (error) throw error
        toast.success('Goal updated!')
      } else {
        const { error } = await supabase.from('goals').insert(payload)
        if (error) throw error
        toast.success('Goal added!')
      }
      onSave()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edit Goal' : 'New Goal'} size="md">
      <div className="space-y-4">
        <Input label="Goal Title *" placeholder="What do you want to achieve?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Textarea label="Description" placeholder="Why is this goal important?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
            options={[{ value: '', label: 'No category' }, ...categories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }))]} />
          <Select label="Priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Goal['priority'] }))}
            options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Target Hours" type="number" placeholder="e.g. 100" value={form.target_hours} onChange={e => setForm(f => ({ ...f, target_hours: e.target.value }))} />
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Goal['status'] }))}
            options={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }, { value: 'completed', label: 'Completed' }]} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          <Input label="Deadline" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
            {goal ? 'Save Changes' : 'Add Goal'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
