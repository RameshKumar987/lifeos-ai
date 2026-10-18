import React, { useState, useEffect, useCallback } from 'react'
import { Brain, ChevronLeft, ChevronRight, Check, X, RotateCcw, Clock, Star, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react'
import { Card, Button, Badge, EmptyState, Skeleton, Tabs, ProgressBar } from '../components/ui'
import { useAuthStore } from '../store'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { toast } from 'sonner'
import type { Flashcard, ReviewAttempt } from '../types/database.types'
import { Header } from '../components/layout/Sidebar'
import { format, addDays } from 'date-fns'

// Spaced repetition intervals in days
const SR_INTERVALS = [1, 3, 7, 14, 30, 60]

function getNextInterval(currentInterval: number, quality: string, easeFactor: number): { interval: number; easeFactor: number } {
  let newEF = easeFactor
  if (quality === 'easy') {
    newEF = Math.min(3.0, easeFactor + 0.1)
    return { interval: Math.min(currentInterval * Math.ceil(newEF), 60), easeFactor: newEF }
  } else if (quality === 'good') {
    return { interval: Math.ceil(currentInterval * easeFactor), easeFactor }
  } else if (quality === 'hard') {
    newEF = Math.max(1.3, easeFactor - 0.15)
    return { interval: Math.ceil(currentInterval * 0.5), easeFactor: newEF }
  } else { // again
    newEF = Math.max(1.3, easeFactor - 0.2)
    return { interval: 1, easeFactor: newEF }
  }
}

export function RevisionPage() {
  const { session } = useAuthStore()
  const [activeTab, setActiveTab] = useState('due')
  const [flashcards, setFlashcards] = useState<{ due: Flashcard[]; upcoming: Flashcard[] }>({ due: [], upcoming: [] })
  const [loading, setLoading] = useState(true)
  const [reviewMode, setReviewMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionResults, setSessionResults] = useState<{ correct: number; hard: number; again: number }>({ correct: 0, hard: 0, again: 0 })
  const [sessionComplete, setSessionComplete] = useState(false)

  const load = useCallback(async () => {
    if (!session?.user.id) return
    setLoading(true)
    const now = new Date().toISOString()
    const upcoming7d = addDays(new Date(), 7).toISOString()

    const [{ data: dueCards }, { data: upcomingCards }] = await Promise.all([
      supabase.from('flashcards').select('*').eq('user_id', session.user.id).lte('next_review_at', now).order('next_review_at').limit(50),
      supabase.from('flashcards').select('*').eq('user_id', session.user.id).gt('next_review_at', now).lte('next_review_at', upcoming7d).order('next_review_at').limit(50),
    ])
    setFlashcards({ due: dueCards || [], upcoming: upcomingCards || [] })
    setLoading(false)
  }, [session?.user.id])

  useEffect(() => { load() }, [load])

  const startReview = () => {
    if (flashcards.due.length === 0) { toast.info('No cards due for review!'); return }
    setCurrentIndex(0)
    setFlipped(false)
    setSessionResults({ correct: 0, hard: 0, again: 0 })
    setSessionComplete(false)
    setReviewMode(true)
  }

  const handleRating = async (quality: 'easy' | 'good' | 'hard' | 'again') => {
    const card = flashcards.due[currentIndex]
    if (!card || !session?.user.id) return

    const { interval: newInterval, easeFactor: newEF } = getNextInterval(card.interval_days, quality, card.ease_factor)
    const nextReview = addDays(new Date(), newInterval).toISOString()

    // Update flashcard
    await supabase.from('flashcards').update({
      interval_days: newInterval,
      ease_factor: newEF,
      next_review_at: nextReview,
      review_count: card.review_count + 1,
      last_reviewed_at: new Date().toISOString(),
    }).eq('id', card.id)

    // Log attempt
    await supabase.from('review_attempts').insert({
      user_id: session.user.id,
      flashcard_id: card.id,
      quality: quality as any,
      was_correct: quality === 'easy' || quality === 'good',
    })

    setSessionResults(prev => ({
      correct: prev.correct + (quality === 'easy' || quality === 'good' ? 1 : 0),
      hard: prev.hard + (quality === 'hard' ? 1 : 0),
      again: prev.again + (quality === 'again' ? 1 : 0),
    }))

    if (currentIndex < flashcards.due.length - 1) {
      setCurrentIndex(i => i + 1)
      setFlipped(false)
    } else {
      setSessionComplete(true)
      // Award XP
      await supabase.from('user_xp_events').insert({
        user_id: session.user.id,
        amount: Math.max(5, flashcards.due.length * 2),
        reason: `Completed revision session: ${flashcards.due.length} cards`,
        source_type: 'revision',
      })
      toast.success('Revision session complete! 🧠')
    }
  }

  const currentCard = reviewMode ? flashcards.due[currentIndex] : null
  const tabs = [
    { id: 'due', label: 'Due Now', count: flashcards.due.length },
    { id: 'upcoming', label: 'Upcoming', count: flashcards.upcoming.length },
  ]

  if (reviewMode && !sessionComplete && currentCard) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col">
        <div className="h-14 flex items-center justify-between px-4 border-b border-surface-800">
          <button
            onClick={() => { setReviewMode(false); load() }}
            className="flex items-center gap-2 text-surface-400 hover:text-surface-200 text-sm"
          >
            <ChevronLeft className="h-4 w-4" /> Exit Review
          </button>
          <div className="text-sm text-surface-500">
            {currentIndex + 1} / {flashcards.due.length}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-400">✓ {sessionResults.correct}</span>
            <span className="text-amber-400">~ {sessionResults.hard}</span>
            <span className="text-rose-400">✗ {sessionResults.again}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-xl">
            {/* Progress */}
            <ProgressBar
              value={currentIndex}
              max={flashcards.due.length}
              color="accent"
              className="mb-8"
            />

            {/* Card */}
            <div
              className={cn(
                'card p-8 min-h-64 flex flex-col items-center justify-center text-center cursor-pointer',
                'transition-all duration-300 hover:border-accent-500/30',
                flipped && 'border-accent-500/30'
              )}
              onClick={() => !flipped && setFlipped(true)}
            >
              {!flipped ? (
                <div>
                  <p className="text-xs text-surface-500 mb-4">Question — click to reveal answer</p>
                  <p className="text-lg font-medium text-surface-100">{currentCard.front}</p>
                  <p className="text-xs text-surface-600 mt-6">Click to flip</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-emerald-500 mb-4">Answer</p>
                  <p className="text-base text-surface-100 leading-relaxed">{currentCard.back}</p>
                </div>
              )}
            </div>

            {/* Rating buttons */}
            {flipped && (
              <div className="mt-6">
                <p className="text-xs text-surface-500 text-center mb-3">How well did you remember this?</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'again', label: 'Again', subtitle: '<1d', color: 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' },
                    { key: 'hard', label: 'Hard', subtitle: 'soon', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' },
                    { key: 'good', label: 'Good', subtitle: `${currentCard.interval_days}d`, color: 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' },
                    { key: 'easy', label: 'Easy', subtitle: 'longer', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => handleRating(opt.key as any)}
                      className={cn(
                        'flex flex-col items-center p-3 rounded-lg border transition-all duration-150',
                        opt.color
                      )}
                    >
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span className="text-2xs opacity-70 mt-0.5">{opt.subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!flipped && (
              <div className="mt-4 text-center">
                <Button variant="primary" onClick={() => setFlipped(true)}>Show Answer</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (reviewMode && sessionComplete) {
    const total = flashcards.due.length
    const accuracy = total > 0 ? Math.round((sessionResults.correct / total) * 100) : 0
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold font-display text-surface-50 mb-2">Session Complete!</h2>
          <p className="text-surface-400 text-sm mb-6">Great work! You reviewed {total} flashcards.</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{sessionResults.correct}</div>
              <div className="text-xs text-surface-500">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{sessionResults.hard}</div>
              <div className="text-xs text-surface-500">Hard</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-400">{sessionResults.again}</div>
              <div className="text-xs text-surface-500">Missed</div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs text-surface-500 mb-1">Accuracy</p>
            <ProgressBar value={accuracy} color={accuracy >= 70 ? 'green' : accuracy >= 40 ? 'amber' : 'accent'} showLabel />
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={() => { setReviewMode(false); load() }}>
              Done
            </Button>
            <Button variant="primary" onClick={() => { startReview(); load() }}>
              Review Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Header title="Revision Center" subtitle="Spaced repetition for long-term retention" />
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">

        {/* Stats & Start */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="stat-card col-span-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="stat-label">Due for Review</span>
                <div className="stat-value mt-1">{flashcards.due.length}</div>
                <p className="text-xs text-surface-500 mt-1">
                  {flashcards.upcoming.length} more in the next 7 days
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={startReview}
                disabled={flashcards.due.length === 0}
                className="gap-2 shrink-0"
              >
                <Brain className="h-5 w-5" />
                {flashcards.due.length > 0 ? 'Start Review' : 'All Clear!'}
              </Button>
            </div>
          </Card>
          <Card className="stat-card">
            <span className="stat-label">Total Flashcards</span>
            <div className="stat-value">
              {flashcards.due.length + flashcards.upcoming.length}
            </div>
            <p className="text-xs text-surface-500 mt-1">Across all topics</p>
          </Card>
        </div>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : activeTab === 'due' ? (
          flashcards.due.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-10 w-10 text-emerald-400" />}
              title="You're all caught up!"
              description="No flashcards are due for review right now. Keep learning to add more cards."
              action={
                <Button variant="secondary" size="sm" onClick={() => window.location.href = '/learning'}>
                  Add Learning Notes
                </Button>
              }
            />
          ) : (
            <div className="grid gap-2">
              {flashcards.due.map(card => (
                <FlashcardRow key={card.id} card={card} isDue />
              ))}
            </div>
          )
        ) : (
          flashcards.upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming reviews"
              description="Keep reviewing cards to build your schedule"
            />
          ) : (
            <div className="grid gap-2">
              {flashcards.upcoming.map(card => (
                <FlashcardRow key={card.id} card={card} isDue={false} />
              ))}
            </div>
          )
        )}
      </div>
    </>
  )
}

function FlashcardRow({ card, isDue }: { card: Flashcard; isDue: boolean }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      className="rounded-xl border border-surface-800 bg-surface-900/40 overflow-hidden cursor-pointer hover:border-surface-700 transition-all"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 min-w-0">
          {isDue ? (
            <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          )}
          <p className="text-sm text-surface-200 truncate">{card.front}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs text-surface-500">
            {isDue ? 'Due' : format(new Date(card.next_review_at), 'd MMM')}
          </span>
          <span className="text-xs text-surface-600">×{card.review_count}</span>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-surface-800 bg-surface-800/30">
          <p className="text-xs text-surface-400 mb-1">Answer:</p>
          <p className="text-sm text-surface-300">{card.back}</p>
        </div>
      )}
    </div>
  )
}
