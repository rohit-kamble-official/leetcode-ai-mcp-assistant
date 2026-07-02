/**
 * components/problems/ProblemCard.jsx
 *
 * BUG FIXES applied here:
 * 1. Removed a leftover debug `alert("Clicked")` + console.log that was
 *    firing a blocking browser alert dialog on every single card click
 *    before navigation — found with the real onClick handler commented
 *    out above it.
 * 2. Replaced local `useState(favorited)` (always initialized to false,
 *    blind to server state) with useIsFavorited/useToggleFavorite, which
 *    read and write through the shared favorites cache. Previously a
 *    problem already in the user's favorites would render with an empty
 *    star until clicked, which would then 409 and silently do nothing.
 */
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, ExternalLink, TrendingUp } from 'lucide-react'
import { DifficultyBadge, AcceptanceBar } from '../ui'
import { useIsFavorited, useToggleFavorite } from '../../hooks/useFavorites'

export const ProblemCard = ({ problem }) => {
  const navigate = useNavigate()
  const isFavorited = useIsFavorited(problem.titleSlug)
  const toggle = useToggleFavorite()

  const handleToggleFavorite = (e) => {
    e.stopPropagation()
    toggle.mutate({
      isFavorited,
      problemSlug: problem.titleSlug,
      problemTitle: problem.title,
      problemDifficulty: problem.difficulty,
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card p-5 cursor-pointer group transition-shadow hover:shadow-lg hover:shadow-brand-500/5"
      onClick={() => navigate(`/problems/${problem.titleSlug}`)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-surface-400 font-mono">#{problem.frontendQuestionId || problem.questionFrontendId}</span>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
            {problem.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleToggleFavorite}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-amber-400 text-amber-400' : 'text-surface-400'}`} />
          </button>
          <ExternalLink className="w-4 h-4 text-surface-300 dark:text-surface-600 group-hover:text-brand-400 transition-colors" />
        </div>
      </div>

      {/* Acceptance rate */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp className="w-3 h-3 text-surface-400" />
          <span className="text-xs text-surface-400">Acceptance</span>
        </div>
        <AcceptanceBar rate={problem.acRate} />
      </div>

      {/* Tags */}
      {problem.topicTags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {problem.topicTags.slice(0, 3).map((tag) => (
            <span key={tag.slug} className="px-2 py-0.5 rounded-full text-[11px] bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
              {tag.name}
            </span>
          ))}
          {problem.topicTags.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] text-surface-400">
              +{problem.topicTags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
