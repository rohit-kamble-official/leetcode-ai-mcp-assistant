/**
 * services/api.js
 * Axios instance with JWT interceptors and refresh token support.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401, refresh token
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Endpoints where a 401 means "credentials are wrong / token itself
    // is invalid" — NOT "access token expired, please refresh". Running
    // the refresh-and-redirect flow here was forcing a hard page reload
    // mid-login whenever someone typed the wrong password, wiping the
    // inline form error before they could read it.
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login')
      || originalRequest?.url?.includes('/auth/register')
      || originalRequest?.url?.includes('/auth/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        // No refresh token — clear auth and redirect
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = data.data

        localStorage.setItem('accessToken', accessToken)
        if (newRefresh) localStorage.setItem('refreshToken', newRefresh)

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        processQueue(null, accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
