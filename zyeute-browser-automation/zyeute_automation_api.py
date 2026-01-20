"""
🐝 Zyeuté Browser Automation API
FastAPI wrapper for browser automation service
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import os
from datetime import datetime

from zyeute_automation_service import browser_service

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Zyeuté Browser Intelligence API",
    description="Quebec-focused content discovery and competitive intelligence",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://zyeute.com",
        "https://app.zyeute.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class TrendRequest(BaseModel):
    platform: str = Field(
        default="google",
        description="Platform to search: google, tiktok, instagram, youtube"
    )
    region: str = Field(
        default="all",
        description="Quebec region: montreal, quebec-city, all"
    )

class CompetitorRequest(BaseModel):
    url: str = Field(..., description="Competitor URL to analyze")
    metrics: Optional[List[str]] = Field(
        default=None,
        description="Metrics to extract: followers, engagement, language, cultural_score"
    )

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str

class TrendResponse(BaseModel):
    success: bool
    platform: str
    region: str
    trends: List[Dict[str, Any]]
    timestamp: Optional[str] = None

class CompetitorResponse(BaseModel):
    success: bool
    url: str
    analysis: Dict[str, Any]
    timestamp: Optional[str] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "fully_armed_and_operational",
        "service": "zyeute-browser-intelligence",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.post("/api/v1/research/trends", response_model=TrendResponse)
async def discover_trends(request: TrendRequest):
    """Discover trending Quebec content"""
    try:
        result = await browser_service.discover_quebec_trends(
            platform=request.platform,
            region=request.region
        )
        if not result.get('success'):
            raise HTTPException(
                status_code=500,
                detail=result.get('error', 'Unknown error during trend discovery')
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend discovery failed: {str(e)}")

@app.post("/api/v1/research/competitor", response_model=CompetitorResponse)
async def analyze_competitor(request: CompetitorRequest):
    """Analyze competitor with Quebec cultural context"""
    try:
        result = await browser_service.analyze_competitor(
            url=request.url,
            metrics=request.metrics
        )
        if not result.get('success'):
            raise HTTPException(
                status_code=500,
                detail=result.get('error', 'Unknown error during competitor analysis')
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Competitor analysis failed: {str(e)}")

# ============================================================================
# BACKGROUND JOBS (Optional - for async processing)
# ============================================================================

jobs_storage: Dict[str, Dict[str, Any]] = {}

class JobRequest(BaseModel):
    platform: str = "google"
    region: str = "all"

class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

@app.post("/api/v1/jobs/trends", response_model=JobResponse)
async def create_trend_job(request: JobRequest, background_tasks: BackgroundTasks):
    """Create background job for trend discovery (for long‑running searches)"""
    import uuid
    job_id = str(uuid.uuid4())
    jobs_storage[job_id] = {
        "status": "pending",
        "type": "trends",
        "request": request.dict(),
        "created_at": datetime.utcnow().isoformat()
    }
    async def run_job():
        jobs_storage[job_id]["status"] = "running"
        result = await browser_service.discover_quebec_trends(
            platform=request.platform,
            region=request.region
        )
        jobs_storage[job_id]["status"] = "completed"
        jobs_storage[job_id]["result"] = result
        jobs_storage[job_id]["completed_at"] = datetime.utcnow().isoformat()
    background_tasks.add_task(run_job)
    return {"job_id": job_id, "status": "pending", "message": f"Trend discovery job started for {request.platform}"}

@app.get("/api/v1/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get status of a background job"""
    if job_id not in jobs_storage:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs_storage[job_id]

# ============================================================================
# STARTUP
# ============================================================================

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("🐝 Zyeuté Browser Intelligence API")
    print("="*60)
    print("✅ Service: Running")
    print("✅ Health: /health")
    print("✅ Trends: POST /api/v1/research/trends")
    print("✅ Competitor: POST /api/v1/research/competitor")
    print("✅ Jobs: POST /api/v1/jobs/trends")
    print("="*60 + "\n")

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        log_level="info"
    )
