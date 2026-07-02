# LeetCode AI MCP Assistant — Frontend

Production-ready React 19 frontend for the LeetCode AI MCP Assistant backend.

## Stack

| Tool | Purpose |
|------|---------|
| React 19 + Vite | UI framework + build |
| Tailwind CSS v4 | Styling with dark mode |
| React Router DOM | Client-side routing |
| TanStack Query | Server state & caching |
| Zustand | Auth & theme state |
| Axios | HTTP client with JWT interceptors |
| React Hook Form | Form validation |
| Framer Motion | Animations |
| Recharts | Charts (donut, heatmap) |
| React Hot Toast | Notifications |
| Lucide React | Icons |

## Pages

| Route | Page |
|-------|------|
| `/login` | Login with JWT |
| `/register` | Registration |
| `/forgot-password` | Password reset (UI only) |
| `/dashboard` | Stats, daily challenge, favorites, recent |
| `/problems` | Search, filter, paginate problems |
| `/problems/:slug` | Full detail + AI tools |
| `/ai` | ChatGPT-style AI assistant |
| `/daily` | Daily challenge + countdown + AI explain |
| `/favorites` | Saved problems grid |
| `/history` | Search history + recently viewed |
| `/profile` | LeetCode stats, heatmap, edit form |
| `/settings` | Theme toggle, account, danger zone |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (proxies /api → localhost:3000)
npm run dev
```

Ensure the backend is running on `http://localhost:3000` first.

## Environment

```env
# .env (optional — dev proxy handles this automatically)
VITE_API_URL=http://localhost:3000/api/v1
```

## Build for Production

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build
```

## Folder Structure

```
src/
├── components/
│   ├── ui/          # Skeleton, Badge, EmptyState, Spinner, CopyButton
│   ├── layout/      # AppLayout, Sidebar, Header
│   ├── problems/    # ProblemCard
│   ├── dashboard/   # StatsCard
│   └── charts/      # SolvedDonut, SubmissionHeatmap
├── pages/           # One file per route
├── routes/          # Router + ProtectedRoute + PublicRoute
├── services/        # api.js (axios) + index.js (all endpoints)
├── store/           # authStore.js, themeStore.js (Zustand)
├── utils/           # cn, getDifficultyClass, formatDate, etc.
└── constants/       # QUERY_KEYS, DIFFICULTIES, TAGS, LANGUAGES
```
