/**
 * utils/index.js
 */

export const cn = (...classes) => classes.filter(Boolean).join(' ')

export const getDifficultyClass = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'badge-easy'
    case 'medium': return 'badge-medium'
    case 'hard': return 'badge-hard'
    default: return 'badge-easy'
  }
}

export const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return '#10b981'
    case 'medium': return '#f59e0b'
    case 'hard': return '#ef4444'
    default: return '#6366f1'
  }
}

export const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const formatNumber = (n) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n?.toString() ?? '0'
}

export const extractErrorMessage = (err) =>
  err?.response?.data?.error?.message || err?.message || 'Something went wrong'

export const stripHtml = (html) =>
  html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || ''

export const truncate = (str, len = 100) =>
  str?.length > len ? str.slice(0, len) + '...' : str || ''

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
