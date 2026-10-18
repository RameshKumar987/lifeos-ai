import React, { useState, useMemo } from 'react'
import {
  Users, Plus, Trophy, Flame, Shield, CheckCircle2, Circle, Clock,
  Copy, Check, Share2, Sparkles, AlertCircle, MessageSquare, Award
} from 'lucide-react'
import { Header } from '../components/layout/Sidebar'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, Avatar } from '../components/ui'
import { useAuthStore } from '../store'
import { toast } from 'sonner'

interface SquadMember {
  id: string
  name: string
  avatar: string
  role: 'Leader' | 'Member'
  streak: number
  score: number
  rank: number
  target: string
  statusToday: 'logged' | 'pending'
}

interface Challenge {
  id: string
  title: string
  description: string
  targetValue: number
  unit: string
  startDate: string
  endDate: string
  daysLeft: number
  participantsCount: number
}

export function Squad() {
  const { profile } = useAuthStore()
  const [members, setMembers] = useState<SquadMember[]>(() => [
    {
      id: profile?.id || 'm1',
      name: profile?.full_name || 'My Account',
      avatar: profile?.avatar_url || '',
      role: 'Leader',
      streak: profile?.streak_current || 0,
      score: profile?.xp_total || 0,
      rank: 1,
      target: profile?.career_target || 'Target SDE-1',
      statusToday: 'pending',
    }
  ])
  const [inviteCode] = useState('LIFEOS-2027-ALPHA')
  const [isCopied, setIsCopied] = useState(false)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  // Log submission
  const [logNotes, setLogNotes] = useState('')
  const [logValue, setLogValue] = useState('2')

  const activeChallenge: Challenge = {
    id: 'ch-1',
    title: '30-Day SDE Placement Sprint',
    description: 'Solve at least 2 DSA problems and log minimum 4 hours of focused engineering daily.',
    targetValue: 60,
    unit: 'problems',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    daysLeft: 13,
    participantsCount: 4,
  }

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`Join my LifeOS AI Accountability Squad! Use invite code: ${inviteCode}`)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success('Invite code copied to clipboard!')
  }

  const handleSubmitDailyLog = () => {
    if (!logNotes.trim()) {
      toast.error('Please add brief summary notes')
      return
    }

    setMembers(prev => prev.map(m => {
      if (m.id === 'm1') {
        return {
          ...m,
          score: m.score + Number(logValue) * 20,
          statusToday: 'logged'
        }
      }
      return m
    }))

    setIsLogModalOpen(false)
    setLogNotes('')
    toast.success('🎉 Daily accountability log recorded and verified!')
  }

  return (
    <div className="min-h-full flex flex-col bg-surface-950">
      <Header
        title="Accountability Squad & Community"
        subtitle="Study circles, peer challenges, and daily verified progress logs with friends"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <Share2 className="h-4 w-4" />
              <span>Invite Friend</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsLogModalOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Log Today</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Active Challenge Spotlight Banner */}
        <Card className="p-6 bg-gradient-to-r from-surface-900 via-surface-900 to-accent-950/40 border-surface-800 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="accent">Active Challenge</Badge>
                <span className="text-2xs text-amber-400 font-mono font-semibold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {activeChallenge.daysLeft} days remaining
                </span>
              </div>
              <h2 className="text-xl font-bold font-display text-surface-50">
                {activeChallenge.title}
              </h2>
              <p className="text-xs text-surface-400 max-w-xl leading-relaxed">
                {activeChallenge.description}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-surface-950/70 p-4 rounded-xl border border-surface-800 shrink-0">
              <div className="text-center">
                <span className="text-2xs text-surface-400 uppercase font-mono">Participants</span>
                <p className="text-lg font-bold text-surface-100 font-display mt-0.5">{activeChallenge.participantsCount}</p>
              </div>
              <div className="h-8 w-px bg-surface-800" />
              <div className="text-center">
                <span className="text-2xs text-surface-400 uppercase font-mono">Squad Streak</span>
                <p className="text-lg font-bold text-amber-400 font-display mt-0.5">7 Days 🔥</p>
              </div>
              <div className="h-8 w-px bg-surface-800" />
              <div className="text-center">
                <span className="text-2xs text-surface-400 uppercase font-mono">Status</span>
                <p className="text-xs font-bold text-emerald-400 mt-1">Verified</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Squad Leaderboard & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Leaderboard Table */}
          <Card className="lg:col-span-8 p-6 bg-surface-900/60 border-surface-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-surface-100 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Squad Standings & Daily Logs
                </h3>
                <p className="text-xs text-surface-400">Rankings based on verified problem submissions and focus hours</p>
              </div>
              <Badge variant="blue">Oct 2026</Badge>
            </div>

            <div className="space-y-3 pt-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    member.rank === 1
                      ? 'bg-surface-950/80 border-amber-500/40 shadow-sm ring-1 ring-amber-500/20'
                      : 'bg-surface-950/50 border-surface-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center font-bold font-mono text-sm">
                      {member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : member.rank === 3 ? '🥉' : `#${member.rank}`}
                    </div>
                    <Avatar name={member.name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-surface-100">{member.name}</span>
                        {member.role === 'Leader' && <Badge variant="accent">Squad Lead</Badge>}
                      </div>
                      <p className="text-2xs text-surface-400 font-mono mt-0.5">Target: {member.target}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-auto text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Flame className="h-4 w-4" />
                      <span>{member.streak}d</span>
                    </div>

                    <div className="text-right">
                      <span className="text-surface-100 font-bold">{member.score}</span>
                      <span className="text-surface-500 text-2xs ml-1">XP</span>
                    </div>

                    <div>
                      {member.statusToday === 'logged' ? (
                        <span className="px-2.5 py-1 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Logged
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-2xs font-semibold bg-surface-800 text-surface-400 border border-surface-700 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Side Info & Motivation Feed */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5 bg-surface-900/60 border-surface-800 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent-400" />
                <h4 className="text-sm font-bold text-surface-100">Squad Guidelines</h4>
              </div>
              <ul className="text-xs text-surface-400 space-y-2 list-disc list-inside leading-relaxed">
                <li>Check in daily before 11:59 PM to protect your squad streak.</li>
                <li>Fake logs or unattempted tasks reset weekly multiplier.</li>
                <li>Conduct weekly peer code reviews on Friday evenings.</li>
                <li>Top scorer each month receives peer interview mentorship.</li>
              </ul>
            </Card>

            <Card className="p-5 bg-surface-900/60 border-surface-800 space-y-3">
              <h4 className="text-sm font-bold text-surface-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Squad Invite Code
              </h4>
              <p className="text-xs text-surface-400">Share with classmates targeting Google, Microsoft & Amazon placements.</p>
              <div className="p-3 bg-surface-950 rounded-xl border border-surface-800 flex items-center justify-between font-mono text-xs">
                <span className="text-accent-300 font-bold tracking-wider">{inviteCode}</span>
                <button
                  onClick={handleCopyInvite}
                  className="btn-ghost p-1.5 rounded text-surface-400 hover:text-white"
                  title="Copy Code"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal: Daily Log */}
      <Modal
        open={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Submit Daily Accountability Log"
      >
        <div className="space-y-4">
          <Input
            label="DSA Problems Solved Today"
            type="number"
            value={logValue}
            onChange={(e) => setLogValue(e.target.value)}
          />
          <Textarea
            label="Key Learning / Topics Covered *"
            placeholder="e.g. Solved LRU Cache and Trapping Rain Water. Revised German A2 modal verbs."
            value={logNotes}
            onChange={(e) => setLogNotes(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitDailyLog}>
              Verify & Submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Invite Friend */}
      <Modal
        open={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Friend to Accountability Circle"
      >
        <div className="space-y-4">
          <p className="text-xs text-surface-300 leading-relaxed">
            Invite classmates or fellow developers to join your private LifeOS study circle. You will be able to compare streak progress, share challenges, and hold each other accountable.
          </p>
          <div className="p-3 bg-surface-950 rounded-xl border border-surface-800 flex items-center justify-between font-mono text-xs">
            <span className="text-accent-300 font-bold">{inviteCode}</span>
            <Button variant="secondary" size="sm" onClick={handleCopyInvite} className="gap-1.5">
              {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>Copy</span>
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setIsInviteModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
