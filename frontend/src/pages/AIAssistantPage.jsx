/**
 * pages/AIAssistantPage.jsx
 * ChatGPT-style AI interface connected to all backend AI endpoints.
 *
 * BUG FIX (architectural): the previous version silently defaulted
 * any free-form message with no quick-action selected to
 * `aiService.analyzeCode({ code: trimmed, language })`. The backend
 * has no general-purpose "chat" endpoint — every AI route requires a
 * specific intent (explain/hints/analyze/optimize/time/space). So a
 * plain English question like "what's the best way to learn DP?" was
 * silently sent to Claude as if it were source code to analyze,
 * producing confusing, wrong output while looking like a working chat.
 *
 * Fix: action selection is now mandatory before sending. The input
 * box is disabled with a clear prompt until the user picks what kind
 * of help they want, removing the guessing entirely.
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  Bot, Send, User, Sparkles, ChevronDown, AlertCircle,
} from 'lucide-react'
import { aiService } from '../services'
import { LANGUAGES } from '../constants'
import { Spinner, CopyButton } from '../components/ui'
import { extractErrorMessage } from '../utils'

const QUICK_PROMPTS = [
  { icon: '💡', label: 'Explain a problem', placeholder: 'Type a problem slug, e.g. two-sum', action: 'explain', needsSlug: true },
  { icon: '🎯', label: 'Get hints', placeholder: 'Type a problem slug, e.g. two-sum', action: 'hints', needsSlug: true },
  { icon: '🔍', label: 'Analyze my code', placeholder: 'Paste your code here…', action: 'analyze', needsSlug: false },
  { icon: '🚀', label: 'Optimize code', placeholder: 'Paste code to optimize…', action: 'optimize', needsSlug: false },
  { icon: '⏱️', label: 'Time complexity', placeholder: 'Paste code…', action: 'time', needsSlug: false },
  { icon: '💾', label: 'Space complexity', placeholder: 'Paste code…', action: 'space', needsSlug: false },
]

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'gradient-brand shadow' : 'bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-brand-500" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`relative group rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'gradient-brand text-white rounded-tr-sm'
            : 'bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200 rounded-tl-sm border border-surface-200 dark:border-surface-700'
        }`}>
          {msg.loading ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-surface-400 italic text-xs">AI is thinking…</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
          )}
          {!msg.loading && !isUser && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={msg.content} />
            </div>
          )}
        </div>
        {msg.action && (
          <span className="text-[10px] text-surface-400 mt-1 px-1">{msg.action}</span>
        )}
      </div>
    </motion.div>
  )
}

export const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'assistant',
      content: `Hello! I'm your LeetCode AI assistant. Pick an action below to get started:\n\n💡 Explain any LeetCode problem\n🎯 Generate progressive hints\n🔍 Analyze your code quality\n🚀 Suggest optimizations\n⏱️ Estimate time complexity\n💾 Estimate space complexity\n\nEach tool expects a specific kind of input (a problem slug, or code) — choosing an action first tells me which one to use.`,
    }
  ])
  const [activeQuick, setActiveQuick] = useState(null)
  const [language, setLanguage] = useState('python')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const { register, handleSubmit, reset, watch } = useForm()
  const textValue = watch('input', '')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), ...msg }])
  }

  const activePrompt = QUICK_PROMPTS.find(q => q.action === activeQuick)

  const callAI = async (action, input) => {
    const trimmed = input.trim()
    try {
      switch (action) {
        case 'explain': {
          const res = await aiService.explainProblem(trimmed)
          return res.data.data.explanation
        }
        case 'hints': {
          const res = await aiService.getHints(trimmed)
          return res.data.data.hints
        }
        case 'analyze': {
          const res = await aiService.analyzeCode({ code: trimmed, language })
          return res.data.data.analysis
        }
        case 'optimize': {
          const res = await aiService.optimizeCode({ code: trimmed, language })
          return res.data.data.suggestions
        }
        case 'time': {
          const res = await aiService.timeComplexity({ code: trimmed, language })
          return res.data.data.analysis
        }
        case 'space': {
          const res = await aiService.spaceComplexity({ code: trimmed, language })
          return res.data.data.analysis
        }
        default:
          return "Please choose an action above first — I need to know whether you're giving me a problem slug or code to work with."
      }
    } catch (err) {
      return `Error: ${extractErrorMessage(err)}`
    }
  }

  const onSubmit = async ({ input }) => {
    if (!input.trim() || isLoading || !activeQuick) return

    const userMsg = { role: 'user', content: input, action: activePrompt?.label }
    addMessage(userMsg)
    reset()
    setIsLoading(true)

    const loadingId = Date.now().toString() + '-ai'
    setMessages(prev => [...prev, { id: loadingId, role: 'assistant', content: '', loading: true }])

    const result = await callAI(activeQuick, input)

    setMessages(prev => prev.filter(m => m.id !== loadingId))
    addMessage({ role: 'assistant', content: result, action: activePrompt?.label })
    setIsLoading(false)
  }

  const handleQuickAction = (action) => {
    setActiveQuick(action === activeQuick ? null : action)
    reset()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            AI Assistant
          </h1>
          <p className="text-sm text-surface-500">Powered by Claude — explain, analyze, optimize</p>
        </div>

        <div className="relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-field pr-8 pl-3 py-2 text-xs appearance-none w-36 cursor-pointer"
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-surface-400 pointer-events-none" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-none">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q.action}
            onClick={() => handleQuickAction(q.action)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              activeQuick === q.action
                ? 'bg-brand-500 text-white border-brand-500 shadow-md'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-300'
            }`}
          >
            {q.icon} {q.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* No action selected — explicit prompt instead of guessing intent */}
      {!activeQuick && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-2 border border-amber-200 dark:border-amber-800 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400">
            Choose an action above to start — each tool needs a specific kind of input.
          </span>
        </div>
      )}

      <AnimatePresence>
        {activeQuick && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl mb-2 border border-brand-200 dark:border-brand-800">
              <span className="text-xs text-brand-600 dark:text-brand-400">
                {activePrompt?.label}: {activePrompt?.placeholder}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSubmit(onSubmit)} className="shrink-0">
        <div className={`glass-card p-2 flex items-end gap-2 ${!activeQuick ? 'opacity-60' : ''}`}>
          <textarea
            {...register('input', { required: true })}
            disabled={!activeQuick}
            placeholder={activePrompt?.placeholder || 'Select an action above first…'}
            rows={3}
            className="flex-1 resize-none bg-transparent outline-none text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 px-2 py-1 disabled:cursor-not-allowed"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(onSubmit)()
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !textValue?.trim() || !activeQuick}
            className="btn-primary p-2.5 shrink-0 self-end shadow-lg disabled:opacity-40"
          >
            {isLoading ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-center text-surface-400 mt-1.5">
          Press Enter to send · Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}
