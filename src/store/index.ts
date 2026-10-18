import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, UserPreferences } from '../types/database.types'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  preferences: UserPreferences | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setPreferences: (prefs: UserPreferences | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      preferences: null,
      loading: true,
      initialized: false,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setPreferences: (preferences) => set({ preferences }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, profile: null, preferences: null })
      },
    }),
    {
      name: 'lifeos-auth',
      partialize: (state) => ({
        // Only persist non-sensitive UI state
        initialized: state.initialized,
      }),
    }
  )
)

// ─── UI State Store ──────────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean
  quickAddOpen: boolean
  theme: 'dark' | 'light'
  activeModule: string
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setQuickAddOpen: (open: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
  setActiveModule: (module: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      quickAddOpen: false,
      theme: 'dark',
      activeModule: 'dashboard',

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setQuickAddOpen: (open) => set({ quickAddOpen: open }),
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },
      setActiveModule: (module) => set({ activeModule: module }),
    }),
    {
      name: 'lifeos-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
)

// ─── Attendance Store ────────────────────────────────────────────────────────

import type { DailyAttendance } from '../types/database.types'

interface AttendanceState {
  todayAttendance: DailyAttendance | null
  setTodayAttendance: (attendance: DailyAttendance | null) => void
}

export const useAttendanceStore = create<AttendanceState>()((set) => ({
  todayAttendance: null,
  setTodayAttendance: (attendance) => set({ todayAttendance: attendance }),
}))
