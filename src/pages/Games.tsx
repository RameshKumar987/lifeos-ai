import React, { useState, useEffect, useMemo } from 'react'
import {
  Gamepad2, Flame, Award, Zap, Trophy, Star, CheckCircle2, Circle,
  Timer, Sparkles, RefreshCw, ChevronRight, Shield, Swords, Target
} from 'lucide-react'
import { Header } from '../components/layout/Sidebar'
import { Card, Button, ProgressBar, Badge } from '../components/ui'
import { useAuthStore } from '../store'
import { calculateLevel, getLevelName, cn } from '../lib/utils'
import { toast } from 'sonner'

interface Quest {
  id: string
  title: string
  category: 'dsa' | 'german' | 'english' | 'revision'
  xp: number
  progress: number
  total: number
  completed: boolean
}

interface AchievementItem {
  id: string
  title: string
  description: string
  icon: string
  xp: number
  unlocked: boolean
  unlockedAt?: string
}

interface MiniGameQuestion {
  word: string
  article: 'der' | 'die' | 'das'
  meaning: string
}

const MINI_GAME_QUESTIONS: MiniGameQuestion[] = [
  { word: 'Schlüssel', article: 'der', meaning: 'key' },
  { word: 'Entscheidung', article: 'die', meaning: 'decision' },
  { word: 'Ergebnis', article: 'das', meaning: 'result' },
  { word: 'Herausforderung', article: 'die', meaning: 'challenge' },
  { word: 'Ziel', article: 'das', meaning: 'goal' },
  { word: 'Unterschied', article: 'der', meaning: 'difference' },
  { word: 'Lösung', article: 'die', meaning: 'solution' },
  { word: 'Problem', article: 'das', meaning: 'problem' },
  { word: 'Fehler', article: 'der', meaning: 'bug / error' },
  { word: 'Zukunft', article: 'die', meaning: 'future' },
]

export function Games() {
  const { profile, setProfile } = useAuthStore()

  // Dynamic XP and Quests
  const currentXP = profile?.xp_total ?? 1250
  const currentStreak = profile?.streak_current ?? 7
  const { level, currentXP: levelCurrentXP, nextLevelXP } = calculateLevel(currentXP)

  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('lifeos_daily_quests')
    if (saved) return JSON.parse(saved)
    return [
      { id: 'q1', title: 'Solve 1 Medium LeetCode DSA problem', category: 'dsa', xp: 60, progress: 1, total: 1, completed: true },
      { id: 'q2', title: 'Complete 10 Spaced Repetition flashcards', category: 'revision', xp: 40, progress: 7, total: 10, completed: false },
      { id: 'q3', title: 'Practice 2 minutes of spoken English in English Lab', category: 'english', xp: 50, progress: 0, total: 2, completed: false },
      { id: 'q4', title: 'Score 5+ in German Article Speed Blitz', category: 'german', xp: 45, progress: 0, total: 5, completed: false },
    ]
  })

  const [achievements, setAchievements] = useState<AchievementItem[]>(() => {
    const saved = localStorage.getItem('lifeos_achievements')
    if (saved) return JSON.parse(saved)
    return [
      { id: 'a1', title: 'Day One Pioneer', description: 'Log in and initialize LifeOS workspace', icon: '🚀', xp: 50, unlocked: true, unlockedAt: '2026-10-10' },
      { id: 'a2', title: 'Week of Iron Focus', description: 'Maintain a 7-day learning & attendance streak', icon: '🔥', xp: 150, unlocked: true, unlockedAt: '2026-10-17' },
      { id: 'a3', title: 'Algorithm Knight', description: 'Master 10 medium/hard DSA problems', icon: '⚔️', xp: 200, unlocked: false },
      { id: 'a4', title: 'Polyglot Mindset', description: 'Complete 20 German & English lab exercises', icon: '🌍', xp: 250, unlocked: false },
      { id: 'a5', title: 'Synapse Supercharger', description: 'Review 50 flashcards using spaced repetition', icon: '🧠', xp: 300, unlocked: false },
      { id: 'a6', title: 'FAANG Ready', description: 'Reach Level 10 and complete 3 full projects', icon: '👑', xp: 500, unlocked: false },
    ]
  })

  // Mini-Game State: "Article Speed Blitz"
  const [isPlayingGame, setIsPlayingGame] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [gameTimer, setGameTimer] = useState(30)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [gameFeedback, setGameFeedback] = useState<'correct' | 'wrong' | null>(null)

  useEffect(() => {
    localStorage.setItem('lifeos_daily_quests', JSON.stringify(quests))
  }, [quests])

  useEffect(() => {
    localStorage.setItem('lifeos_achievements', JSON.stringify(achievements))
  }, [achievements])

  // Mini Game Timer
  useEffect(() => {
    let interval: any = null
    if (isPlayingGame && gameTimer > 0) {
      interval = setInterval(() => {
        setGameTimer(prev => prev - 1)
      }, 1000)
    } else if (gameTimer === 0 && isPlayingGame) {
      setIsPlayingGame(false)
      const earnedXP = gameScore * 10
      toast.success(`🎮 Game Over! You scored ${gameScore} and earned +${earnedXP} XP!`)
      awardXP(earnedXP)

      // Complete quest if score >= 5
      if (gameScore >= 5) {
        setQuests(prev => prev.map(q => q.id === 'q4' ? { ...q, progress: 5, completed: true } : q))
      }
    }
    return () => clearInterval(interval)
  }, [isPlayingGame, gameTimer])

  const awardXP = (amount: number) => {
    if (profile) {
      const updated = { ...profile, xp_total: (profile.xp_total || 0) + amount }
      setProfile(updated)
    }
  }

  const handleStartGame = () => {
    setGameScore(0)
    setGameTimer(30)
    setCurrentQIndex(0)
    setGameFeedback(null)
    setIsPlayingGame(true)
  }

  const handleAnswerArticle = (choice: 'der' | 'die' | 'das') => {
    if (!isPlayingGame) return
    const currentQ = MINI_GAME_QUESTIONS[currentQIndex % MINI_GAME_QUESTIONS.length]
    if (choice === currentQ.article) {
      setGameScore(prev => prev + 1)
      setGameFeedback('correct')
    } else {
      setGameFeedback('wrong')
    }

    setTimeout(() => {
      setGameFeedback(null)
      setCurrentQIndex(prev => prev + 1)
    }, 300)
  }

  const handleClaimQuest = (questId: string, xpReward: number) => {
    setQuests(prev => prev.map(q => {
      if (q.id !== questId) return q
      return { ...q, completed: true, progress: q.total }
    }))
    awardXP(xpReward)
    toast.success(`⭐ Quest completed! +${xpReward} XP awarded!`)
  }

  const activeQuestion = MINI_GAME_QUESTIONS[currentQIndex % MINI_GAME_QUESTIONS.length]

  return (
    <div className="min-h-full flex flex-col bg-surface-950">
      <Header
        title="Quests & Gamification Hub"
        subtitle="Level up your career preparation with XP, daily streaks, quests, and rapid recall mini-games"
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Hero Character & Level Banner */}
        <Card className="p-6 bg-gradient-to-r from-accent-950/60 via-surface-900 to-surface-900 border-accent-500/30 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-500 to-electric-600 flex items-center justify-center shadow-lg shadow-accent-600/20 text-3xl">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-display text-surface-50">
                    Level {level} — {getLevelName(level)}
                  </h2>
                  <Badge variant="accent">SDE-1 Aspirant</Badge>
                </div>
                <p className="text-xs text-surface-400 mt-1">
                  Keep progressing through daily revisions and coding challenges to unlock Grandmaster rank.
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <Flame className="h-4 w-4" />
                    <span>{currentStreak} Day Streak</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <Shield className="h-4 w-4" />
                    <span>Streak Shield Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-2 bg-surface-950/60 p-4 rounded-xl border border-surface-800">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-surface-400">Total XP</span>
                <span className="text-amber-400 font-bold">{currentXP} XP</span>
              </div>
              <ProgressBar value={levelCurrentXP} max={nextLevelXP} size="sm" color="amber" />
              <div className="flex justify-between text-3xs text-surface-500 font-mono">
                <span>Lv.{level}</span>
                <span>{nextLevelXP - levelCurrentXP} XP to Level {level + 1}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Two-Column Grid: Quests & Mini-Game */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Quests Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent-400" />
                <h3 className="text-base font-bold text-surface-100">Daily Growth Quests</h3>
              </div>
              <span className="text-2xs text-surface-500 font-mono">Resets every midnight (Asia/Kolkata)</span>
            </div>

            <div className="space-y-3">
              {quests.map((quest) => {
                const canClaim = !quest.completed && quest.progress >= quest.total
                return (
                  <Card
                    key={quest.id}
                    className={`p-4 transition-all ${
                      quest.completed
                        ? 'bg-surface-950/40 border-surface-800/40 opacity-75'
                        : 'bg-surface-900/60 border-surface-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {quest.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-surface-500" />
                          )}
                        </div>
                        <div>
                          <h4 className={`text-sm font-semibold ${quest.completed ? 'line-through text-surface-500' : 'text-surface-100'}`}>
                            {quest.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5 text-2xs text-surface-400 font-mono">
                            <span className="text-amber-400 font-bold">+{quest.xp} XP</span>
                            <span>Progress: {quest.progress}/{quest.total}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {quest.completed ? (
                          <Badge variant="success">Claimed ✓</Badge>
                        ) : canClaim ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleClaimQuest(quest.id, quest.xp)}
                            className="text-xs"
                          >
                            Claim XP
                          </Button>
                        ) : (
                          <span className="text-2xs text-surface-500 font-mono">In Progress</span>
                        )}
                      </div>
                    </div>

                    {!quest.completed && (
                      <div className="mt-3">
                        <ProgressBar value={quest.progress} max={quest.total} size="xs" color="violet" />
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>

            {/* Achievements Showcase */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-surface-100">Milestone Achievements</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {achievements.map((ach) => (
                  <Card
                    key={ach.id}
                    className={`p-3.5 flex flex-col justify-between border transition-all ${
                      ach.unlocked
                        ? 'bg-surface-900/80 border-amber-500/30 shadow-md'
                        : 'bg-surface-950/40 border-surface-800/40 opacity-50 grayscale'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{ach.icon}</span>
                        {ach.unlocked ? (
                          <span className="text-3xs text-emerald-400 font-mono font-semibold">Unlocked</span>
                        ) : (
                          <span className="text-3xs text-surface-500 font-mono">Locked</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-surface-100 mt-2 line-clamp-1">{ach.title}</h4>
                      <p className="text-3xs text-surface-400 mt-0.5 line-clamp-2">{ach.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-surface-800/60 flex justify-between items-center text-3xs font-mono">
                      <span className="text-amber-400 font-bold">+{ach.xp} XP</span>
                      {ach.unlockedAt && <span className="text-surface-500">{ach.unlockedAt}</span>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Mini-Game Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-electric-400" />
              <h3 className="text-base font-bold text-surface-100">German Article Blitz</h3>
            </div>

            <Card className="p-6 bg-surface-900/60 border-surface-800 flex flex-col justify-between min-h-[380px] text-center relative overflow-hidden shadow-xl">
              {!isPlayingGame ? (
                <div className="my-auto space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-surface-800/80 flex items-center justify-center text-3xl">
                    ⏱️
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-surface-50">30-Second Speed Recall</h4>
                    <p className="text-xs text-surface-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      German nouns appear rapidly. Choose the correct grammatical gender (<strong className="text-blue-400">der</strong>, <strong className="text-rose-400">die</strong>, or <strong className="text-emerald-400">das</strong>) to build your streak and earn +10 XP per hit!
                    </p>
                  </div>
                  <Button variant="primary" size="md" onClick={handleStartGame} className="gap-2 mx-auto">
                    <Sparkles className="h-4 w-4" />
                    Start Blitz Challenge
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col justify-between h-full space-y-6">
                  {/* Top Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                      <Timer className="h-4 w-4" />
                      <span>{gameTimer}s</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      Score: {gameScore}
                    </div>
                  </div>

                  {/* Word Card */}
                  <div
                    className={cn(
                      'p-8 rounded-2xl bg-surface-950 border transition-all duration-200',
                      gameFeedback === 'correct' && 'border-emerald-500 bg-emerald-500/10 scale-105',
                      gameFeedback === 'wrong' && 'border-rose-500 bg-rose-500/10 scale-95',
                      !gameFeedback && 'border-surface-800'
                    )}
                  >
                    <span className="text-2xs uppercase tracking-widest text-surface-500 font-mono">
                      Meaning: {activeQuestion.meaning}
                    </span>
                    <h2 className="text-3xl font-extrabold text-surface-50 font-display mt-2">
                      {activeQuestion.word}
                    </h2>
                  </div>

                  {/* der / die / das Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleAnswerArticle('der')}
                      className="py-4 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-bold font-mono text-base transition-all active:scale-95 shadow-md shadow-blue-500/10"
                    >
                      der
                    </button>
                    <button
                      onClick={() => handleAnswerArticle('die')}
                      className="py-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold font-mono text-base transition-all active:scale-95 shadow-md shadow-rose-500/10"
                    >
                      die
                    </button>
                    <button
                      onClick={() => handleAnswerArticle('das')}
                      className="py-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold font-mono text-base transition-all active:scale-95 shadow-md shadow-emerald-500/10"
                    >
                      das
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
