/**
 * services/index.js
 * All API calls organized by domain.
 */
import { api } from './api'

// ── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
}

// ── Profile ──────────────────────────────────────────────────────────────────
export const profileService = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  delete: () => api.delete('/profile'),
}

// ── Problems ─────────────────────────────────────────────────────────────────
export const problemsService = {
  search: (params) => api.get('/problems', { params }),
  getBySlug: (titleSlug) => api.get(`/problems/${titleSlug}`),
  getDailyChallenge: () => api.get('/problems/daily'),
  getContests: () => api.get('/problems/contests'),
  getUserStats: (username) => api.get(`/problems/user/${username}/stats`),
}

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiService = {
  explainProblem: (titleSlug) => api.post(`/ai/problems/${titleSlug}/explain`),
  getHints: (titleSlug) => api.post(`/ai/problems/${titleSlug}/hints`),
  explainSolution: (titleSlug, data) => api.post(`/ai/problems/${titleSlug}/explain-solution`, data),
  analyzeCode: (data) => api.post('/ai/analyze-code', data),
  optimizeCode: (data) => api.post('/ai/optimize-code', data),
  timeComplexity: (data) => api.post('/ai/time-complexity', data),
  spaceComplexity: (data) => api.post('/ai/space-complexity', data),
}

// ── Favorites ────────────────────────────────────────────────────────────────
export const favoritesService = {
  list: (params) => api.get('/favorites', { params }),
  add: (data) => api.post('/favorites', data),
  remove: (problemSlug) => api.delete(`/favorites/${problemSlug}`),
}

// ── History ───────────────────────────────────────────────────────────────────
export const historyService = {
  getSearchHistory: (params) => api.get('/history', { params }),
  getRecentlyViewed: () => api.get('/history/recent'),
  clearAll: () => api.delete('/history'),
  deleteItem: (id) => api.delete(`/history/${id}`),
}

// ── Daily ────────────────────────────────────────────────────────────────────
export const dailyService = {
  getToday: () => api.get('/daily'),
  getHistory: (limit) => api.get('/daily/history', { params: { limit } }),
  explainToday: () => api.get('/daily/explain'),
}
