# Multi-stage Dockerfile for Vite + Express app
FROM node:20-alpine AS base

# Install dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm install --omit=optional

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create user for running the app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 express

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set ownership
RUN chown -R express:nodejs /app

USER express

EXPOSE 5000

CMD ["node", "dist/index.cjs"]