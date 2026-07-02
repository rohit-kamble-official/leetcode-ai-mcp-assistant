# LeetCode AI MCP Assistant

> A production-ready Node.js backend that supercharges LeetCode with AI-powered problem analysis, a Model Context Protocol (MCP) server for AI assistants, real-time WebSockets, and a complete REST API.

[![CI](https://github.com/your-org/leetcode-ai-mcp-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/leetcode-ai-mcp-assistant/actions)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Docker Setup](#docker-setup)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [MCP Server Setup](#mcp-server-setup)
- [WebSocket Protocol](#websocket-protocol)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

LeetCode AI MCP Assistant is a full-stack backend that connects LeetCode's problem library with Claude AI and exposes it via:

1. **REST API** — CRUD for users, favorites, search history, AI tools
2. **MCP Server** — lets Claude Desktop, Cursor, and other MCP-compatible AI tools use LeetCode natively
3. **WebSockets** — real-time submission status and notifications
4. **Redis Cache** — sub-millisecond responses for repeated queries

---

## Features

| Category | Features |
|----------|----------|
| **Auth** | Register, Login, JWT access + refresh tokens, Logout |
| **Profile** | View, Update, Delete account |
| **LeetCode** | Search problems, Problem details, Daily challenge, Contests, User stats |
| **AI Tools** | Explain problem, Generate hints, Explain solution, Analyze code, Suggest optimizations, Time/space complexity |
| **MCP Server** | `search_problems`, `get_problem`, `get_daily_problem`, `explain_problem`, `get_hints`, `analyze_solution`, `get_user_stats` |
| **Favorites** | Add, Remove, List favorited problems |
| **History** | Search history, Recently viewed, Clear history |
| **Daily** | Today's challenge, Challenge history, AI explanation |
| **Infrastructure** | PostgreSQL, Redis, WebSockets, Docker, GitHub Actions CI |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client Layer                       │
│  Frontend App │ Claude Desktop │ Cursor │ Continue  │
└──────┬────────────────┬────────────────────────────-─┘
       │ REST / WS      │ MCP (stdio)
       ▼                ▼
┌─────────────┐   ┌────────────────┐
│  Express    │   │   MCP Server   │
│  REST API   │   │  (stdio NDJSON)│
└──────┬──────┘   └───────┬────────┘
       │                  │
       ▼                  ▼
┌──────────────────────────────────┐
│          Service Layer            │
│  authService │ leetcodeService   │
│  aiService   │ (AI: Anthropic)   │
└──────┬────────────────┬──────────┘
       │                │
       ▼                ▼
┌────────────┐   ┌─────────────┐
│ PostgreSQL │   │    Redis    │
│  (pg pool) │   │   (cache)   │
└────────────┘   └─────────────┘
```

**Key Design Decisions:**
- **Repository Pattern**: All SQL is isolated in `repositories/` — services never write queries
- **Service Layer**: All business logic in `services/` — controllers stay thin
- **Singleton connections**: One DB pool and one Redis client shared across the app
- **Graceful shutdown**: SIGTERM closes in-flight requests before exiting (critical for Docker/K8s)

---

## Folder Structure

```
leetcode-ai-mcp-assistant/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL connection pool
│   │   ├── redis.js         # Redis connection
│   │   ├── logger.js        # Winston logger
│   │   └── swagger.js       # OpenAPI spec config
│   ├── controllers/         # HTTP request/response handlers (thin)
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── problemsController.js
│   │   ├── aiController.js
│   │   ├── favoritesController.js
│   │   ├── historyController.js
│   │   └── dailyController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification middleware
│   │   ├── errorHandler.js  # Global error handler
│   │   ├── rateLimiter.js   # Rate limiting rules
│   │   └── validate.js      # Input validation runner
│   ├── repositories/        # All database queries (SQL lives here)
│   │   ├── userRepository.js
│   │   ├── tokenRepository.js
│   │   ├── favoritesRepository.js
│   │   ├── searchHistoryRepository.js
│   │   └── dailyChallengeRepository.js
│   ├── routes/              # Express Router definitions
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── problemsRoutes.js
│   │   ├── aiRoutes.js
│   │   ├── favoritesRoutes.js
│   │   ├── historyRoutes.js
│   │   └── dailyRoutes.js
│   ├── services/
│   │   ├── authService.js            # JWT, bcrypt, token management
│   │   ├── ai/
│   │   │   └── aiService.js          # Anthropic Claude integration
│   │   ├── leetcode/
│   │   │   └── leetcodeService.js    # LeetCode GraphQL client
│   │   └── mcp/
│   │       └── mcpServer.js          # MCP Server + tool definitions
│   ├── utils/
│   │   ├── AppError.js      # Custom error class with status codes
│   │   └── response.js      # Consistent JSON response helpers
│   ├── validators/
│   │   ├── authValidators.js
│   │   └── profileValidators.js
│   ├── websocket/
│   │   └── wsHandler.js     # WebSocket server + user rooms
│   ├── app.js               # Express app setup (no server.listen)
│   └── server.js            # Entry point — starts HTTP + WS server
├── mcp/
│   └── index.js             # Standalone MCP server entry point
├── migrations/
│   └── run.js               # Database schema creation
├── tests/
│   ├── unit/
│   │   ├── authService.test.js
│   │   ├── aiService.test.js
│   │   └── mcpServer.test.js
│   └── integration/
│       ├── auth.test.js
│       ├── problems.test.js
│       └── ai.test.js
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI pipeline
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## Prerequisites

- **Node.js** >= 20.0.0
- **PostgreSQL** >= 14
- **Redis** >= 6
- **Anthropic API Key** — [Get one here](https://console.anthropic.com)

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/leetcode-ai-mcp-assistant.git
cd leetcode-ai-mcp-assistant

# 2. Install dependencies
npm install

# 3. Copy and configure environment variables
cp .env.example .env
# Edit .env with your actual values

# 4. Run database migrations
npm run migrate

# 5. Start the development server
npm run dev
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `leetcode_mcp` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | — |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | — (**required**) |
| `JWT_ACCESS_EXPIRES` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime | `7d` |
| `ANTHROPIC_API_KEY` | Claude API key | — (**required**) |
| `ANTHROPIC_MODEL` | Claude model to use | `claude-sonnet-4-6` |
| `CORS_ORIGIN` | Allowed CORS origin | `*` |
| `LOG_LEVEL` | Logging level | `info` |

---

## Docker Setup

```bash
# Copy .env and fill in secrets
cp .env.example .env

# Start all services (app + postgres + redis) with one command
docker compose up --build

# Run migrations inside Docker
docker compose run --rm migrate

# View logs
docker compose logs -f app

# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes all data)
docker compose down -v
```

---

## Running the Project

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start

# Run database migrations
npm run migrate

# Start MCP Server standalone (for Claude Desktop)
node mcp/index.js
```

---

## API Documentation

Interactive Swagger UI available at: **http://localhost:3000/api-docs**

### Authentication

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

### Endpoints Summary

#### Auth — `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login |
| POST | `/refresh` | ❌ | Refresh access token |
| POST | `/logout` | ❌ | Logout |
| GET | `/me` | ✅ | Get current user |

#### Problems — `/api/v1/problems`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Optional | Search problems (`?q=two+sum&difficulty=easy`) |
| GET | `/:titleSlug` | Optional | Get problem details |
| GET | `/daily` | Optional | Today's daily challenge |
| GET | `/contests` | ❌ | Upcoming contests |
| GET | `/user/:username/stats` | ❌ | User's LeetCode stats |

#### AI Tools — `/api/v1/ai`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/problems/:titleSlug/explain` | ✅ | AI problem explanation |
| POST | `/problems/:titleSlug/hints` | ✅ | Progressive hints |
| POST | `/problems/:titleSlug/explain-solution` | ✅ | Explain a solution |
| POST | `/analyze-code` | ✅ | Analyze code quality |
| POST | `/optimize-code` | ✅ | Optimization suggestions |
| POST | `/time-complexity` | ✅ | Time complexity analysis |
| POST | `/space-complexity` | ✅ | Space complexity analysis |

#### Favorites — `/api/v1/favorites`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✅ | List favorites |
| POST | `/` | ✅ | Add favorite |
| DELETE | `/:problemSlug` | ✅ | Remove favorite |

#### History — `/api/v1/history`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✅ | Search history |
| DELETE | `/` | ✅ | Clear all history |
| GET | `/recent` | ✅ | Recently viewed problems |
| DELETE | `/:id` | ✅ | Delete one history item |

#### Daily — `/api/v1/daily`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Optional | Today's challenge |
| GET | `/history` | ❌ | Challenge history |
| GET | `/explain` | ✅ | AI explanation for today's challenge |

---

## MCP Server Setup

The MCP server lets Claude Desktop and other AI tools use LeetCode directly.

### Add to Claude Desktop

Edit `~/.config/claude/claude_desktop_config.json` (Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "leetcode": {
      "command": "node",
      "args": ["/absolute/path/to/project/mcp/index.js"],
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
|------|-------------|
| `search_problems` | Search by keyword, difficulty, tags |
| `get_problem` | Full problem details by slug |
| `get_daily_problem` | Today's challenge |
| `explain_problem` | AI explanation |
| `get_hints` | Progressive hints |
| `analyze_solution` | Code analysis |
| `get_user_stats` | LeetCode user stats |

---

## WebSocket Protocol

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

## Testing

```bash
# Run all tests
npm test

# Unit tests only (fast, no network/DB)
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm test -- --coverage
```

Tests use Jest with ES module support. All external dependencies (PostgreSQL, Redis, Anthropic API, LeetCode GraphQL) are mocked so tests run instantly without infrastructure.

---

## Deployment

### Docker (recommended)

```bash
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

### Manual

```bash
NODE_ENV=production npm start
```

### Environment Checklist for Production

- [ ] `JWT_SECRET` is a long random string (at least 64 chars)
- [ ] `ANTHROPIC_API_KEY` is set
- [ ] `DB_PASSWORD` is set and strong
- [ ] `CORS_ORIGIN` is restricted to your frontend domain
- [ ] `NODE_ENV=production` is set
- [ ] HTTPS/TLS is terminated at load balancer or reverse proxy

---

## License

MIT
