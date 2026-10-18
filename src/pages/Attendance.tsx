import React, { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { Play, Square, CheckCircle2, Clock, Calendar, ChevronLeft, ChevronRight, AlertCircle, Edit3, Plus } from 'lucide-react'
import { Card, Button, Badge, Modal, Input, Textarea, EmptyState, Skeleton } from '../components/ui'
import { useAuthStore, useAttendanceStore } from '../store'
import { supabase } from '../lib/supabase'
import { getLocalDate, formatDuration, cn } from '../lib/utils'
import { toast } from 'sonner'
import type { DailyAttendance } from '../types/database.types'
import { Header } from '../components/layout/Sidebar'

export function AttendancePage() {
  const { profile, session } = useAuthStore()
  const { todayAttendance, setTodayAttendance } = useAttendanceStore()

  const [monthAttendance, setMonthAttendance] = useState<DailyAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [dayLoading, setDayLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [editModal, setEditModal] = useState<{ open: boolean; record: DailyAttendance | null }>({ open: false, record: null })
  const [editNotes, setEditNotes] = useState('')
  const [editReason, setEditReason] = useState('')
  const [editRestDay, setEditRestDay] = useState(false)
  const today = getLocalDate()

  const loadMonthAttendance = useCallback(async () => {
    if (!session?.user.id) return
    setLoading(true)
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })

      if (error) throw error
      setMonthAttendance(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [session?.user.id, currentMonth])

  useEffect(() => {
    loadMonthAttendance()
  }, [loadMonthAttendance])

  const handleStartDay = async () => {
    if (!session?.user.id) return
    setDayLoading(true)
    try {
      const { data, error } = await supabase
        .from('daily_attendance')
        .upsert({
          user_id: session.user.id,
          date: today,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          is_rest_day: false,
          sessions: [],
        }, { onConflict: 'user_id,date' })
        .select()
        .single()
      if (error) throw error
      setTodayAttendance(data)
      await loadMonthAttendance()
      toast.success('Day started! 🚀')
    } catch (err) {
      toast.error('Failed to start day')
    } finally {
      setDayLoading(false)
    }
  }

  const handleEndDay = async () => {
    if (!session?.user.id || !todayAttendance) return
    setDayLoading(true)
    try {
      const startedAt = todayAttendance.started_at ? new Date(todayAttendance.started_at) : new Date()
      const endedAt = new Date()
      const durationMins = Math.floor((endedAt.getTime() - startedAt.getTime()) / 60000)

      const { data, error } = await supabase
        .from('daily_attendance')
        .update({ status: 'completed', ended_at: endedAt.toISOString(), duration_mins: durationMins })
        .eq('id', todayAttendance.id)
        .select()
        .single()
      if (error) throw error
      setTodayAttendance(data)
      await loadMonthAttendance()
      toast.success(`Day wrapped! ${formatDuration(durationMins)} logged 🎉`)
    } catch {
      toast.error('Failed to end day')
    } finally {
      setDayLoading(false)
    }
  }

  const handleMarkRestDay = async () => {
    if (!session?.user.id) return
    setDayLoading(true)
    try {
      const { data, error } = await supabase
        .from('daily_attendance')
        .upsert({
          user_id: session.user.id,
          date: today,
          status: 'completed',
          is_rest_day: true,
          sessions: [],
        }, { onConflict: 'user_id,date' })
        .select()
        .single()
      if (error) throw error
      setTodayAttendance(data)
      await loadMonthAttendance()
      toast.success('Rest day logged. Recovery is part of growth! 🧘')
    } catch {
      toast.error('Failed to mark rest day')
    } finally {
      setDayLoading(false)
    }
  }

  const openEdit = (record: DailyAttendance) => {
    setEditModal({ open: true, record })
    setEditNotes(record.notes || '')
    setEditReason(record.missed_reason || '')
    setEditRestDay(record.is_rest_day)
  }

  const handleSaveEdit = async () => {
    if (!editModal.record) return
    try {
      const { error } = await supabase
        .from('daily_attendance')
        .update({ notes: editNotes || null, missed_reason: editReason || null, is_rest_day: editRestDay })
        .eq('id', editModal.record.id)
      if (error) throw error
      await loadMonthAttendance()
      setEditModal({ open: false, record: null })
      toast.success('Updated!')
    } catch {
      toast.error('Failed to update')
    }
  }

  // Calendar generation
  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const attendanceMap = new Map(monthAttendance.map(a => [a.date, a]))

  const activeDays = monthAttendance.filter(a => !a.is_rest_day && a.status !== 'not_started').length
  const restDays = monthAttendance.filter(a => a.is_rest_day).length
  const totalDays = daysInMonth.filter(d => d <= new Date()).length
  const attendanceRate = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0

  const totalMinutes = monthAttendance.reduce((sum, a) => sum + (a.duration_mins || 0), 0)

  const getDayStatus = (dateStr: string) => {
    const rec = attendanceMap.get(dateStr)
    if (!rec) return 'none'
    if (rec.is_rest_day) return 'rest'
    if (rec.status === 'completed') return 'completed'
    if (rec.status === 'in_progress') return 'in_progress'
    return 'none'
  }

  return (
    <>
      <Header title="Daily Log" subtitle="Personal attendance & activity tracking" />
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">

        {/* Today's status card */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="section-title mb-1">Today — {format(new Date(), 'EEEE, d MMMM')}</p>
              <div className="flex items-center gap-2 mt-1">
                {todayAttendance?.status === 'completed' ? (
                  <Badge variant="green" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Completed
                    {todayAttendance.is_rest_day && ' (Rest Day)'}
                  </Badge>
                ) : todayAttendance?.status === 'in_progress' ? (
                  <Badge variant="blue" className="gap-1">
                    <Clock className="h-3 w-3" /> In Progress
                  </Badge>
                ) : (
                  <Badge variant="gray">Not Started</Badge>
                )}
                {todayAttendance?.started_at && (
                  <span className="text-xs text-surface-500">
                    Started at {format(new Date(todayAttendance.started_at), 'h:mm a')}
                  </span>
                )}
                {todayAttendance?.duration_mins && (
                  <span className="text-xs text-surface-500">
                    • {formatDuration(todayAttendance.duration_mins)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!todayAttendance || todayAttendance.status === 'not_started' ? (
                <>
                  <Button variant="primary" size="sm" onClick={handleStartDay} loading={dayLoading} className="gap-1.5">
                    <Play className="h-3.5 w-3.5" /> Start Day
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleMarkRestDay} loading={dayLoading}>
                    Rest Day
                  </Button>
                </>
              ) : todayAttendance.status === 'in_progress' ? (
                <Button variant="danger" size="sm" onClick={handleEndDay} loading={dayLoading} className="gap-1.5">
                  <Square className="h-3.5 w-3.5" /> End Day
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => openEdit(todayAttendance)} className="gap-1.5">
                  <Edit3 className="h-3.5 w-3.5" /> Edit Notes
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Monthly stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="stat-card">
            <span className="stat-label">Attendance Rate</span>
            <div className="stat-value text-emerald-400">{attendanceRate}%</div>
          </Card>
          <Card className="stat-card">
            <span className="stat-label">Active Days</span>
            <div className="stat-value">{activeDays}</div>
          </Card>
          <Card className="stat-card">
            <span className="stat-label">Rest Days</span>
            <div className="stat-value text-blue-400">{restDays}</div>
          </Card>
          <Card className="stat-card">
            <span className="stat-label">Total Hours</span>
            <div className="stat-value">{formatDuration(totalMinutes)}</div>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent-400" />
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="btn-ghost p-1.5 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="btn-ghost px-2 py-1 rounded-md text-xs"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="btn-ghost p-1.5 rounded-md"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-2xs text-surface-600 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before month start */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const status = getDayStatus(dateStr)
              const isToday = dateStr === today
              const isPast = day < new Date() && !isToday
              const record = attendanceMap.get(dateStr)

              return (
                <button
                  key={dateStr}
                  onClick={() => record && openEdit(record)}
                  disabled={!record}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all duration-150',
                    isToday && 'ring-2 ring-accent-500',
                    status === 'completed' && 'bg-emerald-500/20 text-emerald-300',
                    status === 'rest' && 'bg-blue-500/10 text-blue-400',
                    status === 'in_progress' && 'bg-accent-500/20 text-accent-300',
                    status === 'none' && isPast && 'text-surface-700',
                    status === 'none' && !isPast && 'text-surface-500',
                    record && 'cursor-pointer hover:brightness-125',
                    !record && 'cursor-default',
                  )}
                  title={record ? `${record.duration_mins ? formatDuration(record.duration_mins) : ''} ${record.status}` : ''}
                >
                  <span>{format(day, 'd')}</span>
                  {status === 'completed' && <span className="text-2xs">✓</span>}
                  {status === 'rest' && <span className="text-2xs">~</span>}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-surface-800">
            {[
              { color: 'bg-emerald-500/20', label: 'Active' },
              { color: 'bg-blue-500/10', label: 'Rest' },
              { color: 'bg-accent-500/20', label: 'In Progress' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={cn('h-3 w-3 rounded', item.color)} />
                <span className="text-xs text-surface-500">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* History list */}
        <Card>
          <h2 className="text-sm font-semibold text-surface-100 mb-4">Activity History</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : monthAttendance.length === 0 ? (
            <EmptyState
              title="No activity this month"
              description="Start tracking your daily study sessions"
              action={<Button variant="primary" size="sm" onClick={handleStartDay}>Start Today</Button>}
            />
          ) : (
            <div className="space-y-2">
              {monthAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-800/40 group">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-2 w-2 rounded-full shrink-0',
                      record.is_rest_day ? 'bg-blue-400' :
                      record.status === 'completed' ? 'bg-emerald-400' :
                      record.status === 'in_progress' ? 'bg-amber-400' : 'bg-surface-600'
                    )} />
                    <div>
                      <p className="text-xs font-medium text-surface-200">
                        {format(parseISO(record.date), 'EEEE, d MMM')}
                        {record.is_rest_day && <span className="ml-1 text-blue-400">· Rest Day</span>}
                      </p>
                      {record.notes && (
                        <p className="text-2xs text-surface-500 mt-0.5">{record.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.duration_mins && (
                      <span className="text-xs text-surface-400">{formatDuration(record.duration_mins)}</span>
                    )}
                    <button
                      onClick={() => openEdit(record)}
                      className="opacity-0 group-hover:opacity-100 btn-ghost p-1 rounded transition-opacity"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Edit modal */}
      <Modal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, record: null })}
        title="Edit Day Record"
        size="sm"
      >
        <div className="space-y-4">
          {editModal.record && (
            <p className="text-xs text-surface-400">
              {format(parseISO(editModal.record.date), 'EEEE, d MMMM yyyy')}
            </p>
          )}
          <Textarea
            label="Notes"
            placeholder="What did you accomplish?"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={3}
          />
          <Textarea
            label="Missed reason (if applicable)"
            placeholder="Why was this day missed?"
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            rows={2}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-rest"
              checked={editRestDay}
              onChange={(e) => setEditRestDay(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="edit-rest" className="text-sm text-surface-300">Mark as Rest Day</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditModal({ open: false, record: null })}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
