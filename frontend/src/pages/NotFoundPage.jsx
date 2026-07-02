/**
 * pages/NotFoundPage.jsx
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

export const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-950 text-center p-8">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      <div className="text-8xl font-black bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent">404</div>
      <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">Page not found</h2>
      <p className="text-surface-500 text-sm max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn-primary inline-flex mt-4">
        <Home className="w-4 h-4" /> Back to Dashboard
      </Link>
    </motion.div>
  </div>
)
