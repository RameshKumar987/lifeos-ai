import React, { useState, useMemo, useEffect } from 'react'
import {
  Code2, Plus, Search, Filter, CheckCircle2, Circle, Clock, Sparkles,
  ExternalLink, Play, BookOpen, Brain, Terminal, Tag, ChevronRight,
  Flame, Award, AlertCircle, RefreshCw, Copy, Check
} from 'lucide-react'
import { Header } from '../components/layout/Sidebar'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, ProgressBar } from '../components/ui'
import { toast } from 'sonner'
import { chatWithMentor } from '../lib/ai'

export interface DSAProblem {
  id: string
  title: string
  topic: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  status: 'todo' | 'solving' | 'solved' | 'mastered'
  leetcode_url?: string
  time_complexity: string
  space_complexity: string
  python_solution: string
  key_intuition: string
  edge_cases: string
  times_solved: number
  last_practiced: string
}

const INITIAL_PROBLEMS: DSAProblem[] = []

const TOPICS = [
  'All Topics',
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List & Hashmap',
  'Trees & BST',
  'Graphs (Topological Sort)',
  'Dynamic Programming',
  'Backtracking',
  'Heaps / Priority Queue'
]

export function PythonDSA() {
  const [problems, setProblems] = useState<DSAProblem[]>(() => {
    const saved = localStorage.getItem('lifeos_dsa_problems')
    return saved ? JSON.parse(saved) : INITIAL_PROBLEMS
  })

  const [selectedId, setSelectedId] = useState<string>(problems[0]?.id || '')
  const [selectedTopic, setSelectedTopic] = useState('All Topics')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [aiHintLoading, setAiHintLoading] = useState(false)
  const [aiHint, setAiHint] = useState<string | null>(null)

  // Form states
  const [fTitle, setFTitle] = useState('')
  const [fTopic, setFTopic] = useState('Arrays & Hashing')
  const [fDifficulty, setFDifficulty] = useState<DSAProblem['difficulty']>('Medium')
  const [fStatus, setFStatus] = useState<DSAProblem['status']>('todo')
  const [fUrl, setFUrl] = useState('')
  const [fTimeComp, setFTimeComp] = useState('O(N)')
  const [fSpaceComp, setFSpaceComp] = useState('O(1)')
  const [fSolution, setFSolution] = useState('')
  const [fIntuition, setFIntuition] = useState('')
  const [fEdgeCases, setFEdgeCases] = useState('')

  useEffect(() => {
    localStorage.setItem('lifeos_dsa_problems', JSON.stringify(problems))
  }, [problems])

  const selectedProblem = useMemo(() => {
    return problems.find(p => p.id === selectedId) || problems[0]
  }, [problems, selectedId])

  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      const matchTopic = selectedTopic === 'All Topics' || p.topic === selectedTopic
      const matchDiff = selectedDifficulty === 'all' || p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.key_intuition.toLowerCase().includes(searchQuery.toLowerCase())
      return matchTopic && matchDiff && matchSearch
    })
  }, [problems, selectedTopic, selectedDifficulty, searchQuery])

  const stats = useMemo(() => {
    const total = problems.length
    const mastered = problems.filter(p => p.status === 'mastered').length
    const solved = problems.filter(p => p.status === 'solved').length
    const solving = problems.filter(p => p.status === 'solving').length
    const easy = problems.filter(p => p.difficulty === 'Easy' && (p.status === 'solved' || p.status === 'mastered')).length
    const medium = problems.filter(p => p.difficulty === 'Medium' && (p.status === 'solved' || p.status === 'mastered')).length
    const hard = problems.filter(p => p.difficulty === 'Hard' && (p.status === 'solved' || p.status === 'mastered')).length

    return { total, mastered, solved, solving, easy, medium, hard }
  }, [problems])

  const handleCopyCode = () => {
    if (!selectedProblem) return
    navigator.clipboard.writeText(selectedProblem.python_solution)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success('Code copied to clipboard!')
  }

  const handleUpdateStatus = (id: string, newStatus: DSAProblem['status']) => {
    setProblems(prev => prev.map(p => {
      if (p.id !== id) return p
      return {
        ...p,
        status: newStatus,
        times_solved: newStatus === 'solved' || newStatus === 'mastered' ? p.times_solved + 1 : p.times_solved,
        last_practiced: new Date().toISOString()
      }
    }))
    toast.success(`Problem marked as ${newStatus}`)
  }

  const handleRequestAIHint = async () => {
    if (!selectedProblem) return
    setAiHintLoading(true)
    setAiHint(null)

    try {
      const response = await chatWithMentor([
        {
          role: 'user',
          content: `I am solving DSA problem: "${selectedProblem.title}" (${selectedProblem.topic}, Difficulty: ${selectedProblem.difficulty}).
Give me 2 progressive conceptual hints and point out tricky edge cases to think about, without writing the full final code. Help me build intuition for SDE-1 interviews.`
        }
      ], {
        recentTopics: [selectedProblem.topic],
        currentGoals: ['Targeting SDE-1 at FAANG/Tier-1']
      })

      if (response.success && response.content) {
        setAiHint(response.content)
      } else {
        // Fallback intuitive hint
        setAiHint(`💡 Intuitive Hint for ${selectedProblem.title}:\n\n` +
          `1. Consider what data structure lets you perform lookups or state transitions in O(1) or O(log N).\n` +
          `2. Check boundary conditions: empty array, single element, negative numbers, or cycles.\n` +
          `3. Think about invariant preservation: what stays constant after each step in your loop?`)
      }
    } catch {
      setAiHint(`💡 Intuitive Hint:\nBreak down the problem into sub-problems. Identify the bottleneck in the brute force approach and consider whether sorting, a hash table, or monotonic stack helps.`)
    } finally {
      setAiHintLoading(false)
    }
  }

  const handleAddProblem = () => {
    if (!fTitle.trim()) {
      toast.error('Title is required')
      return
    }

    const newProb: DSAProblem = {
      id: `p-${Date.now()}`,
      title: fTitle.trim(),
      topic: fTopic,
      difficulty: fDifficulty,
      status: fStatus,
      leetcode_url: fUrl.trim() || undefined,
      time_complexity: fTimeComp.trim() || 'O(N)',
      space_complexity: fSpaceComp.trim() || 'O(1)',
      python_solution: fSolution.trim() || '# Write your solution here\nclass Solution:\n    pass',
      key_intuition: fIntuition.trim() || 'Record the core pattern that unlocked this problem.',
      edge_cases: fEdgeCases.trim() || 'Check boundary conditions.',
      times_solved: fStatus === 'solved' || fStatus === 'mastered' ? 1 : 0,
      last_practiced: new Date().toISOString()
    }

    setProblems([newProb, ...problems])
    setSelectedId(newProb.id)
    setIsAddModalOpen(false)
    resetForm()
    toast.success('Problem added to your DSA catalog!')
  }

  const resetForm = () => {
    setFTitle('')
    setFTopic('Arrays & Hashing')
    setFDifficulty('Medium')
    setFStatus('todo')
    setFUrl('')
    setFTimeComp('O(N)')
    setFSpaceComp('O(1)')
    setFSolution('')
    setFIntuition('')
    setFEdgeCases('')
  }

  const getDifficultyBadge = (diff: DSAProblem['difficulty']) => {
    switch (diff) {
      case 'Easy': return <Badge variant="success">Easy</Badge>
      case 'Medium': return <Badge variant="yellow">Medium</Badge>
      case 'Hard': return <Badge variant="danger">Hard</Badge>
    }
  }

  const getStatusBadge = (status: DSAProblem['status']) => {
    switch (status) {
      case 'mastered': return <Badge variant="accent">Mastered ★</Badge>
      case 'solved': return <Badge variant="blue">Solved</Badge>
      case 'solving': return <Badge variant="yellow">In Progress</Badge>
      case 'todo': return <Badge variant="gray">To Do</Badge>
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-surface-950">
      <Header
        title="Python & DSA Master Lab"
        subtitle="SDE-1 placement preparation — Data Structures, Algorithms, Space/Time complexity & AI Hints"
        actions={
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Add Problem</span>
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="p-3 bg-surface-900/60 border-surface-800">
            <span className="text-2xs text-surface-400 font-medium">Total Problems</span>
            <p className="text-xl font-bold font-display text-surface-50 mt-0.5">{stats.total}</p>
          </Card>
          <Card className="p-3 bg-surface-900/60 border-surface-800">
            <span className="text-2xs text-emerald-400 font-medium">Easy Solved</span>
            <p className="text-xl font-bold font-display text-emerald-400 mt-0.5">{stats.easy}</p>
          </Card>
          <Card className="p-3 bg-surface-900/60 border-surface-800">
            <span className="text-2xs text-amber-400 font-medium">Medium Solved</span>
            <p className="text-xl font-bold font-display text-amber-400 mt-0.5">{stats.medium}</p>
          </Card>
          <Card className="p-3 bg-surface-900/60 border-surface-800">
            <span className="text-2xs text-rose-400 font-medium">Hard Solved</span>
            <p className="text-xl font-bold font-display text-rose-400 mt-0.5">{stats.hard}</p>
          </Card>
          <Card className="p-3 bg-surface-900/60 border-surface-800">
            <span className="text-2xs text-accent-400 font-medium">Mastered</span>
            <p className="text-xl font-bold font-display text-accent-400 mt-0.5">{stats.mastered}</p>
          </Card>
          <Card className="p-3 bg-surface-900/60 border-surface-800">
            <span className="text-2xs text-blue-400 font-medium">Target Company</span>
            <p className="text-xs font-semibold text-surface-200 mt-1 truncate">Google / Tier 1</p>
          </Card>
        </div>

        {/* Filter and Topic Row */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 max-w-3xl hide-scrollbar">
            {TOPICS.slice(0, 7).map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                  selectedTopic === topic
                    ? 'bg-accent-600 text-white shadow-sm'
                    : 'bg-surface-900 text-surface-400 hover:text-surface-200 border border-surface-800'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <div className="w-full sm:w-60">
              <Input
                type="text"
                placeholder="Search problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-surface-400" />}
              />
            </div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-surface-900 border border-surface-800 rounded-lg text-xs text-surface-300 px-3 py-2 shrink-0 outline-none focus:border-accent-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Two-Column Problem Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Problem List */}
          <div className="lg:col-span-5 space-y-2.5">
            {filteredProblems.length === 0 ? (
              <EmptyState
                icon={<Code2 className="h-10 w-10 text-surface-600" />}
                title="No problems found"
                description="Try selecting a different topic or add a new DSA question."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                    Add Problem
                  </Button>
                }
              />
            ) : (
              filteredProblems.map((prob) => {
                const isSelected = prob.id === selectedId
                return (
                  <Card
                    key={prob.id}
                    onClick={() => {
                      setSelectedId(prob.id)
                      setAiHint(null)
                    }}
                    className={`p-3.5 cursor-pointer transition-all hover:border-surface-700 ${
                      isSelected
                        ? 'border-accent-500/70 bg-surface-900/90 ring-1 ring-accent-500/30'
                        : 'bg-surface-900/40 border-surface-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-surface-100 truncate">
                            {prob.title}
                          </h4>
                          {prob.times_solved > 0 && (
                            <span className="text-3xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {prob.times_solved}x
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-400 mt-0.5">{prob.topic}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {getDifficultyBadge(prob.difficulty)}
                        {getStatusBadge(prob.status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-surface-800/60 text-2xs text-surface-400 font-mono">
                      <span>Time: <strong className="text-surface-300">{prob.time_complexity}</strong></span>
                      <span>Space: <strong className="text-surface-300">{prob.space_complexity}</strong></span>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          {/* Problem Details & Solution Code Panel */}
          <div className="lg:col-span-7">
            {selectedProblem ? (
              <div className="space-y-5">
                {/* Header Card */}
                <Card className="p-6 bg-surface-900/60 border-surface-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold font-display text-surface-50">
                          {selectedProblem.title}
                        </h2>
                        {getDifficultyBadge(selectedProblem.difficulty)}
                        {getStatusBadge(selectedProblem.status)}
                      </div>
                      <p className="text-xs text-surface-400 mt-1">Topic: <span className="text-accent-400 font-medium">{selectedProblem.topic}</span></p>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedProblem.leetcode_url && (
                        <a
                          href={selectedProblem.leetcode_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary btn-sm gap-1.5 text-xs"
                        >
                          <span>LeetCode</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRequestAIHint}
                        loading={aiHintLoading}
                        className="gap-1.5 text-xs text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        AI Hint
                      </Button>
                    </div>
                  </div>

                  {/* Quick status switch buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-surface-800">
                    <span className="text-2xs text-surface-500 uppercase tracking-wider font-semibold mr-1 self-center">Status:</span>
                    {(['todo', 'solving', 'solved', 'mastered'] as DSAProblem['status'][]).map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedProblem.id, st)}
                        className={`px-2.5 py-1 text-2xs rounded capitalize font-medium transition-colors ${
                          selectedProblem.status === st
                            ? 'bg-accent-600 text-white'
                            : 'bg-surface-800/80 text-surface-400 hover:text-surface-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Complexity & Key Intuition */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="p-3 bg-surface-950/60 rounded-xl border border-surface-800">
                      <span className="text-2xs font-semibold uppercase text-accent-400 tracking-wider">
                        Core Intuition & Pattern
                      </span>
                      <p className="text-xs text-surface-200 mt-1 leading-relaxed">
                        {selectedProblem.key_intuition}
                      </p>
                    </div>

                    <div className="p-3 bg-surface-950/60 rounded-xl border border-surface-800">
                      <span className="text-2xs font-semibold uppercase text-rose-400 tracking-wider">
                        Tricky Edge Cases
                      </span>
                      <p className="text-xs text-surface-200 mt-1 leading-relaxed">
                        {selectedProblem.edge_cases}
                      </p>
                    </div>
                  </div>

                  {/* AI Hint Section if generated */}
                  {aiHint && (
                    <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          AI Mentor Intuition & Socratic Guidance
                        </h5>
                      </div>
                      <p className="text-xs whitespace-pre-wrap leading-relaxed font-sans">
                        {aiHint}
                      </p>
                    </div>
                  )}
                </Card>

                {/* Python Solution Editor / Preview */}
                <Card className="bg-surface-950 border-surface-800 overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-surface-900 border-b border-surface-800">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-2xs font-mono text-surface-400 ml-2">solution.py</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-2xs font-mono text-surface-400">
                        Time: <span className="text-accent-300 font-bold">{selectedProblem.time_complexity}</span> | Space: <span className="text-accent-300 font-bold">{selectedProblem.space_complexity}</span>
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className="btn-ghost p-1.5 rounded text-surface-400 hover:text-white"
                        title="Copy solution code"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <pre className="p-4 text-xs font-mono text-surface-200 overflow-x-auto leading-relaxed bg-[#0d1117] selection:bg-accent-500/30">
                    <code>{selectedProblem.python_solution}</code>
                  </pre>
                </Card>
              </div>
            ) : (
              <EmptyState
                icon={<Code2 className="h-10 w-10 text-surface-600" />}
                title="Select a DSA problem"
                description="Pick a question from the left catalog to study its complexity, intuition, and Python implementation."
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Problem */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Python & DSA Problem"
      >
        <div className="space-y-4">
          <Input
            label="Problem Title *"
            placeholder="e.g. Subarray Sum Equals K"
            value={fTitle}
            onChange={(e) => setFTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Topic"
              value={fTopic}
              onChange={(e) => setFTopic(e.target.value)}
              options={TOPICS.filter(t => t !== 'All Topics').map(t => ({ value: t, label: t }))}
            />
            <Select
              label="Difficulty"
              value={fDifficulty}
              onChange={(e) => setFDifficulty(e.target.value as any)}
              options={[
                { value: 'Easy', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Hard', label: 'Hard' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="LeetCode / Reference URL"
              placeholder="https://leetcode.com/problems/..."
              value={fUrl}
              onChange={(e) => setFUrl(e.target.value)}
            />
            <Input
              label="Time Complexity"
              placeholder="O(N)"
              value={fTimeComp}
              onChange={(e) => setFTimeComp(e.target.value)}
            />
            <Input
              label="Space Complexity"
              placeholder="O(1)"
              value={fSpaceComp}
              onChange={(e) => setFSpaceComp(e.target.value)}
            />
          </div>

          <Textarea
            label="Key Intuition (Why this approach works)"
            placeholder="e.g. Prefix sum with hashmap of frequencies allows counting subarrays in single pass..."
            value={fIntuition}
            onChange={(e) => setFIntuition(e.target.value)}
            rows={2}
          />

          <Textarea
            label="Edge Cases"
            placeholder="e.g. k=0, negative numbers in array, all elements same..."
            value={fEdgeCases}
            onChange={(e) => setFEdgeCases(e.target.value)}
            rows={2}
          />

          <Textarea
            label="Python Solution Code *"
            placeholder="def subarraySum(self, nums: list[int], k: int) -> int: ..."
            value={fSolution}
            onChange={(e) => setFSolution(e.target.value)}
            rows={6}
            className="font-mono text-xs"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddProblem}>
              Save Problem
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
