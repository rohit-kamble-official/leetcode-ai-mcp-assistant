import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Spinner } from '../components/ui'
import toast from 'react-hot-toast'

export const RegisterPage = () => {
  const { register: signup, isLoading, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace: true }) }, [isAuthenticated])

  const onSubmit = async (data) => {
    const result = await signup({ name: data.name, email: data.email, password: data.password })
    if (result.success) { toast.success('Account created!'); navigate('/dashboard') }
    else toast.error(result.error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">L</span>
          </div>
          <span className="font-semibold text-surface-900 dark:text-surface-100">LeetCode AI</span>
        </div>

        <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-1">Create account</h2>
        <p className="text-sm text-surface-500 mb-7">Start solving smarter with AI assistance.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name:'name', label:'Full name', type:'text', icon:User, placeholder:'Jane Doe', rules:{required:'Required',minLength:{value:2,message:'Min 2 chars'}} },
            { name:'email', label:'Email', type:'email', icon:Mail, placeholder:'you@example.com', rules:{required:'Required',pattern:{value:/\S+@\S+\.\S+/,message:'Invalid email'}} },
            { name:'password', label:'Password', type:'password', icon:Lock, placeholder:'Min 8 chars', rules:{required:'Required',minLength:{value:8,message:'Min 8 chars'},pattern:{value:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,message:'Need uppercase, lowercase & number'}} },
          ].map(({ name, label, type, icon: Icon, placeholder, rules }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                <input {...register(name, rules)} type={type} placeholder={placeholder}
                  className={`input-field ${errors[name]?'!border-rose-400':''}`} />
              </div>
              {errors[name] && <p className="text-xs text-rose-500 mt-1">{errors[name].message}</p>}
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
              <input {...register('confirm',{required:'Required',validate:v=>v===password||"Passwords don't match"})}
                type="password" placeholder="••••••••"
                className={`input-field ${errors.confirm?'!border-rose-400':''}`} />
            </div>
            {errors.confirm && <p className="text-xs text-rose-500 mt-1">{errors.confirm.message}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full mt-1">
            {isLoading ? <Spinner size="sm"/> : <>Create account <ArrowRight className="w-3.5 h-3.5"/></>}
          </button>
        </form>

        <p className="text-sm text-center text-surface-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 font-medium hover:text-brand-600">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
