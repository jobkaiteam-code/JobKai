# API Gateway Service

Central routing and authentication gateway for all JobKai microservices.

## Overview

The API Gateway serves as the single entry point for all client requests, providing:
- Unified API routing to microservices
- Firebase authentication middleware
- Rate limiting (1000 requests/hour per IP)
- CORS configuration
- Request/response logging
- Health monitoring for all services

## Port

**8000**

## Features

- **Service Routing**: Proxies requests to appropriate microservices
- **Authentication**: Firebase JWT token validation
- **Rate Limiting**: DDoS protection with configurable limits
- **Load Balancing**: Distributes requests across service instances
- **Health Checks**: Monitors all downstream services
- **API Documentation**: Auto-generated Swagger/ReDoc docs

## Microservices Routes

| Route | Service | Port |
|-------|---------|------|
| `/api/v1/footprint/*` | Footprint Service | 8001 |
| `/api/v1/resume/*` | Resume Reviewer | 8002 |
| `/api/v1/jobs/*` | Job Matcher | 8003 |
| `/api/v1/interview/*` | AI Interviewer | 8004 |

## Environment Variables

The gateway automatically connects to services via Docker network:

```bash
FOOTPRINT_URL=http://footprint-service:8001
RESUME_REVIEWER_URL=http://resume-reviewer-service:8002
JOB_MATCHER_URL=http://job-matcher-service:8003
AI_INTERVIEWER_URL=http://ai-interviewer-service:8004
```

## Quick Start

### With Docker Compose (Recommended)

```bash
# From backend/ directory
docker compose up -d
```

### Standalone (Development)

```bash
cd api-gateway

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export FOOTPRINT_URL=http://localhost:8001
export RESUME_REVIEWER_URL=http://localhost:8002
export JOB_MATCHER_URL=http://localhost:8003
export AI_INTERVIEWER_URL=http://localhost:8004

# Run server
uvicorn main:app --reload --port 8000
```

## API Endpoints

### Health & Status

```bash
# Gateway health
GET /health

# All services health
GET /services/health
```

### Authentication

All protected routes require Firebase JWT token in header:
```
Authorization: Bearer <firebase-jwt-token>
```

Public endpoints (no auth required):
- `/health`
- `/services/health`
- `/docs`
- `/redoc`

### Service Endpoints

See individual service READMEs for detailed endpoint documentation:
- [Footprint Service](../footprint/README.md)
- [Resume Reviewer](../Resume_Reviewer_and_Rewriter/README.md)
- [Job Matcher](../Job_matcher_from_linkedin-main/README.md)
- [AI Interviewer](../ai-interviewer/README.md)

## Testing

```bash
# Health check
curl http://localhost:8000/health

# Check all services
curl http://localhost:8000/services/health

# Test with authentication
curl -X POST http://localhost:8000/api/v1/footprint/analyze \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"github_username": "torvalds"}'
```

## API Documentation

Once running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Download the service account JSON file
3. Place it as `job-kai-firebase-adminsdk-fbsvc-9244ba7dc4.json` in this directory
4. The middleware will automatically load and validate tokens

## Rate Limiting

Default limits (configurable in `main.py`):
- 1000 requests per hour per IP address
- Applies to all endpoints

## Technology Stack

- **FastAPI**: Web framework
- **httpx**: Async HTTP client for service communication
- **Firebase Admin SDK**: Authentication
- **SlowAPI**: Rate limiting
- **Uvicorn**: ASGI server

## How to Run

The API Gateway is designed to run with all services via Docker Compose. See the [backend README](../README.md) for complete setup instructions.
