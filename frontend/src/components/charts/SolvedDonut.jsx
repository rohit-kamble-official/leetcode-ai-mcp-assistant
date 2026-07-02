/**
 * components/charts/SolvedDonut.jsx
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export const SolvedDonut = ({ stats }) => {
  if (!stats) return null

  const acData = stats.submitStats?.acSubmissionNum || []
  const easy = acData.find(d => d.difficulty === 'Easy')?.count || 0
  const medium = acData.find(d => d.difficulty === 'Medium')?.count || 0
  const hard = acData.find(d => d.difficulty === 'Hard')?.count || 0
  const total = easy + medium + hard

  const data = [
    { name: 'Easy', value: easy, color: '#10b981' },
    { name: 'Medium', value: medium, color: '#f59e0b' },
    { name: 'Hard', value: hard, color: '#ef4444' },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-surface-400 text-sm">
        No submissions yet
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={56} dataKey="value" strokeWidth={0}>
              {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--color-surface-800)', border: 'none', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-surface-900 dark:text-surface-100">{total}</span>
          <span className="text-[10px] text-surface-400">solved</span>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: 'Easy', count: easy, color: 'bg-emerald-500' },
          { label: 'Medium', count: medium, color: 'bg-amber-500' },
          { label: 'Hard', count: hard, color: 'bg-rose-500' },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-surface-500 w-14">{label}</span>
            <span className="text-xs font-semibold text-surface-800 dark:text-surface-200">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
