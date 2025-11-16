from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pdfplumber
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from Jobscraping import Jobscraping
from FindworkAPI import FindworkAPI
from TheMuseAPI import TheMuseAPI
from RemoteOKAPI import RemoteOKAPI
import io
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Job Matcher API",
    description="API for matching job postings with candidate CVs using AI - Combines The Muse, RemoteOK, Findwork and LinkedIn scraping",
    version="3.0.0"
)

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

# Initialize the sentence transformer model at startup
model = None
linkedin_scraper = Jobscraping()
findwork_api = FindworkAPI()
themuse_api = TheMuseAPI()
remoteok_api = RemoteOKAPI()

@app.on_event("startup")
async def startup_event():
    global model
    logger.info("Loading sentence transformer model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Model loaded successfully!")

# Pydantic models for request/response
class JobSearchRequest(BaseModel):
    job_title: str
    location: str

class JobMatch(BaseModel):
    job_title: Optional[str]
    company_name: Optional[str]
    job_description: Optional[str]
    time_posted: Optional[str]
    num_applicants: Optional[str]
    location: Optional[str] = None
    remote: Optional[bool] = None
    employment_type: Optional[str] = None
    url: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    keywords: Optional[List[str]] = None
    source: str  # 'themuse', 'remoteok', 'findwork', or 'linkedin'
    match_score: float

class JobMatchResponse(BaseModel):
    matches: List[JobMatch]
    total_jobs: int
    themuse_jobs_count: int
    remoteok_jobs_count: int
    findwork_jobs_count: int
    linkedin_jobs_count: int
    cv_summary: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    model_loaded: bool

# Helper function to extract text from PDF
def extract_cv_text(pdf_file: bytes) -> str:
    """Extract text from uploaded PDF CV"""
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_file)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting PDF text: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": model is not None
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": model is not None
    }

@app.post("/api/v1/match-jobs", response_model=JobMatchResponse)
async def match_jobs(
    cv_file: UploadFile = File(..., description="PDF file of the candidate's CV"),
    job_title: str = Form("", description="Job title to search for (optional)"),
    location: str = Form("", description="Location for job search (optional)"),
    top_n: int = Form(10, description="Number of top matches to return"),
    use_themuse: bool = Form(True, description="Include jobs from The Muse API"),
    use_remoteok: bool = Form(True, description="Include jobs from RemoteOK API"),
    use_findwork: bool = Form(True, description="Include jobs from Findwork API"),
    use_linkedin: bool = Form(True, description="Include jobs from LinkedIn scraping"),
    remote: bool = Form(None, description="Filter for remote jobs (Findwork only)")
):
    """
    Match jobs with a candidate's CV from The Muse, RemoteOK, Findwork API and LinkedIn scraping.
    
    - **cv_file**: Upload a PDF file containing the candidate's CV
    - **job_title**: Job title/keywords to search for
    - **location**: Geographic location for job search
    - **top_n**: Number of top matching jobs to return (default: 10)
    - **use_themuse**: Include jobs from The Muse API (default: True)
    - **use_remoteok**: Include jobs from RemoteOK API (default: True)
    - **use_findwork**: Include jobs from Findwork API (default: True)
    - **use_linkedin**: Include jobs from LinkedIn scraping (default: True)
    - **remote**: Filter for remote jobs in Findwork API
    """
    
    if not cv_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Extract CV text
        logger.info("Extracting CV text...")
        cv_content = await cv_file.read()
        candidate_cv = extract_cv_text(cv_content)
        
        if not candidate_cv:
            raise HTTPException(status_code=400, detail="Could not extract text from CV")
        
        cv_summary = candidate_cv[:200] + "..." if len(candidate_cv) > 200 else candidate_cv
        
        all_jobs = []
        themuse_count = 0
        remoteok_count = 0
        findwork_count = 0
        linkedin_count = 0
        
        # Fetch jobs from The Muse API (try this first)
        if use_themuse:
            logger.info(f"Fetching jobs from The Muse API for: {job_title}, location: {location}")
            try:
                themuse_jobs = themuse_api.fetch_jobs(
                    keywords=job_title,
                    location=location
                )
                themuse_count = len(themuse_jobs)
                all_jobs.extend(themuse_jobs)
                logger.info(f"Fetched {themuse_count} jobs from The Muse")
            except Exception as e:
                logger.warning(f"The Muse API unavailable: {str(e)}")
        
        # Fetch jobs from RemoteOK API
        if use_remoteok:
            logger.info(f"Fetching jobs from RemoteOK API for: {job_title}")
            try:
                remoteok_jobs = remoteok_api.fetch_jobs(
                    keywords=job_title
                )
                remoteok_count = len(remoteok_jobs)
                all_jobs.extend(remoteok_jobs)
                logger.info(f"Fetched {remoteok_count} jobs from RemoteOK")
            except Exception as e:
                logger.warning(f"RemoteOK API unavailable: {str(e)}")
        
        # Fetch jobs from Findwork API
        if use_findwork:
            logger.info(f"Fetching jobs from Findwork API for: {job_title}, location: {location}")
            try:
                findwork_jobs = findwork_api.fetch_jobs(
                    search=job_title,
                    location=location,
                    remote=remote,
                    sort_by='relevance'
                )
                findwork_count = len(findwork_jobs)
                all_jobs.extend(findwork_jobs)
                logger.info(f"Fetched {findwork_count} jobs from Findwork API")
            except Exception as e:
                logger.warning(f"Findwork API unavailable: {str(e)}")
        
        # Fetch jobs from LinkedIn scraping
        if use_linkedin:
            logger.info(f"Scraping jobs from LinkedIn for: {job_title}, location: {location}")
            try:
                linkedin_jobs = linkedin_scraper.scrape_jobs(job_title, location)
                # Add source field to LinkedIn jobs
                for job in linkedin_jobs:
                    job['source'] = 'linkedin'
                linkedin_count = len(linkedin_jobs)
                all_jobs.extend(linkedin_jobs)
                logger.info(f"Scraped {linkedin_count} jobs from LinkedIn")
            except Exception as e:
                logger.error(f"Error scraping from LinkedIn: {str(e)}")
        
        if not all_jobs:
            return {
                "matches": [],
                "total_jobs": 0,
                "themuse_jobs_count": 0,
                "remoteok_jobs_count": 0,
                "findwork_jobs_count": 0,
                "linkedin_jobs_count": 0,
                "cv_summary": cv_summary
            }
        
        # Filter out jobs with no description
        valid_jobs = [job for job in all_jobs if job.get("job_description")]
        
        if not valid_jobs:
            return {
                "matches": [],
                "total_jobs": len(all_jobs),
                "findwork_jobs_count": findwork_count,
                "themuse_jobs_count": themuse_count,
                "remoteok_jobs_count": remoteok_count,
                "findwork_jobs_count": findwork_count,
                "linkedin_jobs_count": linkedin_count,
                "cv_summary": cv_summary
            }
        
        # Compute embeddings
        logger.info("Computing embeddings and matching jobs...")
        cv_embedding = model.encode([candidate_cv])
        job_descriptions = [job["job_description"] for job in valid_jobs]
        job_embeddings = model.encode(job_descriptions)
        
        # Calculate similarity scores
        similarities = cosine_similarity(cv_embedding, job_embeddings)[0]
        
        # Add scores to jobs
        for i, job in enumerate(valid_jobs):
            job["match_score"] = float(similarities[i])
        
        # Sort by score and get top N
        sorted_jobs = sorted(valid_jobs, key=lambda x: x["match_score"], reverse=True)[:top_n]
        
        # Format response
        matches = [
            JobMatch(
                job_title=job.get("job_title"),
                company_name=job.get("company_name"),
                job_description=job.get("job_description"),
                time_posted=job.get("time_posted"),
                num_applicants=job.get("num_applicants"),
                location=job.get("location"),
                remote=job.get("remote"),
                employment_type=job.get("employment_type"),
                url=job.get("url"),
                salary_min=job.get("salary_min"),
                salary_max=job.get("salary_max"),
                keywords=job.get("keywords"),
                source=job.get("source", "linkedin"),
                match_score=job["match_score"]
            )
            for job in sorted_jobs
        ]
        
        logger.info(f"Successfully matched {len(matches)} jobs ({themuse_count} from Muse, {remoteok_count} from RemoteOK, {findwork_count} from Findwork, {linkedin_count} from LinkedIn)")
        
        return {
            "matches": matches,
            "total_jobs": len(valid_jobs),
            "themuse_jobs_count": themuse_count,
            "remoteok_jobs_count": remoteok_count,
            "findwork_jobs_count": findwork_count,
            "linkedin_jobs_count": linkedin_count,
            "cv_summary": cv_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in match_jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/v1/scrape-jobs")
async def scrape_jobs(request: JobSearchRequest):
    """
    Scrape jobs from The Muse, RemoteOK, Findwork API and LinkedIn without CV matching.
    
    - **job_title**: Job title/keywords to search for
    - **location**: Geographic location for job search
    """
    try:
        all_jobs = []
        themuse_error = None
        remoteok_error = None
        findwork_error = None
        linkedin_error = None
        
        # Fetch from The Muse API
        logger.info(f"Fetching jobs from The Muse API for: {request.job_title}, location: {request.location}")
        try:
            themuse_jobs = themuse_api.fetch_jobs(
                keywords=request.job_title,
                location=request.location
            )
            all_jobs.extend(themuse_jobs)
            logger.info(f"Successfully fetched {len(themuse_jobs)} jobs from The Muse")
        except Exception as e:
            themuse_error = str(e)
            logger.warning(f"The Muse API unavailable: {str(e)}")
        
        # Fetch from RemoteOK API
        logger.info(f"Fetching jobs from RemoteOK API for: {request.job_title}")
        try:
            remoteok_jobs = remoteok_api.fetch_jobs(
                keywords=request.job_title
            )
            all_jobs.extend(remoteok_jobs)
            logger.info(f"Successfully fetched {len(remoteok_jobs)} jobs from RemoteOK")
        except Exception as e:
            remoteok_error = str(e)
            logger.warning(f"RemoteOK API unavailable: {str(e)}")
        
        # Fetch from Findwork API
        logger.info(f"Fetching jobs from Findwork API for: {request.job_title}, location: {request.location}")
        try:
            findwork_jobs = findwork_api.fetch_jobs(
                search=request.job_title,
                location=request.location,
                sort_by='relevance'
            )
            all_jobs.extend(findwork_jobs)
            logger.info(f"Successfully fetched {len(findwork_jobs)} jobs from Findwork API")
        except Exception as e:
            findwork_error = str(e)
            logger.warning(f"Findwork API unavailable: {str(e)}")
        
        # Scrape from LinkedIn
        logger.info(f"Scraping jobs from LinkedIn for: {request.job_title}, location: {request.location}")
        try:
            linkedin_jobs = linkedin_scraper.scrape_jobs(request.job_title, request.location)
            # Add source field
            for job in linkedin_jobs:
                job['source'] = 'linkedin'
            all_jobs.extend(linkedin_jobs)
            logger.info(f"Successfully scraped {len(linkedin_jobs)} jobs from LinkedIn")
        except Exception as e:
            linkedin_error = str(e)
            logger.warning(f"LinkedIn scraping failed: {str(e)}")
        
        themuse_count = sum(1 for job in all_jobs if job.get('source') == 'themuse')
        remoteok_count = sum(1 for job in all_jobs if job.get('source') == 'remoteok')
        findwork_count = sum(1 for job in all_jobs if job.get('source') == 'findwork')
        linkedin_count = sum(1 for job in all_jobs if job.get('source') == 'linkedin')
        
        # Prepare status message
        status_messages = []
        
        if themuse_error:
            status_messages.append(f"The Muse: Unavailable")
        else:
            status_messages.append(f"The Muse: OK ({themuse_count} jobs)")
        
        if remoteok_error:
            status_messages.append(f"RemoteOK: Unavailable")
        else:
            status_messages.append(f"RemoteOK: OK ({remoteok_count} jobs)")
        
        if findwork_error:
            status_messages.append(f"Findwork: Unavailable")
        else:
            status_messages.append(f"Findwork: OK ({findwork_count} jobs)")
            
        if linkedin_error:
            status_messages.append(f"LinkedIn: Failed")
        else:
            status_messages.append(f"LinkedIn: OK ({linkedin_count} jobs)")
        
        return {
            "jobs": all_jobs,
            "total": len(all_jobs),
            "themuse_count": themuse_count,
            "remoteok_count": remoteok_count,
            "findwork_count": findwork_count,
            "linkedin_count": linkedin_count,
            "status": " | ".join(status_messages),
            "themuse_available": themuse_error is None,
            "remoteok_available": remoteok_error is None,
            "findwork_available": findwork_error is None,
            "linkedin_available": linkedin_error is None,
            "query": {
                "job_title": request.job_title,
                "location": request.location
            }
        }
    except Exception as e:
        logger.error(f"Error in scrape_jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error scraping jobs: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
