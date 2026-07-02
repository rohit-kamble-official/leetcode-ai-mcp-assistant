/**
 * store/themeStore.js
 *
 * BUG FIX: SettingsPage imported a `Monitor` icon implying a "System"
 * theme option existed, but this store only ever supported 'light'/'dark'
 * — there was no third option to select, and the icon was dead code.
 * Added real system-theme tracking: when theme === 'system', the store
 * listens to the OS color-scheme media query and updates live if the
 * user's OS theme changes while the app is open.
 */
import { create } from 'zustand'

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

const resolveTheme = (theme) => {
  if (theme === 'system') return mediaQuery.matches ? 'dark' : 'light'
  return theme
}

const applyTheme = (theme) => {
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark')
}

const getInitialTheme = () => {
  const stored = localStorage.getItem('theme')
  return stored || 'system'
}

const initial = getInitialTheme()
applyTheme(initial)

export const useThemeStore = create((set, get) => ({
  theme: initial,
  resolvedTheme: resolveTheme(initial),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    set({ theme, resolvedTheme: resolveTheme(theme) })
  },

  toggle: () => {
    const next = get().resolvedTheme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))

// Live-update if the user is on 'system' and their OS theme changes
mediaQuery.addEventListener('change', () => {
  const { theme, setTheme } = useThemeStore.getState()
  if (theme === 'system') {
    applyTheme('system')
    useThemeStore.setState({ resolvedTheme: resolveTheme('system') })
  }
})
