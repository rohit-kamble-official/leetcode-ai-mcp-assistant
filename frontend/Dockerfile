# ============================================================
# LeetCode AI MCP Assistant — Frontend Dockerfile
# Multi-stage build:
#   Stage 1 (builder): install deps and build the Vite app
#   Stage 2 (production): serve with nginx (lightweight)
# ============================================================

# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first — Docker caches this layer.
# npm install only re-runs when package.json or lock file changes.
COPY package*.json ./

RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build the production Vite bundle
# VITE_API_URL is set at runtime via nginx proxy, so we leave it
# as the default /api/v1 which the nginx reverse proxy handles.
RUN npm run build

# ---- Stage 2: Production (nginx) ----
FROM nginx:1.27-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
