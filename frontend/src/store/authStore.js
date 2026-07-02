/**
 * store/authStore.js
 * Global auth state with Zustand. Persists tokens to localStorage.
 */
import { create } from 'zustand'
import { authService } from '../services'

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  isInitializing: true,

  initialize: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ isInitializing: false })
      return
    }
    try {
      const { data } = await authService.me()
      set({ user: data.data, isAuthenticated: true, isInitializing: false })
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null, isInitializing: false })
    }
  },

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const { data } = await authService.login(credentials)
      const { user, accessToken, refreshToken } = data.data
      localStorage.setItem('accessToken', accessToken)
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
      set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false })
      return { success: true }
    } catch (err) {
      set({ isLoading: false })
      return { success: false, error: err.response?.data?.error?.message || 'Login failed' }
    }
  },

  register: async (userData) => {
    set({ isLoading: true })
    try {
      const { data } = await authService.register(userData)
      const { user, accessToken, refreshToken } = data.data
      localStorage.setItem('accessToken', accessToken)
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
      set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false })
      return { success: true }
    } catch (err) {
      set({ isLoading: false })
      return { success: false, error: err.response?.data?.error?.message || 'Registration failed' }
    }
  },

  logout: async () => {
    try {
      await authService.logout(get().refreshToken)
    } catch { /* ignore */ }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },

  updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
}))
