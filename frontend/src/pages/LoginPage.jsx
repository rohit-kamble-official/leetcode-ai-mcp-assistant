import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Spinner } from '../components/ui'
import toast from 'react-hot-toast'

export const LoginPage = () => {
  const { login, isLoading, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace: true }) }, [isAuthenticated])

  const onSubmit = async (data) => {
    const result = await login(data)
    if (result.success) { toast.success('Welcome back!'); navigate('/dashboard') }
    else toast.error(result.error)
  }

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden gradient-brand items-center justify-center p-12">
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <motion.div key={i}
              className="absolute rounded-full border border-white/15"
              style={{ width: 140+i*130, height: 140+i*130, left:'50%', top:'50%', transform:'translate(-50%,-50%)' }}
              animate={{ scale:[1,1.04,1], opacity:[0.3,0.5,0.3] }}
              transition={{ duration:5+i*0.7, repeat:Infinity, delay:i*0.4 }}
            />
          ))}
        </div>
        <div className="relative text-white text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold">L</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">LeetCode AI</h1>
          <p className="text-white/70 leading-relaxed text-sm">
            AI-powered problem explanations, hints, code analysis, and an MCP server for your AI tools.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[['7+','AI Tools'],['MCP','Protocol'],['Real-time','Analysis']].map(([v,l]) => (
              <div key={l} className="bg-white/10 rounded-xl p-3 border border-white/10">
                <div className="text-lg font-bold">{v}</div>
                <div className="text-[11px] text-white/60 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 lg:max-w-[440px] flex items-center justify-center p-8">
        <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="font-semibold text-surface-900 dark:text-surface-100">LeetCode AI</span>
          </div>

          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-1">Sign in</h2>
          <p className="text-sm text-surface-500 mb-7">Welcome back — pick up where you left of.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
             <div className="relative">
  <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-center pointer-events-none">
    <Mail className="w-4 h-4 text-surface-400" />
  </div>

  <input
    {...register('email',{
      required:'Email required',
      pattern:{
        value:/\S+@\S+\.\S+/,
        message:'Invalid email'
      }
    })}
    type="email"
    placeholder="you@example.com"
    className={`input-field !pl-12 ${
      errors.email ? '!border-rose-400 focus:!ring-rose-400/20' : ''
    }`}
  />
</div>
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-surface-700 dark:text-surface-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-500 hover:text-brand-600 transition-colors">Forgot?</Link>
              </div>
             <div className="relative">
  <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-center pointer-events-none">
    <Lock className="w-4 h-4 text-surface-400" />
  </div>

  <input
    {...register('password',{required:'Password required'})}
    type="password"
    placeholder="••••••••"
    className={`input-field !pl-12 ${
      errors.password ? '!border-rose-400' : ''
    }`}
  />
</div>
              {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-1">
              {isLoading ? <Spinner size="sm"/> : <>Sign in <ArrowRight className="w-3.5 h-3.5"/></>}
            </button>
          </form>

          <p className="text-sm text-center text-surface-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-500 font-medium hover:text-brand-600 transition-colors">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
