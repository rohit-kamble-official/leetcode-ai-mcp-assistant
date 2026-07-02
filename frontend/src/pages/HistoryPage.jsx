/**
 * pages/HistoryPage.jsx
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History, Clock, Search, Trash2, X, ChevronRight, AlertCircle,
} from 'lucide-react'
import { historyService } from '../services'
import { QUERY_KEYS } from '../constants'
import { DifficultyBadge, EmptyState, Skeleton } from '../components/ui'
import { extractErrorMessage } from '../utils'
import toast from 'react-hot-toast'

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
      active
        ? 'bg-brand-500 text-white shadow'
        : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
    }`}
  >
    {children}
  </button>
)

export const HistoryPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('searches')
  const [confirmClear, setConfirmClear] = useState(false)

  const { data: searchHistory, isLoading: searchLoading } = useQuery({
    queryKey: QUERY_KEYS.HISTORY,
    queryFn: () => historyService.getSearchHistory({ limit: 50 }).then(r => r.data.data),
  })

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: QUERY_KEYS.RECENT,
    queryFn: () => historyService.getRecentlyViewed().then(r => r.data.data),
  })

  const deleteItem = useMutation({
    mutationFn: (id) => historyService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HISTORY })
      toast.success('Entry deleted')
    },
  })

  const clearAll = useMutation({
    mutationFn: () => historyService.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HISTORY })
      setConfirmClear(false)
      toast.success('History cleared')
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <History className="w-5 h-5" /> History
          </h1>
          <p className="text-sm text-surface-500">Your searches and recently viewed problems</p>
        </div>
        {searchHistory?.length > 0 && tab === 'searches' && (
          <button
            onClick={() => setConfirmClear(true)}
            className="btn-secondary text-xs text-rose-500 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        )}
      </div>

      {/* Confirm clear modal */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card p-4 border border-rose-200 dark:border-rose-800 flex items-center gap-3"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-sm text-surface-700 dark:text-surface-300 flex-1">
              Clear all search history? This cannot be undone.
            </p>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setConfirmClear(false)} className="btn-secondary text-xs">Cancel</button>
              <button
                onClick={() => clearAll.mutate()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        <TabButton active={tab === 'searches'} onClick={() => setTab('searches')}>
          <Search className="w-3.5 h-3.5 inline mr-1.5" />Searches
        </TabButton>
        <TabButton active={tab === 'recent'} onClick={() => setTab('recent')}>
          <Clock className="w-3.5 h-3.5 inline mr-1.5" />Recently Viewed
        </TabButton>
      </div>

      {/* Search history */}
      {tab === 'searches' && (
        <div>
          {searchLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : searchHistory?.length === 0 ? (
            <EmptyState icon={Search} title="No searches yet" description="Your search history will appear here" />
          ) : (
            <div className="glass-card divide-y divide-surface-100 dark:divide-surface-800">
              <AnimatePresence>
                {searchHistory?.map((item) => (
                  <motion.div
                    key={item.id}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 group transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                    <button
                      className="flex-1 text-left"
                      onClick={() => navigate(`/problems?q=${encodeURIComponent(item.query)}`)}
                    >
                      <span className="text-sm text-surface-800 dark:text-surface-200">{item.query}</span>
                      <span className="text-xs text-surface-400 ml-2">
                        {item.result_count} results · {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteItem.mutate(item.id)}
                      className="opacity-0 group-hover:opacity-100 btn-ghost p-1 hover:text-rose-500 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Recently viewed */}
      {tab === 'recent' && (
        <div>
          {recentLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : recentData?.length === 0 ? (
            <EmptyState icon={Clock} title="No recently viewed" description="Problems you open will appear here" />
          ) : (
            <div className="glass-card divide-y divide-surface-100 dark:divide-surface-800">
              {recentData?.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/problems/${item.problem_slug}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left"
                >
                  <Clock className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-800 dark:text-surface-200 truncate">{item.problem_title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <DifficultyBadge difficulty={item.problem_difficulty} />
                      <span className="text-xs text-surface-400">
                        {new Date(item.viewed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
