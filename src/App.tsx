import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { useAuthStore, useUIStore } from './store'
import { supabase } from './lib/supabase'

// Pages
import { Dashboard } from './pages/Dashboard'
import { AttendancePage as Attendance } from './pages/Attendance'
import { TasksPage as Tasks } from './pages/Tasks'
import { Projects } from './pages/Projects'
import { LearningPage as Learning } from './pages/Learning'
import { RevisionPage as Revision } from './pages/Revision'
import { PythonDSA } from './pages/PythonDSA'
import { EnglishPage as English } from './pages/English'
import { German } from './pages/German'
import { MentorPage as Mentor } from './pages/Mentor'
import { Games } from './pages/Games'
import { Analytics } from './pages/Analytics'
import { Squad } from './pages/Squad'
import { Settings } from './pages/Settings'
import { Reminders } from './pages/Reminders'
import { AuthPage } from './pages/Auth'

// Demo Fallback Profile for seamless offline & local preview
const DEMO_PROFILE = {
  id: 'demo-user',
  email: 'ramesh.yadav@example.com',
  full_name: 'Ramesh Yadav',
  avatar_url: null,
  role: 'owner' as const,
  bio: 'B.Tech CS Student (2027 Grad). Targeting SDE-1 at Google, Microsoft, Amazon.',
  timezone: 'Asia/Kolkata',
  education: 'B.Tech in Computer Science & Engineering',
  graduation_year: 2027,
  career_target: 'SDE-1 (Google, Microsoft, Amazon)',
  current_focus: 'Python, DSA, System Design, German & Spoken English',
  xp_total: 0,
  level: 1,
  streak_current: 0,
  streak_longest: 0,
  is_owner: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function App() {
  const { setSession, setUser, setProfile, setLoading, setInitialized, profile } = useAuthStore()
  const { setQuickAddOpen, theme } = useUIStore()

  useEffect(() => {
    // Sync theme class to document
    document.documentElement.classList.toggle('dark', theme === 'dark')

    // Auth bootstrap
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setSession(session)
          setUser(session.user)

          // Load profile
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()

          if (userProfile) {
            setProfile(userProfile)
          } else {
            setProfile({
              ...DEMO_PROFILE,
              id: session.user.id,
              email: session.user.email || DEMO_PROFILE.email,
              full_name: session.user.user_metadata?.full_name || DEMO_PROFILE.full_name,
            })
          }
        } else {
          // If no active session or Supabase is unconfigured, provide demo profile
          if (!profile) {
            setProfile(DEMO_PROFILE)
          }
        }
      } catch (err) {
        console.warn('Auth initialization fallback:', err)
        if (!profile) {
          setProfile(DEMO_PROFILE)
        }
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setSession(session)
        setUser(session.user)
      } else {
        setSession(null)
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Keyboard shortcut for Quick Add (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setQuickAddOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setQuickAddOpen])

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Main Application with Sidebar & Topbar Layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/revision" element={<Revision />} />
          <Route path="/python-dsa" element={<PythonDSA />} />
          <Route path="/english" element={<English />} />
          <Route path="/german" element={<German />} />
          <Route path="/mentor" element={<Mentor />} />
          <Route path="/games" element={<Games />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/squad" element={<Squad />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/account" element={<Settings />} />
          <Route path="/reminders" element={<Reminders />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
