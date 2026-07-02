<div align="center">

# 🧠 LeetCode AI MCP Assistant

### AI-Powered LeetCode Companion — Full Stack Edition

*Supercharge your LeetCode grind with Claude AI, a Model Context Protocol (MCP) server, real-time WebSockets, and a slick React dashboard.*

[![CI](https://github.com/your-org/leetcode-ai-mcp-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/leetcode-ai-mcp-assistant/actions)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/vite-powered-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Overview](#-overview) • [Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API Docs](#-api-documentation) • [MCP Setup](#-mcp-server-setup) • [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Monorepo Structure](#-monorepo-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Docker Setup](#-docker-setup)
- [Running the Project](#-running-the-project)
- [Frontend Pages](#-frontend-pages)
- [API Documentation](#-api-documentation)
- [MCP Server Setup](#-mcp-server-setup)
- [WebSocket Protocol](#-websocket-protocol)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🚀 Overview

**LeetCode AI MCP Assistant** is a full-stack application that pairs LeetCode's problem library with Claude AI, wrapped in a polished, production-ready package:

- 🖥️ **Backend (Node.js/Express)** — REST API, MCP server, WebSockets, Redis caching, and Claude-powered AI tools
- 🎨 **Frontend (React 19)** — A ChatGPT-style AI assistant, live dashboards, heatmaps, and a full problem-solving workflow
- 🔌 **MCP Server** — Lets Claude Desktop, Cursor, and other MCP-compatible tools query LeetCode natively
- ⚡ **Real-time** — WebSocket notifications for submission status and live updates

Whether you're building your own AI-augmented coding practice tool or integrating LeetCode into your AI assistant's toolbelt, this project gives you both the engine and the dashboard.

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 🔧 Backend

| Category | Features |
|---|---|
| **Auth** | Register, Login, JWT access + refresh tokens, Logout |
| **Profile** | View, Update, Delete account |
| **LeetCode** | Search, Problem details, Daily challenge, Contests, User stats |
| **AI Tools** | Explain problem, Hints, Explain solution, Analyze code, Optimize, Time/Space complexity |
| **MCP Server** | 7 native tools for AI assistants |
| **Favorites** | Add, Remove, List |
| **History** | Search history, Recently viewed, Clear |
| **Daily** | Today's challenge, History, AI explanation |
| **Infra** | PostgreSQL, Redis, WebSockets, Docker, GitHub Actions CI |

</td>
<td width="50%" valign="top">

### 🎨 Frontend

| Category | Features |
|---|---|
| **Auth Flow** | Login, Register, Forgot Password UI |
| **Dashboard** | Live stats, daily challenge, favorites, recent activity |
| **Problems** | Search, filter, paginate, detailed problem view |
| **AI Assistant** | ChatGPT-style chat interface |
| **Daily Challenge** | Countdown timer + AI explanation |
| **Favorites** | Saved problems grid |
| **History** | Search history + recently viewed |
| **Profile** | LeetCode stats, submission heatmap |
| **Settings** | Theme toggle (dark mode), account, danger zone |
| **UX** | Skeleton loaders, toasts, animations |

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Client Layer                          │
│   React 19 SPA   │   Claude Desktop   │   Cursor   │  Continue │
└─────────┬──────────────────┬─────────────────┬────────────────┘
          │ REST / WS         │ MCP (stdio)
          ▼                   ▼
   ┌──────────────┐    ┌────────────────┐
   │  Express      │    │   MCP Server   │
   │  REST API     │    │  (stdio NDJSON)│
   └──────┬────────┘    └───────┬────────┘
          │                     │
          ▼                     ▼
   ┌────────────────────────────────────┐
   │            Service Layer            │
   │  authService │ leetcodeService     │
   │  aiService (Anthropic Claude)      │
   └──────┬───────────────────┬─────────┘
          │                   │
          ▼                   ▼
   ┌────────────┐      ┌─────────────┐
   │ PostgreSQL │      │    Redis    │
   │  (pg pool) │      │   (cache)   │
   └────────────┘      └─────────────┘
```

**Key Design Decisions**

- 🗂️ **Repository Pattern** — All SQL isolated in `repositories/`; services never write raw queries
- 🧩 **Service Layer** — All business logic in `services/`; controllers stay thin
- ♻️ **Singleton Connections** — One shared DB pool and one Redis client across the app
- 🛑 **Graceful Shutdown** — SIGTERM closes in-flight requests before exiting (critical for Docker/K8s)
- 📦 **Server State via TanStack Query** — Frontend caches and syncs API data automatically
- 🌓 **Dark Mode First-Class** — Theme persisted via Zustand store

---

## 🧰 Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Backend**

- Node.js 20+ / Express
- PostgreSQL (via `pg`)
- Redis (caching)
- WebSockets (`ws`)
- JWT auth (access + refresh)
- Anthropic Claude API
- Model Context Protocol SDK
- Jest (unit + integration tests)
- Docker / Docker Compose
- GitHub Actions CI

</td>
<td valign="top" width="50%">

**Frontend**

| Tool | Purpose |
|---|---|
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

</td>
</tr>
</table>

---

## 📁 Monorepo Structure

```
leetcode-ai-mcp-assistant/
├── backend/
│   ├── src/
│   │   ├── config/               # DB, Redis, logger, Swagger config
│   │   ├── controllers/          # Thin HTTP handlers
│   │   ├── middleware/           # auth, errorHandler, rateLimiter, validate
│   │   ├── repositories/         # All SQL lives here
│   │   ├── routes/               # Express Router definitions
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── ai/aiService.js         # Anthropic Claude integration
│   │   │   ├── leetcode/leetcodeService.js
│   │   │   └── mcp/mcpServer.js        # MCP tool definitions
│   │   ├── utils/                # AppError, response helpers
│   │   ├── validators/
│   │   ├── websocket/            # wsHandler.js
│   │   ├── app.js                # Express app (no server.listen)
│   │   └── server.js             # Entry point
│   ├── mcp/index.js              # Standalone MCP server entry point
│   ├── migrations/run.js
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/            # Skeleton, Badge, EmptyState, Spinner, CopyButton
    │   │   ├── layout/         # AppLayout, Sidebar, Header
    │   │   ├── problems/       # ProblemCard
    │   │   ├── dashboard/      # StatsCard
    │   │   └── charts/         # SolvedDonut, SubmissionHeatmap
    │   ├── pages/               # One file per route
    │   ├── routes/              # Router + ProtectedRoute + PublicRoute
    │   ├── services/            # api.js (axios) + endpoint definitions
    │   ├── store/                # authStore.js, themeStore.js (Zustand)
    │   ├── utils/                # cn, getDifficultyClass, formatDate...
    │   └── constants/            # QUERY_KEYS, DIFFICULTIES, TAGS, LANGUAGES
    └── package.json
```

---

## ✅ Prerequisites

- **Node.js** >= 20.0.0
- **PostgreSQL** >= 14
- **Redis** >= 6
- **Anthropic API Key** — [Get one here](https://console.anthropic.com)

---

## ⚡ Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/leetcode-ai-mcp-assistant.git
cd leetcode-ai-mcp-assistant
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your actual values
npm run migrate
npm run dev          # runs on http://localhost:3000
```

### 3. Set up the frontend

```bash
cd ../frontend
npm install
npm run dev           # runs on http://localhost:5173, proxies /api → :3000
```

Open **http://localhost:5173** — the dashboard should now be talking to your local backend. 🎉

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `leetcode_mcp` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | — |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | — **(required)** |
| `JWT_ACCESS_EXPIRES` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime | `7d` |
| `ANTHROPIC_API_KEY` | Claude API key | — **(required)** |
| `ANTHROPIC_MODEL` | Claude model to use | `claude-sonnet-4-6` |
| `CORS_ORIGIN` | Allowed CORS origin | `*` |
| `LOG_LEVEL` | Logging level | `info` |

### Frontend (`frontend/.env`)

```env
# Optional — the dev server proxy handles this automatically
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 🐳 Docker Setup

```bash
cd backend
cp .env.example .env

# Start all services (app + postgres + redis) with one command
docker compose up --build

# Run migrations inside Docker
docker compose run --rm migrate

# View logs
docker compose logs -f app

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes all data)
docker compose down -v
```

---

## 🏃 Running the Project

### Backend

```bash
npm run dev              # Development (auto-restart on file changes)
npm start                # Production
npm run migrate          # Run database migrations
node mcp/index.js        # Start MCP Server standalone (for Claude Desktop)
```

### Frontend

```bash
npm run dev               # Development server with hot reload
npm run build              # Production build → dist/
npm run preview            # Preview the production build
```

---

## 🖼️ Frontend Pages

| Route | Page |
|---|---|
| `/login` | Login with JWT |
| `/register` | Registration |
| `/forgot-password` | Password reset (UI only) |
| `/dashboard` | Stats, daily challenge, favorites, recent activity |
| `/problems` | Search, filter, paginate problems |
| `/problems/:slug` | Full problem detail + AI tools |
| `/ai` | ChatGPT-style AI assistant |
| `/daily` | Daily challenge + countdown + AI explain |
| `/favorites` | Saved problems grid |
| `/history` | Search history + recently viewed |
| `/profile` | LeetCode stats, submission heatmap, edit form |
| `/settings` | Theme toggle, account settings, danger zone |

---

## 📚 API Documentation

Interactive Swagger UI available at: **http://localhost:3000/api-docs**

### Authentication

All protected endpoints require:

```
Authorization: Bearer <accessToken>
```

### Endpoints Summary

<details>
<summary><strong>🔑 Auth — <code>/api/v1/auth</code></strong></summary>

| Method | Path | Auth | Description |
|---|---|:---:|---|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login |
| POST | `/refresh` | ❌ | Refresh access token |
| POST | `/logout` | ❌ | Logout |
| GET | `/me` | ✅ | Get current user |

</details>

<details>
<summary><strong>🧩 Problems — <code>/api/v1/problems</code></strong></summary>

| Method | Path | Auth | Description |
|---|---|:---:|---|
| GET | `/` | Optional | Search problems (`?q=two+sum&difficulty=easy`) |
| GET | `/:titleSlug` | Optional | Get problem details |
| GET | `/daily` | Optional | Today's daily challenge |
| GET | `/contests` | ❌ | Upcoming contests |
| GET | `/user/:username/stats` | ❌ | User's LeetCode stats |

</details>

<details>
<summary><strong>🤖 AI Tools — <code>/api/v1/ai</code></strong></summary>

| Method | Path | Auth | Description |
|---|---|:---:|---|
| POST | `/problems/:titleSlug/explain` | ✅ | AI problem explanation |
| POST | `/problems/:titleSlug/hints` | ✅ | Progressive hints |
| POST | `/problems/:titleSlug/explain-solution` | ✅ | Explain a solution |
| POST | `/analyze-code` | ✅ | Analyze code quality |
| POST | `/optimize-code` | ✅ | Optimization suggestions |
| POST | `/time-complexity` | ✅ | Time complexity analysis |
| POST | `/space-complexity` | ✅ | Space complexity analysis |

</details>

<details>
<summary><strong>⭐ Favorites — <code>/api/v1/favorites</code></strong></summary>

| Method | Path | Auth | Description |
|---|---|:---:|---|
| GET | `/` | ✅ | List favorites |
| POST | `/` | ✅ | Add favorite |
| DELETE | `/:problemSlug` | ✅ | Remove favorite |

</details>

<details>
<summary><strong>🕘 History — <code>/api/v1/history</code></strong></summary>

| Method | Path | Auth | Description |
|---|---|:---:|---|
| GET | `/` | ✅ | Search history |
| DELETE | `/` | ✅ | Clear all history |
| GET | `/recent` | ✅ | Recently viewed problems |
| DELETE | `/:id` | ✅ | Delete one history item |

</details>

<details>
<summary><strong>📅 Daily — <code>/api/v1/daily</code></strong></summary>

| Method | Path | Auth | Description |
|---|---|:---:|---|
| GET | `/` | Optional | Today's challenge |
| GET | `/history` | ❌ | Challenge history |
| GET | `/explain` | ✅ | AI explanation for today's challenge |

</details>

---

## 🔌 MCP Server Setup

The MCP server lets Claude Desktop and other AI tools use LeetCode directly, no browser required.

### Add to Claude Desktop

Edit `~/.config/claude/claude_desktop_config.json`
(Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "leetcode": {
      "command": "node",
      "args": ["/absolute/path/to/project/backend/mcp/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-your-key",
        "DB_HOST": "localhost",
        "DB_NAME": "leetcode_mcp",
        "DB_USER": "postgres",
        "DB_PASSWORD": "your-password",
        "REDIS_HOST": "localhost"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|---|---|
| `search_problems` | Search by keyword, difficulty, tags |
| `get_problem` | Full problem details by slug |
| `get_daily_problem` | Today's challenge |
| `explain_problem` | AI explanation |
| `get_hints` | Progressive hints |
| `analyze_solution` | Code analysis |
| `get_user_stats` | LeetCode user stats |

---

## 🔄 WebSocket Protocol

Connect to: `ws://localhost:3000/ws`

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// 1. Authenticate after connecting
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'AUTH', token: 'your-access-token' }));
};

// 2. Handle messages
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log(msg.type, msg); // AUTH_SUCCESS, NOTIFICATION, etc.
};

// 3. Heartbeat
setInterval(() => ws.send(JSON.stringify({ type: 'PING' })), 25000);
```

---

## 🧪 Testing

```bash
cd backend

npm test                       # Run all tests
npm run test:unit              # Unit tests only (fast, no network/DB)
npm run test:integration       # Integration tests only
npm test -- --coverage         # With coverage report
```

Tests use Jest with ES module support. All external dependencies (PostgreSQL, Redis, Anthropic API, LeetCode GraphQL) are mocked so tests run instantly without infrastructure.

---

## 🚢 Deployment

### Docker (recommended)

```bash
cd backend

# Build production image
docker build -t leetcode-mcp:latest --target production .

# Run with environment variables
docker run -p 3000:3000 \
  -e JWT_SECRET=your_secret \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e DB_HOST=your-db-host \
  -e REDIS_HOST=your-redis-host \
  leetcode-mcp:latest
```

### Frontend static build

```bash
cd frontend
npm run build
# Deploy dist/ to Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, etc.
```

### Manual

```bash
cd backend
NODE_ENV=production npm start
```

### ✅ Production Checklist

- [ ] `JWT_SECRET` is a long random string (at least 64 chars)
- [ ] `ANTHROPIC_API_KEY` is set
- [ ] `DB_PASSWORD` is set and strong
- [ ] `CORS_ORIGIN` is restricted to your frontend domain
- [ ] `NODE_ENV=production` is set
- [ ] HTTPS/TLS is terminated at load balancer or reverse proxy
- [ ] Frontend `VITE_API_URL` points to the production API URL
- [ ] Redis and PostgreSQL are provisioned with backups enabled

---

## 📄 License

MIT — free to use, modify, and distribute.

<div align="center">

**Built with ❤️ using Claude, Express, and React**

</div>
