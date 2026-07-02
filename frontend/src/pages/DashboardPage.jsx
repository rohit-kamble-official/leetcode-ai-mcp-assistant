import { lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Flame, Star, ArrowRight, Clock, TrendingUp,
  BookOpen, Bot, Search, CheckCircle2, Trophy,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { dailyService, historyService } from '../services'
import { useFavoritesList } from '../hooks/useFavorites'
import { QUERY_KEYS } from '../constants'
import { DifficultyBadge, Skeleton, EmptyState, Spinner } from '../components/ui'
import { formatDate } from '../utils'

const MotionCard = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.25 }}
    className={`glass-card p-5 ${className}`}
  >
    {children}
  </motion.div>
)

const StatCard = ({ icon: Icon, label, value, sub, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.2 }}
    className="glass-card p-4 flex items-center gap-3.5"
  >
    <div className={`w-9 h-9 rounded-xl ${gradient} flex items-center justify-center shadow-sm shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div>
      <p className="text-[11px] text-surface-400 font-medium">{label}</p>
      <p className="text-xl font-bold text-surface-900 dark:text-surface-100 leading-tight">{value ?? '—'}</p>
      {sub && <p className="text-[11px] text-surface-400 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
)

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: QUERY_KEYS.DAILY,
    queryFn: () => dailyService.getToday().then(r => r.data.data),
  })

  const { data: favData } = useFavoritesList()

  const { data: historyData } = useQuery({
    queryKey: QUERY_KEYS.HISTORY,
    queryFn: () => historyService.getSearchHistory({ limit: 5 }).then(r => r.data.data),
  })

  const { data: recentData } = useQuery({
    queryKey: QUERY_KEYS.RECENT,
    queryFn: () => historyService.getRecentlyViewed().then(r => r.data.data),
  })

  const daily = dailyData?.question || dailyData
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-5">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-brand p-6 text-white shadow-xl shadow-brand-500/20 noise"
      >
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute right-16 bottom-0 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-white/65 text-sm mb-0.5">{greeting},</p>
          <h1 className="text-xl font-bold mb-3">{user?.name || 'Coder'} 👋</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/daily')} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all backdrop-blur-sm border border-white/10">
              <Flame className="w-3.5 h-3.5" /> Today's challenge
            </button>
            <button onClick={() => navigate('/ai')} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all border border-white/10">
              <Bot className="w-3.5 h-3.5" /> AI Assistant
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Trophy}       label="Total Solved"  value="—"               sub="Connect LeetCode" gradient="gradient-brand"   delay={0} />
        <StatCard icon={CheckCircle2} label="Favorites"     value={favData?.length} sub="problems saved"   gradient="gradient-emerald" delay={0.04} />
        <StatCard icon={Search}       label="Searches"      value={historyData?.length} sub="this session"  gradient="bg-gradient-to-br from-amber-500 to-orange-500" delay={0.08} />
        <StatCard icon={Bot}          label="AI Calls"      value="—"               sub="Use AI tools"    gradient="bg-gradient-to-br from-purple-500 to-violet-600" delay={0.12} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Daily challenge — wider */}
        <MotionCard delay={0.1} className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">Daily Challenge</span>
            </div>
            <Link to="/daily" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5 transition-colors">
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {dailyLoading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-7 w-4/5" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-9 w-36 mt-3" />
            </div>
          ) : daily ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DifficultyBadge difficulty={daily.difficulty} />
                <span className="text-xs text-surface-400">{formatDate(new Date())}</span>
              </div>
              <h3 className="font-bold text-base text-surface-900 dark:text-surface-100 mb-2 leading-snug">{daily.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-surface-400 mb-3">
                <TrendingUp className="w-3 h-3" />
                <span>{Math.round(daily.acRate || 0)}% acceptance</span>
              </div>
              {daily.topicTags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {daily.topicTags.slice(0, 4).map(tag => (
                    <span key={tag.slug} className="px-2 py-0.5 rounded-full text-[11px] bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              <button onClick={() => daily.titleSlug && navigate(`/problems/${daily.titleSlug}`)} className="btn-primary text-sm" disabled={!daily.titleSlug}>
                Solve now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-surface-400">Could not load today's challenge.</p>
          )}
        </MotionCard>

        {/* Recently viewed */}
        <MotionCard delay={0.15} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-surface-400" />
              </div>
              <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">Recent</span>
            </div>
            <Link to="/history" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentData?.length > 0 ? (
            <div className="space-y-1">
              {recentData.slice(0, 5).map(item => (
                <button key={item.id} onClick={() => navigate(`/problems/${item.problem_slug}`)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors text-left group">
                  <DifficultyBadge difficulty={item.problem_difficulty} />
                  <span className="text-sm text-surface-700 dark:text-surface-300 truncate group-hover:text-surface-900 dark:group-hover:text-surface-100 transition-colors">
                    {item.problem_title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={Clock} title="No recent problems" description="Open problems to track history" />
          )}
        </MotionCard>
      </div>

      {/* Favorites preview */}
      <MotionCard delay={0.2}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">Favorites</span>
          </div>
          <Link to="/favorites" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-0.5">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {favData?.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {favData.slice(0, 6).map(fav => (
              <button key={fav.id} onClick={() => navigate(`/problems/${fav.problem_slug}`)}
                className="text-left p-3 rounded-xl panel hover:border-surface-300 dark:hover:border-surface-600 transition-colors">
                <DifficultyBadge difficulty={fav.problem_difficulty} />
                <p className="text-sm font-medium text-surface-800 dark:text-surface-200 mt-1.5 truncate">{fav.problem_title}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={Star} title="No favorites yet" description="Star problems to save them here" />
        )}
      </MotionCard>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon:Search, label:'Browse Problems', to:'/problems', g:'gradient-brand' },
          { icon:Flame,  label:'Daily Challenge',  to:'/daily',   g:'gradient-sunset' },
          { icon:Bot,    label:'AI Assistant',     to:'/ai',      g:'bg-gradient-to-br from-purple-500 to-violet-600' },
          { icon:BookOpen, label:'Your History',   to:'/history', g:'gradient-ocean' },
        ].map(({ icon: Icon, label, to, g }) => (
          <motion.button key={label} whileHover={{ y:-2 }} whileTap={{ scale:0.97 }}
            onClick={() => navigate(to)}
            className="glass-card p-4 flex flex-col items-center gap-2 text-center hover:shadow-md transition-all">
            <div className={`w-8 h-8 rounded-xl ${g} flex items-center justify-center shadow-sm`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
