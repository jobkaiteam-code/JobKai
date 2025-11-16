from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import httpx
import os
import logging
from typing import Optional, Dict
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Import Firebase authentication middleware
from middleware.auth import (
    require_auth,
    get_current_user,
    AuthMiddleware,
    get_user_from_request,
    is_authenticated
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize rate limiter - Very permissive for development
limiter = Limiter(key_func=get_remote_address, default_limits=["1000/hour"])


app = FastAPI(
    title="JobKai API Gateway",
    description="Central API Gateway for Resume Reviewer, Job Matcher, and Footprint services",
    version="1.0.0"
)

# Add rate limiter state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add Firebase authentication middleware (before rate limiting)
app.add_middleware(AuthMiddleware)

# Add rate limiting middleware
app.add_middleware(SlowAPIMiddleware)

# Add CORS middleware - Very permissive for public access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Service URLs - Connect to services running on host or in Kubernetes
SERVICES = {
    "footprint": os.getenv("FOOTPRINT_SERVICE_URL", os.getenv("FOOTPRINT_URL", "http://host.docker.internal:8001")),
    "resume_reviewer": os.getenv("RESUME_REVIEWER_SERVICE_URL", os.getenv("RESUME_REVIEWER_URL", "http://host.docker.internal:8002")),
    "job_matcher": os.getenv("JOB_MATCHER_SERVICE_URL", os.getenv("JOB_MATCHER_URL", "http://host.docker.internal:8003")),
    "ai_interviewer": os.getenv("AI_INTERVIEWER_SERVICE_URL", os.getenv("AI_INTERVIEWER_URL", "http://host.docker.internal:8004"))
}

@app.get("/")
async def root(request: Request):
    """API Gateway root endpoint"""
    user = get_user_from_request(request)
    
    response = {
        "service": "JobKai API Gateway",
        "version": "1.0.0",
        "status": "operational",
        "authenticated": is_authenticated(request),
        "services": {
            "footprint": SERVICES["footprint"],
            "resume_reviewer": SERVICES["resume_reviewer"],
            "job_matcher": SERVICES["job_matcher"],
            "ai_interviewer": SERVICES["ai_interviewer"]
        }
    }
    
    # Add user info if authenticated
    if user:
        response["user"] = {
            "uid": user.get("uid"),
            "email": user.get("email"),
            "name": user.get("name"),
            "role": user.get("role", "free")
        }
    
    return response

@app.get("/health")
async def health():
    """Health check for API Gateway"""
    return {"status": "API Gateway OK"}

@app.get("/services/health")
async def check_all_services():
    """Check health of all backend services"""
    results = {}
    async with httpx.AsyncClient(timeout=10.0) as client:
        for service_name, service_url in SERVICES.items():
            try:
                resp = await client.get(f"{service_url}/health")
                results[service_name] = {
                    "status": "healthy" if resp.status_code == 200 else "unhealthy",
                    "response": resp.json()
                }
            except Exception as e:
                results[service_name] = {
                    "status": "unreachable",
                    "error": str(e)
                }
    return results

# ============================================
# FOOTPRINT SERVICE ENDPOINTS
# ============================================

class FootprintRequest(BaseModel):
    github_username: Optional[str] = None
    stackoverflow_id: Optional[str] = None

@app.post("/api/v1/footprint/analyze")
@limiter.limit("10/hour")  # 10 footprint analyses per hour
async def analyze_footprint(
    request: Request, 
    footprint_data: FootprintRequest,
    user: Dict = Depends(require_auth)  # Require authentication
):
    """Analyze developer footprint via Footprint Service (Protected)"""
    logger.info(f"User {user.get('email')} analyzing footprint for {footprint_data.github_username}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                f"{SERVICES['footprint']}/analyze",
                json={
                    "github_username": footprint_data.github_username,
                    "stackoverflow_id": footprint_data.stackoverflow_id
                }
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Footprint service error: {str(e)}")

# ============================================
# RESUME REVIEWER SERVICE ENDPOINTS
# ============================================

@app.post("/api/v1/resume/analyze")
@limiter.limit("20/hour")  # 20 resume analyses per hour
async def analyze_resume(
    request: Request, 
    file: UploadFile = File(...),
    user: Dict = Depends(require_auth)  # Require authentication
):
    """Analyze resume via Resume Reviewer Service (uses Groq API) - Protected"""
    logger.info(f"User {user.get('email')} analyzing resume: {file.filename}")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            files = {"file": (file.filename, await file.read(), file.content_type)}
            resp = await client.post(
                f"{SERVICES['resume_reviewer']}/api/v1/analyze",
                files=files
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Resume Reviewer service error: {str(e)}")

@app.post("/api/v1/resume/improve")
@limiter.limit("10/hour")  # 10 resume improvements per hour (more intensive)
async def improve_resume(
    request: Request, 
    file: UploadFile = File(...), 
    job_description: str = Form(None),
    user: Dict = Depends(require_auth)  # Require authentication
):
    """Improve resume via Resume Reviewer Service (uses Groq API) - Protected"""
    logger.info(f"User {user.get('email')} improving resume: {file.filename}")
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            files = {"file": (file.filename, await file.read(), file.content_type)}
            data = {"job_description": job_description} if job_description else {}
            resp = await client.post(
                f"{SERVICES['resume_reviewer']}/api/v1/improve",
                files=files,
                data=data
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Resume Reviewer service error: {str(e)}")

# ============================================
# JOB MATCHER SERVICE ENDPOINTS
# ============================================

@app.post("/api/v1/jobs/match")
@limiter.limit("15/hour")  # 15 job matches per hour
async def match_jobs(
    request: Request,
    cv_file: UploadFile = File(...),
    job_title: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    top_n: int = Form(10),
    use_themuse: bool = Form(True),
    use_remoteok: bool = Form(True),
    use_findwork: bool = Form(True),
    use_linkedin: bool = Form(True),
    remote: Optional[bool] = Form(None),
    user: Dict = Depends(require_auth)  # Require authentication
):
    """Match jobs with candidate CV via Job Matcher Service (uses Findwork API) - Protected"""
    logger.info(f"User {user.get('email')} matching jobs for: {cv_file.filename}")
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            files = {"cv_file": (cv_file.filename, await cv_file.read(), cv_file.content_type)}
            data = {
                "job_title": job_title or "",  # Required by job matcher service
                "location": location or "",     # Required by job matcher service
                "top_n": top_n,
                "use_themuse": use_themuse,
                "use_remoteok": use_remoteok,
                "use_findwork": use_findwork,
                "use_linkedin": use_linkedin
            }
            # Only include remote field if provided
            if remote is not None:
                data["remote"] = remote
            
            logger.info(f"Sending to job matcher - File: {cv_file.filename}, Data: {data}")
            
            resp = await client.post(
                f"{SERVICES['job_matcher']}/api/v1/match-jobs",
                files=files,
                data=data
            )
            
            logger.info(f"Job matcher response status: {resp.status_code}")
            if resp.status_code != 200:
                logger.error(f"Job matcher error response: {resp.text}")
            
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Job Matcher service error: {str(e)}")

# ============================================
# FILE DOWNLOAD PROXY
# ============================================

@app.get("/api/v1/resume/download/{timestamp}/{file_type}")
async def download_resume_file(timestamp: str, file_type: str):
    """Proxy download requests to Resume service"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(
                f"{SERVICES['resume_reviewer']}/api/v1/download/{timestamp}/{file_type}",
                follow_redirects=True
            )
            resp.raise_for_status()
            
            # Stream the file response
            return StreamingResponse(
                iter([resp.content]),
                media_type=resp.headers.get('content-type', 'application/octet-stream'),
                headers={
                    'Content-Disposition': resp.headers.get('content-disposition', f'attachment; filename="{file_type}"')
                }
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")

# ============================================
# AI INTERVIEWER SERVICE ROUTES
# ============================================

@app.post("/api/v1/interview/generate")
@limiter.limit("500/hour")  # Very high for development - adjust for production
async def generate_interview(request: Request, body: Dict):
    """Generate AI interview questions - Protected route"""
    # Authentication is handled by middleware
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(
                f"{SERVICES['ai_interviewer']}/generate",
                json=body
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"AI Interviewer service error: {str(e)}")

@app.get("/api/v1/interview/users/{userid}/interviews/{interviewId}")
async def get_interview(request: Request, userid: str, interviewId: str):
    """Get interview details - Protected route"""
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(
                f"{SERVICES['ai_interviewer']}/users/{userid}/interviews/{interviewId}"
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"AI Interviewer service error: {str(e)}")

@app.post("/api/v1/interview/feedback/create")
@limiter.limit("300/hour")  # Very high for development - adjust for production
async def create_feedback(request: Request, body: Dict):
    """Generate interview feedback - Protected route"""
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    async with httpx.AsyncClient(timeout=120.0) as client:  # Longer timeout for AI processing
        try:
            resp = await client.post(
                f"{SERVICES['ai_interviewer']}/feedback/create",
                json=body
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"AI Interviewer service error: {str(e)}")

@app.get("/api/v1/interview/users/{userid}/interviews/{interviewId}/feedback")
async def get_feedback(request: Request, userid: str, interviewId: str):
    """Get interview feedback - Protected route"""
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(
                f"{SERVICES['ai_interviewer']}/users/{userid}/interviews/{interviewId}/feedback"
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"AI Interviewer service error: {str(e)}")

@app.get("/api/v1/interview/users/{userid}/interviews")
async def list_interviews(request: Request, userid: str):
    """List all user interviews - Protected route"""
    if not is_authenticated(request):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(
                f"{SERVICES['ai_interviewer']}/users/{userid}/interviews"
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"AI Interviewer service error: {str(e)}")
