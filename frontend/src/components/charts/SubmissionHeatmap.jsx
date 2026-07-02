/**
 * components/charts/SubmissionHeatmap.jsx
 */
import { useMemo } from 'react'
import { Tooltip } from '../ui'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

const getColor = (count) => {
  if (!count) return 'bg-surface-100 dark:bg-surface-800'
  if (count < 2) return 'bg-emerald-200 dark:bg-emerald-900'
  if (count < 4) return 'bg-emerald-400 dark:bg-emerald-700'
  if (count < 7) return 'bg-emerald-500 dark:bg-emerald-500'
  return 'bg-emerald-600 dark:bg-emerald-400'
}

export const SubmissionHeatmap = ({ submissionCalendar }) => {
  const weeks = useMemo(() => {
    const calendar = submissionCalendar ? JSON.parse(submissionCalendar) : {}
    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - 52 * 7 - start.getDay())

    const allWeeks = []
    let current = new Date(start)

    while (current <= now) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const ts = Math.floor(current.getTime() / 1000)
        const count = calendar[ts] || 0
        week.push({ date: new Date(current), count })
        current.setDate(current.getDate() + 1)
      }
      allWeeks.push(week)
    }
    return allWeeks
  }, [submissionCalendar])

  if (!submissionCalendar) return null

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5 min-w-max">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 pr-1 pt-5">
          {DAYS.map((d, i) => (
            <div key={i} className="h-3 text-[10px] text-surface-400 leading-none">{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {wi % 4 === 0 && (
              <div className="h-4 text-[10px] text-surface-400 leading-none mb-0.5">
                {MONTHS[week[0]?.date?.getMonth()]}
              </div>
            )}
            {wi % 4 !== 0 && <div className="h-4 mb-0.5" />}
            {week.map((day, di) => (
              <Tooltip
                key={di}
                content={`${day.date.toDateString()}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
              >
                <div className={`w-3 h-3 rounded-[2px] ${getColor(day.count)} transition-colors cursor-pointer`} />
              </Tooltip>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-surface-400">Less</span>
        {['bg-surface-100 dark:bg-surface-800','bg-emerald-200','bg-emerald-400','bg-emerald-500','bg-emerald-600'].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
        ))}
        <span className="text-[10px] text-surface-400">More</span>
      </div>
    </div>
  )
}
