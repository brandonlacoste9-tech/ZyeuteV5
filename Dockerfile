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

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Run the bundled server (Node.js, not tsx)
CMD ["node", "dist/index.cjs"]