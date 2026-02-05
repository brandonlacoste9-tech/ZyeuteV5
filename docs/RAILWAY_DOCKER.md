# Railway + Docker (Zyeute Backend)

Railway is configured to build and run the Zyeute backend using the project’s **Dockerfile**.

## Current setup

- **Config:** `railway.json` at repo root  
- **Builder:** `DOCKERFILE`  
- **Dockerfile path:** `backend/Dockerfile`  
- **Service root:** Must be the **repo root** (so the Docker build context includes the full monorepo).

On each deploy, Railway builds the image from `backend/Dockerfile` and runs it. Health checks use `/api/health`.

## Optional: Use pre-built image from Docker Hub

If you prefer to **skip the build on Railway** and run the image from Docker Hub:

1. In [Railway Dashboard](https://railway.app) → your backend service → **Settings**.
2. Under **Source**, switch to **Deploy from Docker Image** (or **Image**).
3. Set the image to: `brandontech/zyeute-backend:latest`
4. If the image is **private**, add Docker Hub credentials in Railway (Settings → Variables or **Registry**):  
   - Registry: Docker Hub  
   - Username: `brandontech`  
   - Password: your Docker Hub PAT (same as `DOCKERHUB_TOKEN` in GitHub Actions).

Images are published by the **Docker Build & Push** workflow when you push to `main` (see [CI_CD_QUICK_START.md](../.github/CI_CD_QUICK_START.md) – Docker Hub section).

## Variables

Set the same environment variables as before (e.g. `DATABASE_URL`, `PORT` is set by Railway). The container listens on `process.env.PORT` and serves `/api/health`.
