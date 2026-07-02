/**
 * pages/SettingsPage.jsx
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Sun, Moon, Monitor, Trash2, AlertTriangle, LogOut,
} from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { profileService } from '../services'
import { Spinner } from '../components/ui'
import { extractErrorMessage } from '../utils'
import toast from 'react-hot-toast'

const SettingsSection = ({ title, description, children }) => (
  <div className="glass-card p-6">
    <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-1">{title}</h3>
    {description && <p className="text-xs text-surface-400 mb-5">{description}</p>}
    {children}
  </div>
)

const ThemeOption = ({ value, label, icon: Icon, current, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
      current === value
        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
        : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
)

export const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore()
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await profileService.delete()
      await logout()
      toast.success('Account deleted')
      navigate('/login')
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Settings className="w-5 h-5" /> Settings
        </h1>
        <p className="text-sm text-surface-500">Manage your account preferences</p>
      </div>

      {/* Theme */}
      <SettingsSection
        title="Appearance"
        description="Choose how the app looks to you"
      >
        <div className="flex gap-3 flex-wrap">
          <ThemeOption value="light" label="Light" icon={Sun} current={theme} onClick={setTheme} />
          <ThemeOption value="dark" label="Dark" icon={Moon} current={theme} onClick={setTheme} />
          <ThemeOption value="system" label="System" icon={Monitor} current={theme} onClick={setTheme} />
        </div>
      </SettingsSection>

      {/* Account info */}
      <SettingsSection title="Account" description="Your account details">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
            <div>
              <p className="text-xs text-surface-400">Name</p>
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
            <div>
              <p className="text-xs text-surface-400">Email</p>
              <p className="text-sm font-medium text-surface-800 dark:text-surface-200">{user?.email}</p>
            </div>
          </div>
          {user?.leetcode_username && (
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs text-surface-400">LeetCode Username</p>
                <p className="text-sm font-medium text-surface-800 dark:text-surface-200">@{user.leetcode_username}</p>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Session */}
      <SettingsSection title="Session">
        <button
          onClick={handleLogout}
          className="btn-secondary gap-2 text-sm"
        >
          <LogOut className="w-4 h-4" /> Sign out of all devices
        </button>
      </SettingsSection>

      {/* Danger zone */}
      <SettingsSection
        title="Danger Zone"
        description="Irreversible actions — proceed with caution"
      >
        <div className="border border-rose-200 dark:border-rose-900 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Delete account</p>
              <p className="text-xs text-surface-400 mt-0.5">Permanently remove your account and all data</p>
            </div>
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            >
              Delete account
            </button>
          </div>
        </div>

        {/* Confirm dialog */}
        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3"
            >
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700 dark:text-rose-300">
                    This will permanently delete your account, all favorites, and search history. This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {deleting ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Yes, delete my account
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsSection>
    </div>
  )
}
