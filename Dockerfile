FROM node:22-slim
WORKDIR /app
COPY batch-runtime/package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY scripts/generate-quebec-batch.ts ./scripts/generate-quebec-batch.ts
USER node
CMD ["node", "--import", "tsx", "scripts/generate-quebec-batch.ts", "--run"]
