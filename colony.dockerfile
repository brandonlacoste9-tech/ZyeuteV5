# ---------------------------------------------------
# 🐝 COLONY OS WORKER CONTAINER
# Includes: Node.js, FFmpeg, Python (for AI scripts)
# ---------------------------------------------------
FROM node:20-bullseye-slim

# 1. Install System Dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    build-essential \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 2. Setup Directory
WORKDIR /app

# 3. Install Dependencies
COPY package*.json ./
RUN npm ci --only=production

# 4. Copy Source Code
COPY tsconfig.json ./
COPY server ./server
COPY shared ./shared

# 5. Build TypeScript
RUN npm install -g typescript
RUN npx tsc

# 6. Command
# Launch the video processor worker
CMD ["node", "dist/server/workers/videoProcessor.js"]