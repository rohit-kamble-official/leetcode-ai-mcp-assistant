import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Moon, Sun, X } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { motion, AnimatePresence } from 'framer-motion'

export const Header = ({ onMenuClick }) => {
  const { resolvedTheme, toggle } = useThemeStore()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/problems?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
      setFocused(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-surface-200 dark:border-surface-800 bg-surface-0/90 dark:bg-surface-925/90 backdrop-blur-xl flex items-center px-4 gap-3">
      <button onClick={onMenuClick} className="lg:hidden btn-ghost p-1.5">
        <Menu className="w-4.5 h-4.5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm">
        <div className={`relative flex items-center transition-all ${focused ? 'ring-2 ring-brand-500/30 rounded-lg' : ''}`}>
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-surface-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search problems…"
            className="w-full pl-8 pr-8 py-1.5 text-sm bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-750 rounded-lg outline-none placeholder:text-surface-400 text-surface-800 dark:text-surface-200 focus:bg-surface-0 dark:focus:bg-surface-850 focus:border-brand-400 transition-all"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={toggle}
          className="btn-ghost p-2"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <AnimatePresence mode="wait">
            {resolvedTheme === 'dark'
              ? <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Sun className="w-4 h-4 text-amber-400" />
                </motion.div>
              : <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Moon className="w-4 h-4 text-surface-500" />
                </motion.div>
            }
          </AnimatePresence>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center text-white text-xs font-bold ml-1 hover:opacity-90 transition-opacity shadow-sm shadow-brand-500/30"
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </button>
      </div>
    </header>
  )
}
