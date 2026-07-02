/**
 * pages/ForgotPasswordPage.jsx — UI only (no backend endpoint)
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

export const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = () => setSent(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">Check your email</h2>
            <p className="text-sm text-surface-500">
              If an account exists for that email, we've sent password reset instructions.
            </p>
            <Link to="/login" className="btn-primary mt-6 inline-flex">Back to login</Link>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center mb-6 shadow-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-1">Forgot password?</h2>
            <p className="text-sm text-surface-500 mb-8">Enter your email and we'll send reset instructions.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    {...register('email', { required: true, pattern: /\S+@\S+\.\S+/ })}
                    type="email"
                    placeholder="you@example.com"
                    className={`input-field pl-10 ${errors.email ? 'border-rose-500' : ''}`}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">Send reset link</button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
