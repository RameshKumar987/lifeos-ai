import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Target, BookOpen, Brain, MessageSquare, 
  Languages, Code2, FolderKanban, Gamepad2, Bell, BarChart3, Settings,
  ChevronLeft, ChevronRight, Zap, Users, Shield, X, Plus, Moon, Sun,
  CalendarDays
} from 'lucide-react'
import { cn, getLevelName, calculateLevel } from '../../lib/utils'
import { useUIStore, useAuthStore } from '../../store'
import { Avatar, ProgressBar, Button } from '../ui'

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { id: 'attendance', label: 'Daily Log', icon: CalendarDays, path: '/attendance' },
      { id: 'tasks', label: 'Tasks & Goals', icon: CheckSquare, path: '/tasks' },
      { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects' },
    ],
  },
  {
    label: 'Learning',
    items: [
      { id: 'learning', label: 'Learning Memory', icon: BookOpen, path: '/learning' },
      { id: 'revision', label: 'Revision Center', icon: Brain, path: '/revision' },
      { id: 'python-dsa', label: 'Python & DSA', icon: Code2, path: '/python-dsa' },
    ],
  },
  {
    label: 'Languages',
    items: [
      { id: 'english', label: 'English Lab', icon: MessageSquare, path: '/english' },
      { id: 'german', label: 'German Lab', icon: Languages, path: '/german' },
    ],
  },
  {
    label: 'AI & Growth',
    items: [
      { id: 'mentor', label: 'My Mentor', icon: Brain, path: '/mentor' },
      { id: 'games', label: 'Games & Quests', icon: Gamepad2, path: '/games' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: 'squad', label: 'Squad', icon: Users, path: '/squad' },
    ],
  },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, toggleSidebar, theme, setTheme } = useUIStore()
  const { session, profile } = useAuthStore()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const { level, currentXP, nextLevelXP } = calculateLevel(profile?.xp_total || 0)

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-full flex flex-col',
          'bg-surface-950 border-r border-surface-800',
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-16',
          // Mobile: slide in from left
          'lg:relative lg:translate-x-0',
          !sidebarOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo & toggle */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-surface-800 shrink-0">
          {sidebarOpen && (
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-600 to-electric-600 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-display font-bold text-surface-50 tracking-tight text-sm truncate">
                LifeOS AI
              </span>
            </Link>
          )}
          {!sidebarOpen && (
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-600 to-electric-600 flex items-center justify-center mx-auto">
              <Zap className="h-4 w-4 text-white" />
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              'btn-ghost p-1.5 rounded-md text-surface-400 hover:text-surface-200 shrink-0',
              !sidebarOpen && 'hidden lg:flex'
            )}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 hide-scrollbar">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              {sidebarOpen && (
                <p className="section-title px-2 mb-1.5">{section.label}</p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      'nav-item',
                      active && 'active',
                      !sidebarOpen && 'justify-center px-2'
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                    onClick={() => {
                      if (window.innerWidth < 1024) setSidebarOpen(false)
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer — User profile & settings */}
        <div className="shrink-0 border-t border-surface-800 p-3 space-y-2">
          {/* XP Progress */}
          {sidebarOpen && profile && (
            <div className="px-1 py-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-surface-500">
                  Lv.{level} {getLevelName(level)}
                </span>
                <span className="text-xs text-amber-400 font-medium">{currentXP}/{nextLevelXP} XP</span>
              </div>
              <ProgressBar value={currentXP} max={nextLevelXP} color="amber" size="xs" />
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn('nav-item w-full', !sidebarOpen && 'justify-center px-2')}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {sidebarOpen && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Settings */}
          <Link
            to="/settings"
            className={cn('nav-item', isActive('/settings') && 'active', !sidebarOpen && 'justify-center px-2')}
            title={!sidebarOpen ? 'Settings' : undefined}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </Link>

          {/* User / Sign In */}
          {!session ? (
            <Link
              to="/auth"
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-gradient-to-r from-accent-600/20 to-electric-600/20 border border-accent-500/30 hover:border-accent-500/60 hover:bg-accent-600/30 transition-all text-accent-300',
                !sidebarOpen && 'justify-center'
              )}
              title="Sign in as Owner"
            >
              <Shield className="h-4 w-4 shrink-0 text-accent-400" />
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-accent-200">Owner Sign In</p>
                  <p className="text-3xs text-surface-400">Connect to Supabase Cloud</p>
                </div>
              )}
            </Link>
          ) : profile && (
            <Link
              to="/settings"
              className={cn('flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-800 transition-colors cursor-pointer', !sidebarOpen && 'justify-center')}
            >
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name}
                size="sm"
                className="shrink-0"
              />
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-xs font-medium text-surface-200 truncate">
                    {profile.full_name || 'My Account'}
                  </p>
                  <p className="text-2xs text-surface-500 truncate">{profile.email}</p>
                </div>
              )}
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

interface HeaderProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { setSidebarOpen, sidebarOpen } = useUIStore()
  const { setQuickAddOpen } = useUIStore()
  const { session, profile } = useAuthStore()

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-surface-800 bg-surface-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          className="btn-ghost p-1.5 rounded-md lg:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {title && (
          <div>
            <h1 className="text-sm font-semibold text-surface-50">{title}</h1>
            {subtitle && <p className="text-xs text-surface-500">{subtitle}</p>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Sign In / Active Status */}
        {!session ? (
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-accent-600 to-electric-600 hover:from-accent-500 hover:to-electric-500 text-white shadow-sm transition-all"
            title="Sign in to your private LifeOS account"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Sign In / Owner Login</span>
          </Link>
        ) : (
          <Link
            to="/settings"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-surface-900 border border-surface-800 text-surface-300 hover:text-white transition-colors"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium max-w-[120px] truncate">{profile?.full_name || 'Owner'}</span>
          </Link>
        )}

        <button
          onClick={() => setQuickAddOpen(true)}
          className="btn-primary btn-sm gap-1.5"
          aria-label="Quick add"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Quick Add</span>
        </button>
        <Link to="/reminders" className="btn-ghost p-2 rounded-md relative" title="Reminders">
          <Bell className="h-4 w-4" />
        </Link>
        {actions}
      </div>
    </header>
  )
}
