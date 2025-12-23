# ========================================
# Zyeuté V3 Backend - Fly.io Dockerfile
# Express + TypeScript + Python Colony Bridge
# ========================================

# ---------- Stage 1: Base ----------
FROM node:20-alpine AS base

WORKDIR /app

# Install Python for Colony Bridge + bash for scripting
RUN apk add --no-cache \
    python3 \
    py3-pip \
    bash \
    && ln -sf python3 /usr/bin/python

# ---------- Stage 2: Dependencies ----------
FROM base AS deps

WORKDIR /app

# Copy root package files (monorepo)
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDeps for TypeScript build)
RUN npm ci

# ---------- Stage 3: Build ----------
FROM base AS build

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy entire monorepo for build context
COPY . .

# Build TypeScript server
# Assumes server has its own tsconfig.json
WORKDIR /app/server
RUN npx tsc

# ---------- Stage 4: Production Runtime ----------
FROM base AS runtime

WORKDIR /app/server

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production node_modules
COPY --from=deps /app/node_modules /app/node_modules

# Copy built server dist
COPY --from=build /app/server/dist ./dist

# Copy server package.json
COPY server/package.json ./

# Copy Python Colony Bridge (if exists)
COPY --from=build /app/server/ai ./ai
COPY --from=build /app/server/colony ./colony

# Copy other necessary runtime files
COPY --from=build /app/server/routes ./routes
COPY --from=build /app/server/ti-guy ./ti-guy
COPY --from=build /app/server/utils ./utils

# Change ownership to appuser
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port (Fly.io will map this internally)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server (compiled from TypeScript)
CMD ["node", "dist/index.js"]