/**
 * pages/ProblemsPage.jsx
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { problemsService } from '../services'
import { ProblemCard } from '../components/problems/ProblemCard'
import { CardSkeleton, EmptyState, TagChip } from '../components/ui'
import { DIFFICULTIES, TAGS } from '../constants'
import { BookOpen } from 'lucide-react'

/**
 * Computes a sliding window of page numbers centered on the current page,
 * e.g. getPageWindow(12, 30, 5) => [10, 11, 12, 13, 14].
 * Clamps at both ends so we never go below 1 or above totalPages.
 * This replaces a previous bug where the page buttons were hardcoded
 * to always render [1,2,3,4,5], making page 6+ unreachable via the
 * page-number UI on any result set with more than 5 pages.
 */
const getPageWindow = (current, total, size = 5) => {
  if (total <= size) return Array.from({ length: total }, (_, i) => i + 1)
  let start = Math.max(1, current - Math.floor(size / 2))
  let end = start + size - 1
  if (end > total) {
    end = total
    start = end - size + 1
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export const ProblemsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const query = searchParams.get('q') || ''
  const difficulty = searchParams.get('difficulty') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const tag = searchParams.get('tag') || ''
  const limit = 20

  const [localSearch, setLocalSearch] = useState(query)

  useEffect(() => { setLocalSearch(query) }, [query])

  const { data, isLoading, error } = useQuery({
    queryKey: ['problems', { query, difficulty, tag, page, limit }],
    queryFn: () => problemsService.search({
      q: query,
      difficulty: difficulty || undefined,
      tags: tag || undefined,
      page,
      limit,
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const setParam = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.set('page', '1')
    setSearchParams(params)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setParam('q', localSearch)
  }

  const problems = data?.data || []
  const meta = data?.meta || {}
  const totalPages = meta.totalPages || 1

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">Problems</h1>
          <p className="text-sm text-surface-500">{meta.total ? `${meta.total} problems` : 'Browse and solve'}</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary gap-2 ${showFilters ? 'border-brand-500 text-brand-600' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {(difficulty || tag) && <span className="w-2 h-2 rounded-full bg-brand-500" />}
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by title, topic, or number…"
          className="input-field pl-10 pr-24"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {localSearch && (
            <button type="button" onClick={() => { setLocalSearch(''); setParam('q', '') }} className="btn-ghost p-1.5">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="submit" className="btn-primary py-1.5 px-3 text-xs shadow-none">Search</button>
        </div>
      </form>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-4">
              {/* Difficulty */}
              <div>
                <p className="text-xs font-medium text-surface-500 mb-2">Difficulty</p>
                <div className="flex gap-2">
                  <TagChip label="All" onClick={() => setParam('difficulty', '')} active={!difficulty} />
                  {DIFFICULTIES.map(d => (
                    <TagChip
                      key={d}
                      label={d.charAt(0).toUpperCase() + d.slice(1)}
                      onClick={() => setParam('difficulty', difficulty === d ? '' : d)}
                      active={difficulty === d}
                    />
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs font-medium text-surface-500 mb-2">Topic</p>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.map(t => (
                    <TagChip
                      key={t}
                      label={t.replace(/-/g, ' ')}
                      onClick={() => setParam('tag', tag === t ? '' : t)}
                      active={tag === t}
                    />
                  ))}
                </div>
              </div>

              {/* Clear */}
              {(difficulty || tag) && (
                <button
                  onClick={() => { setParam('difficulty', ''); setParam('tag', '') }}
                  className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(12)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-rose-500">Failed to load problems. Backend may be offline.</div>
      ) : problems.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No problems found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {problems.map((p) => (
            <ProblemCard key={p.titleSlug || p.frontendQuestionId} problem={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setParam('page', String(page - 1))}
            disabled={page <= 1}
            className="btn-secondary p-2 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1">
            {getPageWindow(page, totalPages, 5).map((p_num) => (
              <button
                key={p_num}
                onClick={() => setParam('page', String(p_num))}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  p_num === page ? 'gradient-brand text-white shadow' : 'btn-secondary p-0'
                }`}
              >
                {p_num}
              </button>
            ))}
          </div>
          <button
            onClick={() => setParam('page', String(page + 1))}
            disabled={page >= totalPages}
            className="btn-secondary p-2 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
