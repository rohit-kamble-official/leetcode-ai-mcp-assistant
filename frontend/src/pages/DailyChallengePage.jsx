/**
 * pages/DailyChallengePage.jsx
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Flame, Clock, ArrowRight, Bot, Star, Calendar,
  TrendingUp, ChevronRight,
} from 'lucide-react'
import { dailyService, favoritesService } from '../services'
import { QUERY_KEYS } from '../constants'
import { DifficultyBadge, Spinner, EmptyState } from '../components/ui'
import { extractErrorMessage, formatDate } from '../utils'
import toast from 'react-hot-toast'

const Countdown = () => {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.floor((midnight - now) / 1000)
      setTime({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5 text-surface-400" />
      <span className="text-xs text-surface-500">Resets in</span>
      <div className="flex items-center gap-1 font-mono text-xs font-semibold text-surface-800 dark:text-surface-200">
        {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
          <span key={i}>
            <span className="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">{v}</span>
            {i < 2 && <span className="mx-0.5 text-surface-400">:</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

export const DailyChallengePage = () => {
  const navigate = useNavigate()
  const [favorited, setFavorited] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState('')

  const { data: dailyData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.DAILY,
    queryFn: () => dailyService.getToday().then(r => r.data.data),
  })

  const { data: historyData } = useQuery({
    queryKey: QUERY_KEYS.DAILY_HISTORY,
    queryFn: () => dailyService.getHistory(14).then(r => r.data.data),
  })

  const addFav = useMutation({
    mutationFn: () => favoritesService.add({
      problemSlug: challenge?.titleSlug,
      problemTitle: challenge?.title,
      problemDifficulty: challenge?.difficulty,
    }),
    onSuccess: () => { setFavorited(true); toast.success('Added to favorites') },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const handleExplain = async () => {
    if (!challenge?.titleSlug) return
    setExplaining(true)
    try {
      const { data } = await dailyService.explainToday()
      setExplanation(data.data.explanation || '')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setExplaining(false)
    }
  }

  const challenge = dailyData?.question || dailyData

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-40 skeleton rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" /> Daily Challenge
        </h1>
        <p className="text-sm text-surface-500">{formatDate(new Date())}</p>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 p-6 text-white shadow-xl"
      >
        {/* Background circles */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="absolute rounded-full border-2 border-white"
              style={{ width: 120 + i * 100, height: 120 + i * 100, right: -40, bottom: -40 }} />
          ))}
        </div>

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur">
                  {challenge?.difficulty}
                </span>
                <Countdown />
              </div>
              <h2 className="text-2xl font-bold leading-tight mb-2">{challenge?.title}</h2>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{Math.round(challenge?.acRate || 0)}% acceptance rate</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {challenge?.topicTags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {challenge.topicTags.slice(0, 5).map(tag => (
                <span key={tag.slug} className="px-2.5 py-1 rounded-full text-xs bg-white/20 backdrop-blur">
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => challenge?.titleSlug && navigate(`/problems/${challenge.titleSlug}`)}
              disabled={!challenge?.titleSlug}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all shadow disabled:opacity-50"
            >
              Solve Now <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleExplain}
              disabled={explaining}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all backdrop-blur"
            >
              {explaining ? <Spinner size="sm" /> : <Bot className="w-4 h-4" />}
              AI Explain
            </button>
            <button
              onClick={() => addFav.mutate()}
              disabled={favorited}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all backdrop-blur"
            >
              <Star className={`w-4 h-4 ${favorited ? 'fill-white' : ''}`} />
              {favorited ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* AI Explanation */}
      {explanation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100">AI Explanation</h3>
          </div>
          <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed">
            {explanation}
          </p>
        </motion.div>
      )}

      {/* History */}
      {historyData?.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-surface-400" />
            <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100">Recent Challenges</h3>
          </div>
          <div className="space-y-2">
            {historyData.slice(0, 10).map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/problems/${item.problem_slug}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left"
              >
                <DifficultyBadge difficulty={item.problem_difficulty} />
                <span className="text-sm text-surface-700 dark:text-surface-300 flex-1 truncate">
                  {item.problem_title}
                </span>
                <span className="text-xs text-surface-400 shrink-0">
                  {new Date(item.challenge_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-surface-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
