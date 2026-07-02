/**
 * components/dashboard/StatsCard.jsx
 */
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

export const StatsCard = ({ icon: Icon, label, value, sub, color = 'brand', index = 0 }) => {
  const colors = {
    brand: 'from-brand-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-red-600',
    purple: 'from-purple-500 to-violet-600',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="glass-card p-5 flex items-start gap-4"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 leading-none">{value ?? '—'}</p>
        {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
      </div>
    </motion.div>
  )
}
