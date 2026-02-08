# ===== STAGE 1: Build =====
FROM node:22 AS builder

WORKDIR /app

# Copy package files and .npmrc
COPY package*.json .npmrc ./

# Install system dependencies
RUN apt-get update && apt-get install -y dos2unix

# Install ALL dependencies (including optional ones for the build platform)
RUN npm install
# Copy source
COPY . .

# Convert scripts to Unix line endings
RUN find . -name "*.sh" -exec dos2unix {} +

# Build: Vite frontend + esbuild server bundle
RUN npm run build

# ===== STAGE 2: Production =====
FROM node:22 AS production

WORKDIR /app

# Copy package files and .npmrc
COPY package*.json .npmrc ./

# Install ONLY production dependencies (tsx is now in dependencies)
RUN npm install --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
# Copy source and scripts needed for startup migrations
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Ensure startup script is executable
RUN chmod +x scripts/railway-startup.sh

# Expose port (Railway sets PORT env var automatically)
EXPOSE 3000
# Expose port (Railway sets PORT env var automatically)
EXPOSE 3000

# Railway will set PORT env var automatically
# Default to 3000 if not set
# ENV PORT=3000

# Run the startup script (can also be managed via railway.json startCommand)
CMD ["bash", "scripts/railway-startup.sh"]