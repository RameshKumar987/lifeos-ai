import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, Header } from './Sidebar'
import { useUIStore } from '../../store'
import { cn } from '../../lib/utils'
import { QuickAdd } from '../features/QuickAdd'
import { Toaster } from 'sonner'

interface AppLayoutProps {
  headerTitle?: string
  headerSubtitle?: string
  headerActions?: React.ReactNode
}

export function AppLayout({ headerTitle, headerSubtitle, headerActions }: AppLayoutProps) {
  const { sidebarOpen, theme } = useUIStore()

  return (
    <div className={cn('flex h-screen bg-surface-950 overflow-hidden', theme)}>
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={headerTitle} subtitle={headerSubtitle} actions={headerActions} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Add Dialog */}
      <QuickAdd />

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </div>
  )
}
