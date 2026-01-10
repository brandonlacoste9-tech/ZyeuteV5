# ===== STAGE 1: Build =====
FROM node:22 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including optional ones for the build platform)
RUN npm install
# Copy source
COPY . .

# Build: Vite frontend + esbuild server bundle
RUN npm run build

# ===== STAGE 2: Production =====
FROM node:22 AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies (tsx is now in dependencies)
RUN npm install --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
# Copy source and scripts needed for startup migrations
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Ensure startup script is executable
RUN chmod +x scripts/railway-startup.sh

# Expose port (Railway sets PORT env var automatically)
EXPOSE 3000
EXPOSE 5000

# Railway will set PORT env var automatically
# Backend defaults to 5000 but will use PORT if set
ENV PORT=5000

# Run the startup script (can also be managed via railway.json startCommand)
CMD ["bash", "scripts/railway-startup.sh"]