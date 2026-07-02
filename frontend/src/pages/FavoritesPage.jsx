/**
 * pages/FavoritesPage.jsx
 * Uses shared useFavoritesList + useToggleFavorite — no more cache collision.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Trash2, ExternalLink, Search } from 'lucide-react'
import { DifficultyBadge, EmptyState, CardSkeleton } from '../components/ui'
import { useFavoritesList, useToggleFavorite } from '../hooks/useFavorites'

export const FavoritesPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useFavoritesList()
  const toggle = useToggleFavorite()

  const favorites = (data || []).filter(f =>
    !search || f.problem_title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Favorites
          </h1>
          <p className="text-sm text-surface-500">
            {search
              ? `${favorites.length} of ${data?.length || 0} saved problems`
              : `${data?.length || 0} saved problems`}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter favorites…"
          className="input-field pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Star}
          title={search ? 'No matches' : 'No favorites yet'}
          description={search ? 'Try a different search' : 'Star problems to save them here for quick access'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {favorites.map((fav) => (
              <motion.div
                key={fav.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <DifficultyBadge difficulty={fav.problem_difficulty} />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/problems/${fav.problem_slug}`)}
                      className="btn-ghost p-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggle.mutate({
                        isFavorited: true,
                        problemSlug: fav.problem_slug,
                        problemTitle: fav.problem_title,
                        problemDifficulty: fav.problem_difficulty,
                      })}
                      className="btn-ghost p-1.5 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3
                  className="font-semibold text-surface-900 dark:text-surface-100 text-sm leading-snug cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  onClick={() => navigate(`/problems/${fav.problem_slug}`)}
                >
                  {fav.problem_title}
                </h3>
                <p className="text-xs text-surface-400 mt-2">
                  Added {new Date(fav.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
