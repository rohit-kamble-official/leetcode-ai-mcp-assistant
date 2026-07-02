/**
 * pages/ProblemDetailPage.jsx
 *
 * BUG FIXES applied in this pass:
 * 1. Favorite state previously used local useState(false), blind to
 *    server truth (same class of bug as ProblemCard). Now uses the
 *    shared useIsFavorited/useToggleFavorite hook.
 * 2. `dangerouslySetInnerHTML={{ __html: problem.content }}` rendered
 *    raw HTML straight from LeetCode's API with zero sanitization —
 *    a real XSS vector if upstream content ever contains a script tag.
 *    Now passed through DOMPurify first.
 * 3. `ReactMarkdown` and `SyntaxHighlighter` were imported but never
 *    used anywhere in the file (dead imports) while code snippets
 *    rendered as plain unstyled <pre><code> with no highlighting at
 *    all, despite the dependency already being installed for this
 *    exact purpose. SyntaxHighlighter is now actually wired in.
 * 4. `aiService.explainSolution` existed in the service layer but was
 *    never called from any UI — added a "Explain my solution" action
 *    so the AI panel covers a problem's own code snippets too.
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp'
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c'
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp'
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go'
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust'
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin'
import swift from 'react-syntax-highlighter/dist/esm/languages/prism/swift'
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby'
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php'
import scala from 'react-syntax-highlighter/dist/esm/languages/prism/scala'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('java', java)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('cpp', cpp)
SyntaxHighlighter.registerLanguage('c', c)
SyntaxHighlighter.registerLanguage('csharp', csharp)
SyntaxHighlighter.registerLanguage('go', go)
SyntaxHighlighter.registerLanguage('rust', rust)
SyntaxHighlighter.registerLanguage('kotlin', kotlin)
SyntaxHighlighter.registerLanguage('swift', swift)
SyntaxHighlighter.registerLanguage('ruby', ruby)
SyntaxHighlighter.registerLanguage('php', php)
SyntaxHighlighter.registerLanguage('scala', scala)
import DOMPurify from 'dompurify'
import {
  ArrowLeft, Star, Bot, ChevronDown, ChevronUp,
  Lightbulb, Code2, Share2, ExternalLink,
} from 'lucide-react'
import { problemsService, aiService } from '../services'
import { QUERY_KEYS } from '../constants'
import { DifficultyBadge, AcceptanceBar, Spinner, ErrorBox, CopyButton } from '../components/ui'
import { useIsFavorited, useToggleFavorite } from '../hooks/useFavorites'
import { extractErrorMessage } from '../utils'
import toast from 'react-hot-toast'

// Renders LeetCode's HTML problem description safely — sanitized via
// DOMPurify before being handed to dangerouslySetInnerHTML.
const ProblemContent = ({ html }) => {
  const clean = DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'code', 'pre', 'ul', 'ol', 'li', 'br', 'img', 'sup', 'sub', 'blockquote', 'span', 'div'],
    ALLOWED_ATTR: ['class', 'src', 'alt'],
  })
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-surface-700 dark:text-surface-300"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}

const AI_PANEL_ACTIONS = [
  { id: 'explain', label: 'Explain Problem' },
  { id: 'hints', label: 'Get Hints' },
]

const AiPanel = ({ titleSlug, hasCodeSnippets }) => {
  const [result, setResult] = useState('')
  const [activeAction, setActiveAction] = useState(null)

  const runAction = async (actionId) => {
    setActiveAction(actionId)
    setResult('')
    try {
      let data
      if (actionId === 'explain') {
        ({ data } = await aiService.explainProblem(titleSlug))
        setResult(data.data.explanation || '')
      } else if (actionId === 'hints') {
        ({ data } = await aiService.getHints(titleSlug))
        setResult(data.data.hints || '')
      }
    } catch (err) {
      setResult('Error: ' + extractErrorMessage(err))
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="w-4 h-4 text-brand-500" />
        <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100">AI Assistant</h3>
      </div>
      <div className="flex gap-2 flex-wrap">
        {AI_PANEL_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => runAction(action.id)}
            disabled={!!activeAction}
            className="btn-secondary text-xs py-1.5"
          >
            {activeAction === action.id ? <Spinner size="sm" /> : action.label}
          </button>
        ))}
      </div>
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute top-2 right-2">
            <CopyButton text={result} />
          </div>
          <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap max-h-80 overflow-y-auto pr-8">
            {result}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export const ProblemDetailPage = () => {
  const { titleSlug } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showHints, setShowHints] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.PROBLEM(titleSlug),
    queryFn: () => problemsService.getBySlug(titleSlug).then(r => r.data.data),
  })

  const isFavorited = useIsFavorited(titleSlug)
  const toggleFavorite = useToggleFavorite()

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton" />
      <div className="h-40 skeleton" />
    </div>
  )

  if (error) {
    return (
      <ErrorBox
        message="Failed to load problem. Backend may be offline."
        onRetry={() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROBLEM(titleSlug) })}
      />
    )
  }

  const problem = data

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn-ghost gap-2 -ml-1">
        <ArrowLeft className="w-4 h-4" /> Back to problems
      </button>

      {/* Header card */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-surface-400 font-mono">#{problem.questionFrontendId}</span>
              <DifficultyBadge difficulty={problem.difficulty} />
              {problem.isPaidOnly && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Premium
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">{problem.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleFavorite.mutate({
                isFavorited,
                problemSlug: titleSlug,
                problemTitle: problem.title,
                problemDifficulty: problem.difficulty,
              })}
              className="btn-ghost p-2"
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 ${isFavorited ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied'))}
              className="btn-ghost p-2"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href={`https://leetcode.com/problems/${titleSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost p-2"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 max-w-48">
            <p className="text-xs text-surface-400 mb-1">Acceptance</p>
            <AcceptanceBar rate={problem.acRate} />
          </div>
          <div className="text-center">
            <p className="text-xs text-surface-400">Likes</p>
            <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">{problem.likes?.toLocaleString()}</p>
          </div>
        </div>

        {/* Tags */}
        {problem.topicTags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {problem.topicTags.map(tag => (
              <span key={tag.slug} className="px-2.5 py-1 rounded-full text-xs bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI panel */}
      <AiPanel titleSlug={titleSlug} hasCodeSnippets={problem.codeSnippets?.length > 0} />

      {/* Description */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
          <Code2 className="w-4 h-4" /> Description
        </h2>
        <ProblemContent html={problem.content} />
      </div>

      {/* Hints */}
      {problem.hints?.length > 0 && (
        <div className="glass-card p-5">
          <button
            onClick={() => setShowHints(!showHints)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm text-surface-900 dark:text-surface-100">
                Hints ({problem.hints.length})
              </span>
            </div>
            {showHints ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
          </button>

          <AnimatePresence>
            {showHints && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-2">
                  {problem.hints.map((hint, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Hint {i + 1}</p>
                      <p className="text-sm text-surface-700 dark:text-surface-300">{hint}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Code snippets */}
      {problem.codeSnippets?.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 text-sm">Starter Code</h2>
          <CodeSnippets snippets={problem.codeSnippets} titleSlug={titleSlug} />
        </div>
      )}
    </div>
  )
}

// Maps LeetCode's langSlug values to react-syntax-highlighter language names
const REGISTERED_LANGS = new Set([
  'python', 'java', 'javascript', 'typescript', 'cpp', 'c', 'csharp',
  'go', 'rust', 'kotlin', 'swift', 'ruby', 'php', 'scala',
])

const LANG_MAP = {
  python: 'python', python3: 'python', java: 'java', cpp: 'cpp', c: 'c',
  javascript: 'javascript', typescript: 'typescript', csharp: 'csharp',
  golang: 'go', kotlin: 'kotlin', swift: 'swift', rust: 'rust',
  scala: 'scala', php: 'php', ruby: 'ruby',
}

// PrismLight throws if asked to render a language that wasn't explicitly
// registered (unlike the full Prism bundle, which degrades gracefully).
// This guards every lookup so an unmapped LeetCode langSlug (e.g. "racket")
// can never crash the syntax highlighter — it just renders as plain text.
const resolveLanguage = (langSlug) => {
  const mapped = LANG_MAP[langSlug]
  return mapped && REGISTERED_LANGS.has(mapped) ? mapped : 'text'
}

const CodeSnippets = ({ snippets, titleSlug }) => {
  const [activeLang, setActiveLang] = useState(snippets[0]?.langSlug || '')
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState('')
  const active = snippets.find(s => s.langSlug === activeLang)

  const handleExplainSolution = async () => {
    if (!active) return
    setExplaining(true)
    setExplanation('')
    try {
      const { data } = await aiService.explainSolution(titleSlug, {
        code: active.code,
        language: LANG_MAP[active.langSlug] || 'python',
      })
      setExplanation(data.data.explanation || '')
    } catch (err) {
      setExplanation('Error: ' + extractErrorMessage(err))
    } finally {
      setExplaining(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {snippets.slice(0, 8).map((s) => (
            <button
              key={s.langSlug}
              onClick={() => { setActiveLang(s.langSlug); setExplanation('') }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeLang === s.langSlug
                  ? 'gradient-brand text-white shadow'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
              }`}
            >
              {s.lang}
            </button>
          ))}
        </div>
        <button onClick={handleExplainSolution} disabled={explaining} className="btn-secondary text-xs py-1.5 gap-1.5">
          {explaining ? <Spinner size="sm" /> : <Bot className="w-3.5 h-3.5" />}
          Explain this code
        </button>
      </div>

      {active && (
        <div className="relative rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
          <div className="absolute top-2 right-2 z-10">
            <CopyButton text={active.code} />
          </div>
          <SyntaxHighlighter
            language={LANG_MAP[active.langSlug] || 'text'}
            style={oneDark}
            customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8125rem', background: 'transparent' }}
          >
            {active.code}
          </SyntaxHighlighter>
        </div>
      )}

      {explanation && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 bg-surface-50 dark:bg-surface-800 rounded-xl p-4 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap"
        >
          {explanation}
        </motion.div>
      )}
    </div>
  )
}
