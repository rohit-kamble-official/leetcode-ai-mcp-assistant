export const QUERY_KEYS = {
  ME: ['me'],
  PROBLEMS: ['problems'],
  PROBLEM: (slug) => ['problem', slug],
  DAILY: ['daily'],
  FAVORITES: ['favorites'],
  HISTORY: ['history'],
  RECENT: ['recently-viewed'],
  CONTESTS: ['contests'],
  USER_STATS: (username) => ['user-stats', username],
  DAILY_HISTORY: ['daily-history'],
}

export const DIFFICULTIES = ['easy', 'medium', 'hard']

export const TAGS = [
  'array', 'string', 'hash-table', 'dynamic-programming', 'math',
  'sorting', 'greedy', 'depth-first-search', 'binary-search', 'tree',
  'breadth-first-search', 'matrix', 'two-pointers', 'bit-manipulation',
  'stack', 'heap', 'graph', 'linked-list', 'sliding-window', 'backtracking',
]

export const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'kotlin', label: 'Kotlin' },
]

export const AI_ACTIONS = [
  { id: 'explain', label: 'Explain Problem', icon: '💡' },
  { id: 'hints', label: 'Generate Hints', icon: '🎯' },
  { id: 'time', label: 'Time Complexity', icon: '⏱️' },
  { id: 'space', label: 'Space Complexity', icon: '💾' },
  { id: 'optimize', label: 'Optimize Code', icon: '🚀' },
  { id: 'analyze', label: 'Analyze Code', icon: '🔍' },
]
