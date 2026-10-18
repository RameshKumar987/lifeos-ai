import React, { useState, useEffect, useMemo } from 'react'
import {
  FolderKanban, Plus, ExternalLink, GitBranch, CheckCircle2, Circle, Clock,
  AlertTriangle, Lightbulb, Bug, Layers, Calendar, Edit3, Trash2,
  ChevronRight, Filter, Search, Tag, Sparkles, ArrowUpRight
} from 'lucide-react'
import { Header } from '../components/layout/Sidebar'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, ProgressBar } from '../components/ui'
import { useAuthStore } from '../store'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import type { Project, ProjectMilestone, ProjectLog } from '../types/database.types'

type ProjectFilter = 'all' | 'active' | 'planning' | 'completed' | 'on_hold'

type ProjectWithDetails = Project & { milestones: ProjectMilestone[]; logs: ProjectLog[] }
const INITIAL_DEMO_PROJECTS: ProjectWithDetails[] = []

export function Projects() {
  const { session } = useAuthStore()
  const [projects, setProjects] = useState<typeof INITIAL_DEMO_PROJECTS>(() => {
    const saved = localStorage.getItem('lifeos_projects')
    return saved ? JSON.parse(saved) : INITIAL_DEMO_PROJECTS
  })
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '')
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [isNewMilestoneModalOpen, setIsNewMilestoneModalOpen] = useState(false)
  const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false)

  // New Project Form
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formProblem, setFormProblem] = useState('')
  const [formGoals, setFormGoals] = useState('')
  const [formTechStack, setFormTechStack] = useState('')
  const [formStatus, setFormStatus] = useState<Project['status']>('planning')
  const [formGithub, setFormGithub] = useState('')
  const [formLive, setFormLive] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [formNextAction, setFormNextAction] = useState('')
  const [formArch, setFormArch] = useState('')

  // New Milestone Form
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDueDate, setMilestoneDueDate] = useState('')

  // New Log Form
  const [logType, setLogType] = useState<ProjectLog['log_type']>('progress')
  const [logContent, setLogContent] = useState('')

  useEffect(() => {
    localStorage.setItem('lifeos_projects', JSON.stringify(projects))
  }, [projects])

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0]
  }, [projects, selectedProjectId])

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesFilter = filter === 'all' || p.status === filter
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tech_stack || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesFilter && matchesSearch
    })
  }, [projects, filter, searchQuery])

  const handleCreateProject = () => {
    if (!formName.trim()) {
      toast.error('Project title is required')
      return
    }

    const newProject: typeof INITIAL_DEMO_PROJECTS[0] = {
      id: `proj-${Date.now()}`,
      user_id: session?.user.id || 'demo-user',
      name: formName.trim(),
      description: formDescription.trim() || null,
      problem_statement: formProblem.trim() || null,
      goals: formGoals.trim() || null,
      tech_stack: formTechStack.split(',').map(s => s.trim()).filter(Boolean),
      status: formStatus,
      github_url: formGithub.trim() || null,
      live_url: formLive.trim() || null,
      deadline: formDeadline || null,
      next_action: formNextAction.trim() || null,
      architecture_notes: formArch.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      milestones: [],
      logs: [{
        id: `log-${Date.now()}`,
        project_id: `proj-${Date.now()}`,
        user_id: session?.user.id || 'demo-user',
        log_type: 'progress',
        content: `Project created with status "${formStatus}"`,
        created_at: new Date().toISOString()
      }]
    }

    setProjects([newProject, ...projects])
    setSelectedProjectId(newProject.id)
    setIsNewProjectModalOpen(false)
    resetProjectForm()
    toast.success('Project created successfully!')
  }

  const resetProjectForm = () => {
    setFormName('')
    setFormDescription('')
    setFormProblem('')
    setFormGoals('')
    setFormTechStack('')
    setFormStatus('planning')
    setFormGithub('')
    setFormLive('')
    setFormDeadline('')
    setFormNextAction('')
    setFormArch('')
  }

  const handleToggleMilestone = (milestoneId: string) => {
    if (!selectedProject) return
    const updatedProjects = projects.map(p => {
      if (p.id !== selectedProject.id) return p
      const updatedMilestones = p.milestones.map(m => {
        if (m.id !== milestoneId) return m
        return {
          ...m,
          completed_at: m.completed_at ? null : new Date().toISOString()
        }
      })
      return { ...p, milestones: updatedMilestones }
    })
    setProjects(updatedProjects)
    toast.success('Milestone updated')
  }

  const handleAddMilestone = () => {
    if (!milestoneTitle.trim() || !selectedProject) return
    const newM: ProjectMilestone = {
      id: `m-${Date.now()}`,
      project_id: selectedProject.id,
      title: milestoneTitle.trim(),
      due_date: milestoneDueDate || null,
      completed_at: null,
      order_index: selectedProject.milestones.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: null
    }

    const updatedProjects = projects.map(p => {
      if (p.id !== selectedProject.id) return p
      return { ...p, milestones: [...p.milestones, newM] }
    })
    setProjects(updatedProjects)
    setMilestoneTitle('')
    setMilestoneDueDate('')
    setIsNewMilestoneModalOpen(false)
    toast.success('Milestone added!')
  }

  const handleAddLog = () => {
    if (!logContent.trim() || !selectedProject) return
    const newLog: ProjectLog = {
      id: `l-${Date.now()}`,
      project_id: selectedProject.id,
      user_id: session?.user.id || 'demo-user',
      log_type: logType,
      content: logContent.trim(),
      created_at: new Date().toISOString()
    }

    const updatedProjects = projects.map(p => {
      if (p.id !== selectedProject.id) return p
      return { ...p, logs: [newLog, ...p.logs] }
    })
    setProjects(updatedProjects)
    setLogContent('')
    setIsNewLogModalOpen(false)
    toast.success('Log entry saved!')
  }

  const handleDeleteProject = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return
    const remaining = projects.filter(p => p.id !== id)
    setProjects(remaining)
    if (selectedProjectId === id) {
      setSelectedProjectId(remaining[0]?.id || '')
    }
    toast.success('Project deleted')
  }

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'planning':
        return <Badge variant="accent">Planning</Badge>
      case 'completed':
        return <Badge variant="blue">Completed</Badge>
      case 'on_hold':
        return <Badge variant="yellow">On Hold</Badge>
      default:
        return <Badge variant="gray">{status}</Badge>
    }
  }

  const getLogIcon = (type: ProjectLog['log_type']) => {
    switch (type) {
      case 'progress': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      case 'blocker': return <AlertTriangle className="h-4 w-4 text-rose-400" />
      case 'decision': return <Lightbulb className="h-4 w-4 text-amber-400" />
      case 'bug': return <Bug className="h-4 w-4 text-orange-400" />
      default: return <Clock className="h-4 w-4 text-surface-400" />
    }
  }

  const milestoneProgress = useMemo(() => {
    if (!selectedProject || selectedProject.milestones.length === 0) return 0
    const completed = selectedProject.milestones.filter(m => m.completed_at).length
    return Math.round((completed / selectedProject.milestones.length) * 100)
  }, [selectedProject])

  return (
    <div className="min-h-full flex flex-col bg-surface-950">
      <Header
        title="Projects & Portfolio"
        subtitle="Track engineering projects, architecture decisions, and milestones for SDE portfolio"
        actions={
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsNewProjectModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-1.5 p-1 bg-surface-900 border border-surface-800 rounded-xl w-full sm:w-auto">
            {(['all', 'active', 'planning', 'completed', 'on_hold'] as ProjectFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  filter === tab
                    ? 'bg-accent-600 text-white shadow-sm'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search projects or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-surface-400" />}
            />
          </div>
        </div>

        {/* Layout: Sidebar Grid / Details View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Projects List Column */}
          <div className="lg:col-span-5 space-y-3">
            {filteredProjects.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="h-10 w-10 text-surface-600" />}
                title="No projects found"
                description="Start building your engineering showcase or change search filter."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setIsNewProjectModalOpen(true)}>
                    Create Project
                  </Button>
                }
              />
            ) : (
              filteredProjects.map((p) => {
                const isSelected = p.id === selectedProjectId
                const completedM = p.milestones.filter(m => m.completed_at).length
                const totalM = p.milestones.length
                const pct = totalM > 0 ? Math.round((completedM / totalM) * 100) : 0

                return (
                  <Card
                    key={p.id}
                    className={`cursor-pointer transition-all duration-200 hover:border-surface-700 ${
                      isSelected ? 'border-accent-500/60 bg-surface-900/90 shadow-lg shadow-accent-600/5 ring-1 ring-accent-500/30' : 'bg-surface-900/40'
                    }`}
                    onClick={() => setSelectedProjectId(p.id)}
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm text-surface-100 flex items-center gap-2">
                            {p.name}
                            {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />}
                          </h3>
                          <p className="text-xs text-surface-400 line-clamp-1 mt-0.5">
                            {p.description || 'No description provided'}
                          </p>
                        </div>
                        {getStatusBadge(p.status)}
                      </div>

                      {/* Tech stack pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {p.tech_stack.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 text-2xs font-mono rounded bg-surface-800 text-surface-300 border border-surface-700/50"
                          >
                            {tech}
                          </span>
                        ))}
                        {p.tech_stack.length > 4 && (
                          <span className="px-1.5 py-0.5 text-2xs text-surface-500 font-mono">
                            +{p.tech_stack.length - 4}
                          </span>
                        )}
                      </div>

                      {/* Milestone mini progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-2xs text-surface-400">
                          <span>Milestones ({completedM}/{totalM})</span>
                          <span>{pct}%</span>
                        </div>
                        <ProgressBar value={completedM} max={totalM || 1} size="xs" color="violet" />
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          {/* Project Details Panel */}
          <div className="lg:col-span-7">
            {selectedProject ? (
              <div className="space-y-6">
                {/* Header Card */}
                <Card className="p-6 bg-surface-900/50 border-surface-800">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold font-display text-surface-50">
                          {selectedProject.name}
                        </h2>
                        {getStatusBadge(selectedProject.status)}
                      </div>
                      <p className="text-sm text-surface-400 mt-1 leading-relaxed">
                        {selectedProject.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {selectedProject.github_url && (
                        <a
                          href={selectedProject.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost p-2 rounded-lg text-surface-300 hover:text-white"
                          title="GitHub Repository"
                        >
                          <GitBranch className="h-4 w-4" />
                        </a>
                      )}
                      {selectedProject.live_url && (
                        <a
                          href={selectedProject.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost p-2 rounded-lg text-surface-300 hover:text-white"
                          title="Live Demo"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteProject(selectedProject.id)}
                        className="btn-ghost p-2 rounded-lg text-rose-400 hover:bg-rose-500/10"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Problem & Goal statement */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-surface-800/80">
                    <div className="space-y-1 bg-surface-950/40 p-3.5 rounded-xl border border-surface-800/50">
                      <span className="text-2xs font-semibold uppercase tracking-wider text-accent-400">
                        Problem Statement
                      </span>
                      <p className="text-xs text-surface-300 leading-relaxed">
                        {selectedProject.problem_statement || 'No problem statement recorded.'}
                      </p>
                    </div>

                    <div className="space-y-1 bg-surface-950/40 p-3.5 rounded-xl border border-surface-800/50">
                      <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-400">
                        Engineering Goal
                      </span>
                      <p className="text-xs text-surface-300 leading-relaxed">
                        {selectedProject.goals || 'No goals specified yet.'}
                      </p>
                    </div>
                  </div>

                  {/* Next action spotlight */}
                  {selectedProject.next_action && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-2xs font-medium text-amber-400 uppercase tracking-wider">Next Action</p>
                          <p className="text-xs text-amber-200">{selectedProject.next_action}</p>
                        </div>
                      </div>
                      {selectedProject.deadline && (
                        <div className="text-right shrink-0">
                          <span className="text-2xs text-amber-400/80">Due by</span>
                          <p className="text-xs font-mono text-amber-300">{selectedProject.deadline}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tech stack full view */}
                  <div className="mt-5">
                    <p className="text-2xs uppercase tracking-wider text-surface-500 font-semibold mb-2">Technologies Used</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tech_stack.map(tech => (
                        <span key={tech} className="px-2.5 py-1 text-xs font-mono rounded-lg bg-surface-800 text-surface-200 border border-surface-700">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Architecture notes */}
                  {selectedProject.architecture_notes && (
                    <div className="mt-5 pt-4 border-t border-surface-800/80">
                      <p className="text-2xs uppercase tracking-wider text-surface-500 font-semibold mb-1.5 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        System Architecture & Decisions
                      </p>
                      <p className="text-xs text-surface-300 leading-relaxed bg-surface-950/60 p-3 rounded-lg border border-surface-800 font-mono">
                        {selectedProject.architecture_notes}
                      </p>
                    </div>
                  )}
                </Card>

                {/* Milestones Section */}
                <Card className="p-5 bg-surface-900/50 border-surface-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-surface-100 flex items-center gap-2">
                        Milestones & Deliverables
                        <Badge variant="accent">{milestoneProgress}% complete</Badge>
                      </h4>
                      <p className="text-xs text-surface-500">Track phased project execution and deadlines</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setIsNewMilestoneModalOpen(true)} className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Add Milestone
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {selectedProject.milestones.length === 0 ? (
                      <p className="text-xs text-surface-500 text-center py-4">No milestones created yet.</p>
                    ) : (
                      selectedProject.milestones.map((m) => {
                        const isDone = !!m.completed_at
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMilestone(m.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                              isDone ? 'bg-surface-950/30 border-surface-800/40 text-surface-500' : 'bg-surface-950/70 border-surface-800 text-surface-200 hover:border-surface-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-surface-500 shrink-0" />
                              )}
                              <span className={`text-xs ${isDone ? 'line-through text-surface-500' : 'text-surface-200 font-medium'}`}>
                                {m.title}
                              </span>
                            </div>
                            {m.due_date && (
                              <span className="text-2xs font-mono text-surface-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {m.due_date}
                              </span>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </Card>

                {/* Development Logs / Journal */}
                <Card className="p-5 bg-surface-900/50 border-surface-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-surface-100">Engineering Journal & Logs</h4>
                      <p className="text-xs text-surface-500">Keep an audit trail of progress, blockers, and decisions</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setIsNewLogModalOpen(true)} className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Add Log
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {selectedProject.logs.length === 0 ? (
                      <p className="text-xs text-surface-500 text-center py-4">No logs recorded yet.</p>
                    ) : (
                      selectedProject.logs.map((log) => (
                        <div key={log.id} className="p-3 bg-surface-950/60 rounded-xl border border-surface-800/70 flex items-start gap-3">
                          <div className="mt-0.5">{getLogIcon(log.log_type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-2xs font-mono uppercase tracking-wider text-surface-400 capitalize">
                                {log.log_type}
                              </span>
                              <span className="text-2xs text-surface-500 font-mono">
                                {new Date(log.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-surface-200 mt-1 leading-relaxed">
                              {log.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <EmptyState
                icon={<FolderKanban className="h-10 w-10 text-surface-600" />}
                title="Select a project"
                description="Choose a project from the left or create a new one to view details."
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal: New Project */}
      <Modal
        open={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Create New Engineering Project"
      >
        <div className="space-y-4">
          <Input
            label="Project Name *"
            placeholder="e.g. Distributed Key-Value Store"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />

          <Textarea
            label="Summary Description"
            placeholder="High level overview of what this project does..."
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tech Stack (comma separated)"
              placeholder="React, TypeScript, Go, Redis"
              value={formTechStack}
              onChange={(e) => setFormTechStack(e.target.value)}
            />
            <Select
              label="Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
              options={[
                { value: 'planning', label: 'Planning' },
                { value: 'active', label: 'Active Development' },
                { value: 'on_hold', label: 'On Hold' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="GitHub URL"
              placeholder="https://github.com/..."
              value={formGithub}
              onChange={(e) => setFormGithub(e.target.value)}
            />
            <Input
              label="Live Demo URL"
              placeholder="https://..."
              value={formLive}
              onChange={(e) => setFormLive(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Target Deadline"
              type="date"
              value={formDeadline}
              onChange={(e) => setFormDeadline(e.target.value)}
            />
            <Input
              label="Next Immediate Action"
              placeholder="e.g. Write benchmarking script"
              value={formNextAction}
              onChange={(e) => setFormNextAction(e.target.value)}
            />
          </div>

          <Textarea
            label="Problem Statement & Engineering Goals"
            placeholder="Why are you building this? What technical challenge does it solve?"
            value={formProblem}
            onChange={(e) => setFormProblem(e.target.value)}
            rows={2}
          />

          <Textarea
            label="Architecture Notes"
            placeholder="Key design patterns, database choice rationale, concurrency model..."
            value={formArch}
            onChange={(e) => setFormArch(e.target.value)}
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsNewProjectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateProject}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: New Milestone */}
      <Modal
        open={isNewMilestoneModalOpen}
        onClose={() => setIsNewMilestoneModalOpen(false)}
        title="Add Project Milestone"
      >
        <div className="space-y-4">
          <Input
            label="Milestone Title *"
            placeholder="e.g. Implement OAuth2 Refresh Token Flow"
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
          />
          <Input
            label="Due Date"
            type="date"
            value={milestoneDueDate}
            onChange={(e) => setMilestoneDueDate(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsNewMilestoneModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddMilestone}>
              Save Milestone
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: New Log */}
      <Modal
        open={isNewLogModalOpen}
        onClose={() => setIsNewLogModalOpen(false)}
        title="Record Engineering Journal Entry"
      >
        <div className="space-y-4">
          <Select
            label="Log Type"
            value={logType}
            onChange={(e) => setLogType(e.target.value as any)}
            options={[
              { value: 'progress', label: 'Progress / Achievement' },
              { value: 'blocker', label: 'Blocker / Bug' },
              { value: 'decision', label: 'Architectural Decision' },
              { value: 'note', label: 'General Note / Idea' },
            ]}
          />
          <Textarea
            label="Content *"
            placeholder="Document what was accomplished, errors encountered, or trade-offs made..."
            value={logContent}
            onChange={(e) => setLogContent(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsNewLogModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddLog}>
              Save Log Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
