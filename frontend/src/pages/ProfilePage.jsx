/**
 * pages/ProfilePage.jsx
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  User, Mail, Edit2, Save, X, ExternalLink,
  Trophy, Star, Search, Calendar,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { profileService, problemsService } from '../services'
import { QUERY_KEYS } from '../constants'
import { SolvedDonut } from '../components/charts/SolvedDonut'
import { SubmissionHeatmap } from '../components/charts/SubmissionHeatmap'
import { Spinner, Skeleton } from '../components/ui'
import { extractErrorMessage, formatDate } from '../utils'
import toast from 'react-hot-toast'

export const ProfilePage = () => {
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      leetcodeUsername: user?.leetcode_username || '',
    },
  })

  // Fetch LeetCode stats if username is set
  const { data: lcStats, isLoading: statsLoading } = useQuery({
    queryKey: QUERY_KEYS.USER_STATS(user?.leetcode_username),
    queryFn: () => problemsService.getUserStats(user.leetcode_username).then(r => r.data.data),
    enabled: !!user?.leetcode_username,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => profileService.update(data),
    onSuccess: ({ data }) => {
      updateUser(data.data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME })
      setEditing(false)
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  })

  const onSave = (data) => updateMutation.mutate(data)
  const onCancel = () => { reset(); setEditing(false) }

  const acData = lcStats?.submitStats?.acSubmissionNum || []
  const easy = acData.find(d => d.difficulty === 'Easy')?.count || 0
  const medium = acData.find(d => d.difficulty === 'Medium')?.count || 0
  const hard = acData.find(d => d.difficulty === 'Hard')?.count || 0

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">Profile</h1>

      {/* Profile card */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">{user?.name}</h2>
              <p className="text-sm text-surface-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {user?.email}
              </p>
              {user?.leetcode_username && (
                <a
                  href={`https://leetcode.com/${user.leetcode_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-500 flex items-center gap-1 mt-1 hover:text-brand-600"
                >
                  <ExternalLink className="w-3 h-3" /> @{user.leetcode_username}
                </a>
              )}
              <p className="text-xs text-surface-400 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined {formatDate(user?.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="btn-secondary gap-2 text-xs"
          >
            {editing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Edit form */}
        {editing && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit(onSave)}
            className="border-t border-surface-100 dark:border-surface-800 pt-5 space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">
                  Full name
                </label>
                <input
                  {...register('name', { required: 'Name required', minLength: { value: 2, message: 'Min 2 chars' } })}
                  className="input-field"
                  placeholder="Jane Doe"
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">
                  LeetCode username
                </label>
                <input
                  {...register('leetcodeUsername')}
                  className="input-field"
                  placeholder="your-lc-handle"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1.5">Bio</label>
              <textarea
                {...register('bio', { maxLength: { value: 500, message: 'Max 500 chars' } })}
                rows={3}
                className="input-field resize-none"
                placeholder="Tell us about yourself…"
              />
              {errors.bio && <p className="text-xs text-rose-500 mt-1">{errors.bio.message}</p>}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary gap-2">
                {updateMutation.isPending ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                Save changes
              </button>
              <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
            </div>
          </motion.form>
        )}

        {/* Bio display */}
        {!editing && user?.bio && (
          <p className="text-sm text-surface-600 dark:text-surface-400 border-t border-surface-100 dark:border-surface-800 pt-4">
            {user.bio}
          </p>
        )}
      </div>

      {/* LeetCode stats */}
      {user?.leetcode_username && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">LeetCode Statistics</h3>
          </div>

          {statsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : lcStats ? (
            <div className="space-y-6">
              {/* Rank & profile */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                <img
                  src={lcStats.profile?.userAvatar}
                  alt=""
                  className="w-12 h-12 rounded-full border-2 border-surface-200 dark:border-surface-700"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <div>
                  <p className="font-semibold text-surface-900 dark:text-surface-100">{lcStats.username}</p>
                  {lcStats.profile?.ranking && (
                    <p className="text-sm text-surface-500">Rank #{lcStats.profile.ranking.toLocaleString()}</p>
                  )}
                  {lcStats.profile?.countryName && (
                    <p className="text-xs text-surface-400">{lcStats.profile.countryName}</p>
                  )}
                </div>
              </div>

              {/* Donut chart */}
              <div>
                <p className="text-xs font-medium text-surface-500 mb-3">Problems Solved</p>
                <SolvedDonut stats={lcStats} />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Easy', value: easy, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Medium', value: medium, color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Hard', value: hard, color: 'text-rose-600 dark:text-rose-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-surface-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Heatmap */}
              {lcStats.submissionCalendar && (
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-3">Submission Activity</p>
                  <SubmissionHeatmap submissionCalendar={lcStats.submissionCalendar} />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-surface-400">
              Could not load LeetCode stats. Verify your username is correct and profile is public.
            </p>
          )}
        </div>
      )}

      {!user?.leetcode_username && (
        <div className="glass-card p-6 text-center">
          <Trophy className="w-8 h-8 text-surface-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Connect your LeetCode account</p>
          <p className="text-xs text-surface-400 mt-1 mb-4">Add your LeetCode username to see your stats and submission history</p>
          <button onClick={() => setEditing(true)} className="btn-primary text-xs">
            <Edit2 className="w-3.5 h-3.5" /> Add username
          </button>
        </div>
      )}
    </div>
  )
}
