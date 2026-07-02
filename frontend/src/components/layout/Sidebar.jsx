import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, Flame, Star, History,
  Bot, User, Settings, LogOut, X,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/problems',  icon: BookOpen,         label: 'Problems' },
  { to: '/daily',     icon: Flame,            label: 'Daily Challenge' },
  { to: '/favorites', icon: Star,             label: 'Favorites' },
  { to: '/history',   icon: History,          label: 'History' },
  { to: '/ai',        icon: Bot,              label: 'AI Assistant' },
]

const BOTTOM = [
  { to: '/profile',  icon: User,     label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`
    }
  >
    {({ isActive }) => (
      <>
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-500 dark:text-brand-400' : ''}`} />
        <span className="truncate">{label}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400 shrink-0" />
        )}
      </>
    )}
  </NavLink>
)

const SidebarContent = ({ onClose }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full bg-surface-0 dark:bg-surface-925 border-r border-surface-200 dark:border-surface-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-surface-100 dark:border-surface-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center shadow-sm shadow-brand-500/30">
            <span className="text-white font-bold text-xs">L</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 leading-none">LeetCode AI</p>
            <p className="text-[10px] text-surface-400 leading-none mt-0.5">MCP Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden btn-ghost p-1.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User pill */}
      {user && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-850 border border-surface-100 dark:border-surface-800 flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-surface-800 dark:text-surface-200 truncate">{user.name}</p>
            <p className="text-[10px] text-surface-400 truncate">{user.email}</p>
          </div>
        </div>
      )}

      {/* Section label */}
      <div className="px-4 mt-5 mb-1.5 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-surface-400">Menu</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto pb-2">
        {NAV.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 border-t border-surface-100 dark:border-surface-800 pt-2 space-y-0.5 shrink-0">
        {BOTTOM.map(item => <NavItem key={item.to} {...item} onClick={onClose} />)}
        <button
          onClick={handleLogout}
          className="sidebar-item sidebar-item-inactive w-full hover:!bg-rose-50 dark:hover:!bg-rose-950/30 hover:!text-rose-600 dark:hover:!text-rose-400"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}

export const Sidebar = ({ open, onClose }) => (
  <>
    {/* Desktop */}
    <aside className="hidden lg:block w-56 shrink-0 h-screen sticky top-0 overflow-hidden">
      <SidebarContent onClose={() => {}} />
    </aside>

    {/* Mobile drawer */}
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 overflow-hidden"
          >
            <SidebarContent onClose={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  </>
)
