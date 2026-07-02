/**
 * routes/index.jsx
 * Centralized routing with lazy loading, protected routes, and auth guard.
 */
import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { useAuthStore } from '../store/authStore'
import { PageLoader } from '../components/ui'

const LoginPage          = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage       = lazy(() => import('../pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const NotFoundPage       = lazy(() => import('../pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const DashboardPage      = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProblemsPage       = lazy(() => import('../pages/ProblemsPage').then(m => ({ default: m.ProblemsPage })))
const ProblemDetailPage  = lazy(() => import('../pages/ProblemDetailPage').then(m => ({ default: m.ProblemDetailPage })))
const AIAssistantPage    = lazy(() => import('../pages/AIAssistantPage').then(m => ({ default: m.AIAssistantPage })))
const DailyChallengePage = lazy(() => import('../pages/DailyChallengePage').then(m => ({ default: m.DailyChallengePage })))
const FavoritesPage      = lazy(() => import('../pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })))
const HistoryPage        = lazy(() => import('../pages/HistoryPage').then(m => ({ default: m.HistoryPage })))
const ProfilePage        = lazy(() => import('../pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const SettingsPage       = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuthStore()
  const location = useLocation()
  if (isInitializing) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuthStore()
  if (isInitializing) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export const AppRouter = () => {
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [initialize])

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login"          element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register"       element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"           element={<DashboardPage />} />
          <Route path="/problems"            element={<ProblemsPage />} />
          <Route path="/problems/:titleSlug" element={<ProblemDetailPage />} />
          <Route path="/ai"                  element={<AIAssistantPage />} />
          <Route path="/daily"               element={<DailyChallengePage />} />
          <Route path="/favorites"           element={<FavoritesPage />} />
          <Route path="/history"             element={<HistoryPage />} />
          <Route path="/profile"             element={<ProfilePage />} />
          <Route path="/settings"            element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
