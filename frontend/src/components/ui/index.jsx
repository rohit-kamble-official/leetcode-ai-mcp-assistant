/**
 * components/ui/index.jsx — Redesigned premium UI primitives
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Inbox, RefreshCw, Check, Copy, ChevronUp, ChevronDown } from 'lucide-react'
import { getDifficultyClass } from '../../utils'

export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
)

export const CardSkeleton = () => (
  <div className="glass-card p-5 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-3.5 w-14 rounded-full" />
      <Skeleton className="h-3.5 w-28" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="flex gap-2 pt-1">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  </div>
)

export const DifficultyBadge = ({ difficulty }) => (
  <span className={getDifficultyClass(difficulty)}>{difficulty}</span>
)

export const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-750 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-surface-400" />
    </div>
    <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-200 mb-1">{title}</h3>
    {description && <p className="text-sm text-surface-400 max-w-xs">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </motion.div>
)

export const Spinner = ({ size = 'md', className = '' }) => {
  const sz = { sm: 'w-3.5 h-3.5 border', md: 'w-5 h-5 border-2', lg: 'w-7 h-7 border-2' }[size]
  return <div className={`${sz} ${className} animate-spin rounded-full border-surface-200 dark:border-surface-700 border-t-brand-500`} />
}

export const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-brand-500/30">
        <span className="text-white font-bold text-base tracking-tight">L</span>
      </div>
      <Spinner size="md" />
    </div>
  </div>
)

export const ErrorBox = ({ message, onRetry }) => (
  <div className="glass-card p-6 text-center max-w-md mx-auto">
    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-3">
      <AlertTriangle className="w-5 h-5 text-rose-500" />
    </div>
    <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary text-xs gap-1.5 mx-auto">
        <RefreshCw className="w-3 h-3" /> Try again
      </button>
    )}
  </div>
)

export const TagChip = ({ label, onClick, active }) => (
  <button onClick={onClick} className={`tag-chip ${active ? 'tag-chip-active' : ''}`}>
    {label}
  </button>
)

export const Tooltip = ({ children, content }) => (
  <div className="relative group/tip">
    {children}
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-xs font-medium bg-surface-900 dark:bg-surface-100 text-surface-50 dark:text-surface-900 rounded-lg opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-900 dark:border-t-surface-100" />
    </div>
  </div>
)

export const AcceptanceBar = ({ rate }) => {
  const pct = Math.min(100, Math.round(rate || 0))
  const color = pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs text-surface-400 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  )
}

export const CopyButton = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className={`btn-ghost p-1.5 ${className}`} title="Copy">
      {copied
        ? <Check className="w-3.5 h-3.5 text-emerald-500" />
        : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export const Collapsible = ({ title, icon: Icon, count, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-surface-400" />}
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">{title}</span>
          {count !== undefined && (
            <span className="px-1.5 py-0.5 rounded-md text-xs bg-surface-100 dark:bg-surface-800 text-surface-500">{count}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}
