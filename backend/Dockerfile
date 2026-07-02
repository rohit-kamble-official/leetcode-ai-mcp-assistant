# ============================================================
# LeetCode AI MCP Assistant — Dockerfile
# ============================================================
# Multi-stage build:
#   Stage 1 (builder): install ALL dependencies (including devDeps)
#   Stage 2 (production): copy only what's needed for runtime
#
# WHY multi-stage? The final image is smaller because node_modules
# for devDependencies (jest, nodemon) is excluded — typically
# saves 50-200MB.
# ============================================================

# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Copy package files first — Docker caches this layer separately.
# If package.json hasn't changed, npm install won't re-run on rebuild.
COPY package*.json ./

# Install ALL dependencies (including devDeps needed for build/test)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

# Security: run as non-root user
# This limits damage if the app is ever compromised
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

WORKDIR /app

# Copy only production node_modules from builder stage
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:nodejs . .

# Switch to non-root user
USER appuser

# Expose HTTP and WebSocket port (same port)
EXPOSE 3000

# Health check: Docker will mark container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "src/server.js"]
