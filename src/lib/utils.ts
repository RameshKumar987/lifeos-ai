import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function getLocalDate(timezone = 'Asia/Kolkata'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function getGreeting(name?: string): string {
  const hour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours()
  let greeting = 'Hello'
  if (hour >= 5 && hour < 12) greeting = 'Good morning'
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon'
  else if (hour >= 17 && hour < 21) greeting = 'Good evening'
  else greeting = 'Hey'
  return name ? `${greeting}, ${name.split(' ')[0]}! 👋` : `${greeting}! 👋`
}

export function getLevelName(level: number): string {
  const names = [
    'Novice', 'Apprentice', 'Explorer', 'Practitioner', 'Developer',
    'Engineer', 'Architect', 'Expert', 'Master', 'Grandmaster', 'Legendary'
  ]
  return names[Math.min(level - 1, names.length - 1)] || 'Legendary'
}

export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export function getTotalXPForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i)
  }
  return total
}

export function calculateLevel(totalXP: number): { level: number; currentXP: number; nextLevelXP: number } {
  let level = 1
  let remaining = totalXP

  while (remaining >= getXPForLevel(level)) {
    remaining -= getXPForLevel(level)
    level++
  }

  return {
    level,
    currentXP: remaining,
    nextLevelXP: getXPForLevel(level),
  }
}

export function truncate(str: string, maxLen = 50): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function generateToken(): string {
  return crypto.randomUUID()
}

// Color palette for categories
export const CATEGORY_COLORS = [
  '#7c3aed', '#0088df', '#059669', '#d97706', '#e11d48',
  '#0891b2', '#7c3aed', '#dc2626', '#16a34a', '#9333ea',
  '#2563eb', '#ca8a04', '#4f46e5', '#0d9488', '#db2777',
]

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'text-red-400 bg-red-400/10'
    case 'high': return 'text-orange-400 bg-orange-400/10'
    case 'medium': return 'text-yellow-400 bg-yellow-400/10'
    case 'low': return 'text-green-400 bg-green-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'text-emerald-400 bg-emerald-400/10'
    case 'in_progress': return 'text-blue-400 bg-blue-400/10'
    case 'skipped': return 'text-slate-400 bg-slate-400/10'
    case 'archived': return 'text-slate-500 bg-slate-500/10'
    case 'todo': return 'text-violet-400 bg-violet-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}
