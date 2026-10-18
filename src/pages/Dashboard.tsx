import React, { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  Play, Square, CheckCircle2, Clock, Target, Flame, TrendingUp, BookOpen,
  Brain, Star, ChevronRight, CalendarDays, Zap, Award, AlertCircle,
  BarChart3, Code2, MessageSquare, FolderKanban, ArrowRight, RefreshCw
} from 'lucide-react'
import { Card, Button, ProgressBar, Badge, Skeleton, EmptyState, Spinner } from '../components/ui'
import { useAuthStore, useAttendanceStore, useUIStore } from '../store'
import { supabase } from '../lib/supabase'
import { getGreeting, getLocalDate, formatDuration, cn, calculateLevel, getLevelName } from '../lib/utils'
import { isAIConfigured, generateDailyPlan } from '../lib/ai'
import { toast } from 'sonner'
import type { Task, DailyAttendance, Goal, LearningEntry, Flashcard } from '../types/database.types'
import { Link } from 'react-router-dom'

interface DashboardData {
  todayTasks: Task[]
  todayAttendance: DailyAttendance | null
  activeGoals: Goal[]
  recentLearning: LearningEntry[]
  dueRevisions: Flashcard[]
  weeklyStats: {
    completedTasks: number
    totalTasks: number
    learningHours: number
    attendanceDays: number
  }
  loaded: boolean
}

export function Dashboard() {
  const { profile, session, preferences } = useAuthStore()
  const { todayAttendance, setTodayAttendance } = useAttendanceStore()

  const [data, setData] = useState<DashboardData>({
    todayTasks: [],
    todayAttendance: null,
    activeGoals: [],
    recentLearning: [],
    dueRevisions: [],
    weeklyStats: { completedTasks: 0, totalTasks: 0, learningHours: 0, attendanceDays: 0 },
    loaded: false,
  })
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [briefing, setBriefing] = useState<{
    content: string | null
    loading: boolean
    error: string | null
  }>({ content: null, loading: false, error: null })

  const today = getLocalDate()
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))

  useEffect(() => {
    if (profile) {
      loadDashboardData()
    }
  }, [profile])

  const loadDashboardData = async () => {
    const userId = session?.user?.id || profile?.id || 'demo-user'

    try {
      // Run queries in parallel
      const [
        { data: todayTasks },
        { data: attendance },
        { data: goals },
        { data: recentLearning },
        { data: dueRevisions },
        { data: weekAttendance },
        { data: weekTasks },
      ] = await Promise.all([
        supabase.from('tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('planned_date', today)
          .neq('status', 'archived')
          .order('order_index'),

        supabase.from('daily_attendance')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle(),

        supabase.from('goals')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('priority')
          .limit(5),

        supabase.from('learning_entries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3),

        supabase.from('flashcards')
          .select('*')
          .eq('user_id', userId)
          .lte('next_review_at', new Date().toISOString())
          .order('next_review_at')
          .limit(10),

        // This week's attendance
        supabase.from('daily_attendance')
          .select('date')
          .eq('user_id', userId)
          .gte('date', format(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
          .lte('date', today),

        // This week's tasks
        supabase.from('tasks')
          .select('status')
          .eq('user_id', userId)
          .gte('planned_date', format(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
          .lte('planned_date', today),
      ])

      const att = attendance || null
      if (att) setTodayAttendance(att)

      const completedThisWeek = weekTasks?.filter(t => t.status === 'completed').length || 0
      const totalThisWeek = weekTasks?.length || 0
      const attendanceDaysThisWeek = weekAttendance?.length || 0

      setData({
        todayTasks: todayTasks || [],
        todayAttendance: att,
        activeGoals: goals || [],
        recentLearning: recentLearning || [],
        dueRevisions: dueRevisions || [],
        weeklyStats: {
          completedTasks: completedThisWeek,
          totalTasks: totalThisWeek,
          learningHours: 0,
          attendanceDays: attendanceDaysThisWeek,
        },
        loaded: true,
      })
    } catch (err) {
      console.error('Dashboard data load failed:', err)
      setData(d => ({ ...d, loaded: true }))
    }
  }

  const handleStartDay = async () => {
    if (!session?.user.id) return
    setAttendanceLoading(true)
    try {
      const newAttendance = {
        user_id: session.user.id,
        date: today,
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
        is_rest_day: false,
        sessions: [],
      }

      const { data, error } = await supabase
        .from('daily_attendance')
        .upsert(newAttendance, { onConflict: 'user_id,date' })
        .select()
        .single()

      if (error) throw error
      setTodayAttendance(data)
      setData(d => ({ ...d, todayAttendance: data }))
      toast.success('Day started! Let\'s make it count 🚀')
    } catch (err) {
      toast.error('Failed to start day')
    } finally {
      setAttendanceLoading(false)
    }
  }

  const handleEndDay = async () => {
    if (!session?.user.id || !data.todayAttendance) return
    setAttendanceLoading(true)
    try {
      const startedAt = data.todayAttendance.started_at
        ? new Date(data.todayAttendance.started_at)
        : new Date()
      const endedAt = new Date()
      const durationMins = Math.floor((endedAt.getTime() - startedAt.getTime()) / 60000)

      const { data: updated, error } = await supabase
        .from('daily_attendance')
        .update({
          status: 'completed',
          ended_at: endedAt.toISOString(),
          duration_mins: durationMins,
        })
        .eq('id', data.todayAttendance.id)
        .select()
        .single()

      if (error) throw error
      setTodayAttendance(updated)
      setData(d => ({ ...d, todayAttendance: updated }))

      // Award XP
      await supabase.from('user_xp_events').insert({
        user_id: session.user.id,
        amount: 10,
        reason: 'Completed a study day',
        source_type: 'attendance',
        source_id: updated.id,
      })
      await supabase.from('profiles')
        .update({ xp_total: (profile?.xp_total || 0) + 10 })
        .eq('id', session.user.id)

      toast.success(`Day completed! ${formatDuration(durationMins)} of productive work 🎉`)
    } catch (err) {
      toast.error('Failed to end day')
    } finally {
      setAttendanceLoading(false)
    }
  }

  const loadAIBriefing = async () => {
    setBriefing({ content: null, loading: true, error: null })
    try {
      const goals = data.activeGoals.map(g => g.title)
      const pendingTasks = data.todayTasks.filter(t => t.status === 'todo').map(t => t.title)
      const result = await generateDailyPlan(
        goals,
        pendingTasks,
        data.dueRevisions.length,
        preferences?.daily_goal_hours || 6,
        session?.access_token
      )
      if (result.success) {
        setBriefing({ content: result.content, loading: false, error: null })
      } else {
        setBriefing({ content: null, loading: false, error: result.error || 'AI unavailable' })
      }
    } catch {
      setBriefing({ content: null, loading: false, error: 'Failed to generate briefing' })
    }
  }

  const completedToday = data.todayTasks.filter(t => t.status === 'completed').length
  const totalToday = data.todayTasks.length
  const { level, currentXP, nextLevelXP } = calculateLevel(profile?.xp_total || 0)
  const taskProgress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0

  if (!data.loaded) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* ─── Header greeting ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold font-display text-surface-50">
            {getGreeting(profile?.full_name || undefined)}
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {format(now, 'EEEE, d MMMM yyyy')} • {format(now, 'h:mm a')} IST
          </p>
        </div>

        {/* Day controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!data.todayAttendance || data.todayAttendance.status === 'not_started' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartDay}
              loading={attendanceLoading}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              Start Day
            </Button>
          ) : data.todayAttendance.status === 'in_progress' ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleEndDay}
              loading={attendanceLoading}
              className="gap-1.5"
            >
              <Square className="h-3.5 w-3.5" />
              End Day
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Day Complete!</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Stats row ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {/* Today's tasks */}
        <Card padded className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Today's Tasks</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="stat-value">{completedToday}/{totalToday}</div>
          <ProgressBar value={taskProgress} size="xs" color="green" className="mt-2" />
        </Card>

        {/* Streak */}
        <Card padded className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Streak</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="stat-value">{profile?.streak_current || 0}d</div>
          <p className="text-xs text-surface-500 mt-1">
            Best: {profile?.streak_longest || 0}d
          </p>
        </Card>

        {/* Level */}
        <Card padded className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Level</span>
            <Star className="h-4 w-4 text-amber-500" />
          </div>
          <div className="stat-value">{level}</div>
          <p className="text-xs text-surface-500 mt-1">{getLevelName(level)}</p>
          <div className="xp-bar mt-2">
            <div
              className="xp-bar-fill"
              style={{ width: `${(currentXP / nextLevelXP) * 100}%` }}
            />
          </div>
        </Card>

        {/* Due revisions */}
        <Card padded className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Due Revision</span>
            <Brain className="h-4 w-4 text-accent-400" />
          </div>
          <div className="stat-value">{data.dueRevisions.length}</div>
          {data.dueRevisions.length > 0 ? (
            <Link to="/revision" className="text-xs text-accent-400 hover:text-accent-300 mt-1 flex items-center gap-1">
              Review now <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <p className="text-xs text-emerald-500 mt-1">All caught up! ✓</p>
          )}
        </Card>
      </motion.div>

      {/* ─── Main content grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Today's Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="lg:col-span-2"
        >
          <Card padded={false} className="h-full">
            <div className="flex items-center justify-between p-4 border-b border-surface-800">
              <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent-400" />
                Today's Plan
              </h2>
              <Link to="/tasks" className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">
                See all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-4 space-y-2">
              {data.todayTasks.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-8 w-8" />}
                  title="No tasks scheduled for today"
                  description="Add tasks or let the AI planner suggest your day"
                  action={
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => useUIStore.getState().setQuickAddOpen(true)}>
                        Add Task
                      </Button>
                      <Link to="/tasks">
                        <Button variant="secondary" size="sm">Plan Day</Button>
                      </Link>
                    </div>
                  }
                />
              ) : (
                data.todayTasks.slice(0, 8).map((task) => (
                  <TaskRow key={task.id} task={task} onUpdate={loadDashboardData} />
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* AI Briefing */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card padded={false}>
              <div className="flex items-center justify-between p-4 border-b border-surface-800">
                <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-accent-400" />
                  AI Briefing
                  <span className="ai-badge ml-1">AI</span>
                </h2>
                <button
                  onClick={loadAIBriefing}
                  disabled={briefing.loading || !isAIConfigured}
                  className="text-surface-500 hover:text-surface-300 transition-colors disabled:opacity-40"
                  title={isAIConfigured ? 'Generate briefing' : 'AI not configured'}
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', briefing.loading && 'animate-spin')} />
                </button>
              </div>
              <div className="p-4">
                {briefing.loading ? (
                  <Skeleton lines={4} />
                ) : briefing.content ? (
                  <div>
                    {(() => {
                      try {
                        const parsed = JSON.parse(briefing.content)
                        return (
                          <div className="space-y-3">
                            <p className="text-sm text-surface-300">{parsed.briefing}</p>
                            {parsed.top_priorities && (
                              <div>
                                <p className="label mb-1">Top Priorities</p>
                                <ul className="space-y-1">
                                  {parsed.top_priorities.map((p: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2 text-xs text-surface-400">
                                      <span className="text-accent-500">{i + 1}.</span> {p}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {parsed.focus_tip && (
                              <div className="p-2.5 rounded-lg bg-accent-500/5 border border-accent-500/15">
                                <p className="text-xs text-accent-300">💡 {parsed.focus_tip}</p>
                              </div>
                            )}
                          </div>
                        )
                      } catch {
                        return <p className="text-sm text-surface-300">{briefing.content}</p>
                      }
                    })()}
                  </div>
                ) : briefing.error ? (
                  <div className="text-center py-2">
                    {!isAIConfigured ? (
                      <div>
                        <p className="text-xs text-surface-500 mb-2">AI not configured</p>
                        <Link to="/settings/ai">
                          <Button variant="secondary" size="sm">Configure AI →</Button>
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-rose-400">{briefing.error}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-surface-500 mb-2">
                      {isAIConfigured ? 'Generate your personalized daily briefing' : 'Configure AI to get smart daily briefings'}
                    </p>
                    {isAIConfigured && (
                      <Button variant="secondary" size="sm" onClick={loadAIBriefing}>
                        Generate Briefing
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Active Goals */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <Card padded={false}>
              <div className="flex items-center justify-between p-4 border-b border-surface-800">
                <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-electric-400" />
                  Active Goals
                </h2>
                <Link to="/tasks?tab=goals" className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">
                  All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-4 space-y-3">
                {data.activeGoals.length === 0 ? (
                  <EmptyState
                    title="No active goals"
                    description="Set goals to track your progress"
                    action={
                      <Link to="/tasks?tab=goals">
                        <Button variant="secondary" size="sm">Add Goal</Button>
                      </Link>
                    }
                  />
                ) : (
                  data.activeGoals.map((goal) => (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-medium text-surface-200 leading-tight">{goal.title}</p>
                        <span className="text-xs text-surface-500 ml-2 shrink-0">{goal.progress_percent}%</span>
                      </div>
                      <ProgressBar value={goal.progress_percent} size="xs" color="electric" />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          {/* Recent Learning */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card padded={false}>
              <div className="flex items-center justify-between p-4 border-b border-surface-800">
                <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  Recent Learning
                </h2>
                <Link to="/learning" className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1">
                  All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-4 space-y-2">
                {data.recentLearning.length === 0 ? (
                  <EmptyState
                    title="No learning entries yet"
                    action={
                      <Link to="/learning">
                        <Button variant="secondary" size="sm">Add Learning Note</Button>
                      </Link>
                    }
                  />
                ) : (
                  data.recentLearning.map((entry) => (
                    <Link
                      key={entry.id}
                      to={`/learning/${entry.id}`}
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-surface-800/50 transition-colors group"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-surface-200 truncate group-hover:text-surface-50">
                          {entry.title}
                        </p>
                        <p className="text-2xs text-surface-500 mt-0.5">
                          {entry.key_concepts.length} concepts
                          {entry.ai_processed && <span className="ml-1 text-accent-500">• AI processed</span>}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ─── Quick access modules ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        <h2 className="section-title mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Revision', icon: Brain, path: '/revision', color: 'text-accent-400', badge: data.dueRevisions.length > 0 ? data.dueRevisions.length : null },
            { label: 'English Lab', icon: MessageSquare, path: '/english', color: 'text-blue-400', badge: null },
            { label: 'German', icon: '🇩🇪', path: '/german', color: 'text-amber-400', badge: null },
            { label: 'Python/DSA', icon: Code2, path: '/python-dsa', color: 'text-green-400', badge: null },
            { label: 'Projects', icon: FolderKanban, path: '/projects', color: 'text-electric-400', badge: null },
            { label: 'Analytics', icon: BarChart3, path: '/analytics', color: 'text-rose-400', badge: null },
          ].map((item) => (
            <Link key={item.path} to={item.path}>
              <Card hoverable className="flex flex-col items-center gap-2 py-4 text-center relative">
                {item.badge && (
                  <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-rose-500 text-white text-2xs flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
                {typeof item.icon === 'string' ? (
                  <span className="text-xl">{item.icon}</span>
                ) : (
                  <item.icon className={cn('h-5 w-5', item.color)} />
                )}
                <span className="text-xs font-medium text-surface-300">{item.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Task Row Component ────────────────────────────────────────────────────────

function TaskRow({ task, onUpdate }: { task: Task; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false)

  const toggleComplete = async () => {
    setLoading(true)
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed'
      const { error } = await supabase.from('tasks').update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      }).eq('id', task.id)

      if (error) throw error
      onUpdate()
    } catch {
      toast.error('Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  const priorityColors: Record<string, string> = {
    critical: 'bg-rose-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-500',
    low: 'bg-blue-500',
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-2.5 rounded-lg transition-all duration-150 group',
      'hover:bg-surface-800/40',
      task.status === 'completed' && 'opacity-60'
    )}>
      <button
        onClick={toggleComplete}
        disabled={loading}
        className={cn(
          'h-4 w-4 rounded shrink-0 border-2 flex items-center justify-center transition-all duration-150',
          task.status === 'completed'
            ? 'bg-emerald-600 border-emerald-600'
            : 'border-surface-600 hover:border-accent-500'
        )}
        aria-label={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.status === 'completed' && (
          <CheckCircle2 className="h-3 w-3 text-white" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-xs font-medium truncate',
          task.status === 'completed' ? 'line-through text-surface-500' : 'text-surface-200'
        )}>
          {task.title}
        </p>
        {task.planned_duration_mins && (
          <p className="text-2xs text-surface-500 mt-0.5">
            {formatDuration(task.planned_duration_mins)}
          </p>
        )}
      </div>

      <div className={cn(
        'h-1.5 w-1.5 rounded-full shrink-0',
        priorityColors[task.priority] || 'bg-surface-600'
      )} title={`Priority: ${task.priority}`} />
    </div>
  )
}
