import * as React from 'react'
import { cn } from '../../lib/utils'

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
      success: 'btn-success',
    }
    const sizes = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'input-error',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        {hint && !error && <p className="text-xs text-surface-500">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          className={cn('input resize-none', error && 'input-error', className)}
          {...props}
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
        {hint && !error && <p className="text-xs text-surface-500">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  label?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, options, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <select
          ref={ref}
          id={inputId}
          className={cn('input bg-surface-900 cursor-pointer', error && 'input-error', className)}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-900">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padded?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable, padded = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        hoverable ? 'card-hover' : 'card',
        padded && 'p-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

// ─── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'accent' | 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'success' | 'danger'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'gray', ...props }, ref) => {
    const resolvedVariant = variant === 'success' ? 'green' : variant === 'danger' ? 'red' : variant
    return (
      <span
        ref={ref}
        className={cn(`badge-${resolvedVariant}`, className)}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

// ─── Avatar ──────────────────────────────────────────────────────────────────

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold font-display overflow-hidden',
      'bg-gradient-to-br from-accent-600 to-electric-600 text-white',
      sizes[size],
      className
    )}>
      {src ? (
        <img src={src} alt={name || 'avatar'} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: 'accent' | 'electric' | 'green' | 'amber' | 'violet'
  size?: 'xs' | 'sm' | 'md'
}

export function ProgressBar({ value, max = 100, className, showLabel, color = 'accent', size = 'sm' }: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100)
  const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' }
  const colors = {
    accent: 'from-accent-600 to-accent-400',
    electric: 'from-electric-600 to-electric-400',
    green: 'from-emerald-600 to-emerald-400',
    amber: 'from-amber-600 to-amber-400',
    violet: 'from-violet-600 to-accent-400',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('progress-bar flex-1', heights[size])}>
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', colors[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-surface-500 w-8 text-right">{Math.round(percent)}%</span>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return <div className={cn('skeleton h-4 w-full', className)} />
  }
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn('skeleton h-4', i === lines - 1 ? 'w-3/4' : 'w-full', className)}
        />
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      {icon && (
        <div className="text-surface-600 mb-1">{icon}</div>
      )}
      <h3 className="text-sm font-medium text-surface-300">{title}</h3>
      {description && (
        <p className="text-xs text-surface-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  return (
    <svg
      className={cn('animate-spin text-accent-500', sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

export function Tooltip({ children, content, className }: {
  children: React.ReactNode
  content: string
  className?: string
}) {
  return (
    <div className={cn('group relative inline-flex', className)}>
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md text-xs
                       bg-surface-800 text-surface-200 whitespace-nowrap border border-surface-700
                       opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
        {content}
      </span>
    </div>
  )
}

// ─── Switch ──────────────────────────────────────────────────────────────────

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  id?: string
}

export function Switch({ checked, onChange, label, disabled, id }: SwitchProps) {
  const switchId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex items-center gap-2">
      <button
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-accent-600' : 'bg-surface-700'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg',
            'transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
      {label && (
        <label htmlFor={switchId} className="text-sm text-surface-300 cursor-pointer">
          {label}
        </label>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Modal({ open, onClose, title, description, children, size = 'md', className }: ModalProps) {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        'relative w-full card animate-in',
        sizes[size],
        className
      )}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-surface-800">
            <div>
              <h2 className="text-base font-semibold text-surface-50">{title}</h2>
              {description && <p className="text-xs text-surface-400 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="btn-ghost btn-sm rounded-md p-1.5"
              aria-label="Close modal"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode; count?: number }[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 rounded-lg bg-surface-900 border border-surface-800', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
            active === tab.id
              ? 'bg-surface-700 text-surface-50 shadow-sm'
              : 'text-surface-400 hover:text-surface-200'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'ml-1 rounded-full px-1.5 py-0.5 text-xs',
              active === tab.id ? 'bg-accent-600 text-white' : 'bg-surface-800 text-surface-400'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {description && <p className="text-sm text-surface-400 mb-4">{description}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={confirmVariant} size="sm" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
