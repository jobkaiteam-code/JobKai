# JobKai Backend Services

Microservices architecture for the JobKai application with independent Docker containers.

## Architecture

```
API Gateway (Port 8000)
     │
     ├── Footprint Service (Port 8001)
     │       └─ Analyzes GitHub & StackOverflow profiles
     │
     ├── Resume Reviewer Service (Port 8002)
     │       └─ Uses Groq API for AI-powered resume analysis
     │
     └── Job Matcher Service (Port 8003)
             └─ Uses Findwork API, The Muse API, RemoteOK API
```

## Services Overview

| Service | Port | Description | API Keys Required |
|---------|------|-------------|-------------------|
| **API Gateway** | 8000 | Central routing service | None |
| **Footprint Service** | 8001 | GitHub/StackOverflow analysis | None |
| **Resume Reviewer** | 8002 | AI-powered resume analysis | GROQ_API_KEY |
| **Job Matcher** | 8003 | ML-based job matching | FINDWORK_API_KEY |

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- API Keys:
  - **Groq API**: https://console.groq.com/
  - **Findwork API**: https://findwork.dev/developers/

### Setup & Launch

**1. Setup API Keys**
```bash
cd backend

# Resume Reviewer
echo "GROQ_API_KEY=your_key_here" > Resume_Reviewer_and_Rewriter/.env

# Job Matcher
echo "FINDWORK_API_KEY=your_key_here" > Job_matcher_from_linkedin-main/.env
```

**2. Launch Services** (recommended: in separate terminals)
```bash
# Terminal 1 - Footprint
cd footprint && docker compose up -d

# Terminal 2 - Resume Reviewer
cd Resume_Reviewer_and_Rewriter && docker compose up -d

# Terminal 3 - Job Matcher
cd Job_matcher_from_linkedin-main && docker compose up -d

# Terminal 4 - API Gateway
cd api-gateway && docker compose up -d
```

**3. Verify**
```bash
curl http://localhost:8000/health
curl http://localhost:8000/services/health
```

### Quick Scripts

```bash
# Make executable
chmod +x launch-all.sh stop-all.sh check-status.sh

# Launch all
./launch-all.sh

# Check status
./check-status.sh

# Stop all
./stop-all.sh
```

## API Endpoints

Access via API Gateway at **http://localhost:8000**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Gateway health check |
| `/services/health` | GET | All services status |
| `/api/v1/footprint/analyze` | POST | Analyze developer footprint |
| `/api/v1/resume/analyze` | POST | Analyze resume (PDF) |
| `/api/v1/resume/improve` | POST | Improve resume with AI |
| `/api/v1/jobs/match` | POST | Match jobs with CV |

**Interactive Docs**: http://localhost:8000/docs

## Testing Examples

**Footprint Analysis**
```bash
curl -X POST http://localhost:8000/api/v1/footprint/analyze \
  -H "Content-Type: application/json" \
  -d '{"github_username": "torvalds"}'
```

**Resume Analysis** (requires PDF file)
```bash
curl -X POST http://localhost:8000/api/v1/resume/analyze \
  -F "file=@resume.pdf"
```

**Job Matching** (requires CV PDF)
```bash
curl -X POST http://localhost:8000/api/v1/jobs/match \
  -F "cv_file=@cv.pdf" \
  -F "job_title=Software Engineer" \
  -F "location=Remote" \
  -F "top_n=10"
```

## Service Details

Each service has its own README in its directory:
- `api-gateway/README.md` - API Gateway documentation
- `footprint/README.md` - Footprint service details
- `Resume_Reviewer_and_Rewriter/README.md` - Resume service details
- `Job_matcher_from_linkedin-main/README.md` - Job matcher details

## Troubleshooting

**View logs:**
```bash
docker logs -f jobkai-api-gateway
docker logs -f jobkai-footprint-service
docker logs -f jobkai-resume-reviewer-service
docker logs -f jobkai-job-matcher-service
```

**Restart a service:**
```bash
docker restart jobkai-<service-name>
```

**Rebuild a service:**
```bash
cd <service-directory>
docker compose down
docker compose up -d --build
```

**Stop all services:**
```bash
./stop-all.sh
# or manually
docker stop jobkai-api-gateway jobkai-footprint-service \
  jobkai-resume-reviewer-service jobkai-job-matcher-service
```

## Project Structure

```
backend/
├── api-gateway/           # Port 8000 - Main entry point
├── footprint/            # Port 8001 - GitHub/SO analysis
├── Resume_Reviewer_and_Rewriter/  # Port 8002 - Resume AI
├── Job_matcher_from_linkedin-main/ # Port 8003 - Job matching
├── launch-all.sh         # Launch all services
├── stop-all.sh          # Stop all services
├── check-status.sh      # Check service health
└── docker-compose.yml   # Unified orchestration (optional)
```

## Production Considerations

- Set proper CORS origins in each service
- Add authentication/authorization at API Gateway
- Use secrets management for API keys
- Add monitoring (Prometheus, Grafana)
- Set up logging aggregation
- Configure reverse proxy (Nginx, Traefik)
- Enable HTTPS with SSL certificates
