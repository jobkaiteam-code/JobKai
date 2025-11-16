#!/bin/bash


This guide explains how to run the entire JobKai stack (backend microservices + frontend) using Docker.# JobKai Full Stack Quick Start Script

set -e

## Prerequisites

# Colors

- Docker 20.10+RED='\033[0;31m'

- Docker Compose v2+GREEN='\033[0;32m'

- Your API keys (Groq, Findwork, Google)YELLOW='\033[1;33m'

- Firebase project configurationBLUE='\033[0;34m'

NC='\033[0m'

## Quick Start

echo -e "${BLUE}========================================${NC}"

### 1. Prepare Environment Filesecho -e "${BLUE}   JobKai Full Stack Setup${NC}"

echo -e "${BLUE}========================================${NC}\n"

Create `backend/.env`:

```bash# Check Docker

GROQ_API_KEY=your_groq_api_key_hereif ! command -v docker &> /dev/null; then

FINDWORK_API_KEY=your_findwork_api_key_here    echo -e "${RED}Error: Docker is not installed.${NC}"

GOOGLE_API_KEY=your_google_api_key_here    exit 1

```fi



Create `front-end/.env`:if ! docker compose version &> /dev/null; then

```bash    echo -e "${RED}Error: Docker Compose is not installed.${NC}"

VITE_API_URL=http://localhost:8000    exit 1

VITE_PUBLIC_FIREBASE_API_KEY=your-firebase-api-keyfi

VITE_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com

VITE_PUBLIC_FIREBASE_PROJECT_ID=your-project-idecho -e "${GREEN}✓ Docker and Docker Compose are installed${NC}\n"

VITE_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com

VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id# Prepare environment variables

VITE_PUBLIC_FIREBASE_APP_ID=your-app-idecho -e "${BLUE}Preparing environment variables...${NC}"

VITE_MEASUREMENT_ID=your-measurement-idif [ -f ./prepare-env.sh ]; then

```    bash ./prepare-env.sh

    if [ $? -ne 0 ]; then

### 2. Run the Stack        exit 1

    fi

**Option A: Using the start script (Recommended)**else

```bash    # Fallback: check for .env file

chmod +x start.sh prepare-env.sh    if [ ! -f .env ]; then

./start.sh        echo -e "${YELLOW}⚠ .env file not found. Checking backend and frontend...${NC}"

```        

        if [ ! -f backend/.env ] || [ ! -f front-end/.env ]; then

**Option B: Manual Docker Compose**            echo -e "${RED}Error: Missing .env files${NC}"

```bash            echo -e "Please create:"

# Prepare environment            echo -e "  - backend/.env (API keys)"

./prepare-env.sh            echo -e "  - front-end/.env (Firebase config)"

            exit 1

# Start all services        fi

docker compose up -d --build        

```        # Create root .env

        cat backend/.env > .env

### 3. Access the Application        echo "" >> .env

        echo "# Frontend Firebase Configuration" >> .env

- **Frontend**: http://localhost:3000        grep "VITE_PUBLIC_FIREBASE" front-end/.env >> .env || true

- **API Gateway**: http://localhost:8000        grep "VITE_MEASUREMENT_ID" front-end/.env >> .env || true

- **API Docs**: http://localhost:8000/docs    fi

fi

## Services Architecture

echo -e "${GREEN}✓ Environment variables prepared${NC}\n"

The stack includes:

# Check if .env file exists (old check, kept for compatibility)

1. **Frontend** (port 3000) - React app served by Nginxif [ ! -f backend/.env ]; then

2. **API Gateway** (port 8000) - Routes requests to microservices    echo -e "${YELLOW}⚠ backend/.env file not found. Creating template...${NC}"

3. **Footprint Service** (port 8001) - GitHub/StackOverflow analysis    cat > backend/.env << EOF

4. **Resume Reviewer** (port 8002) - AI resume analysisGROQ_API_KEY=your_groq_api_key_here

5. **Job Matcher** (port 8003) - Job matching with MLFINDWORK_API_KEY=your_findwork_api_key_here

6. **AI Interviewer** (port 8004) - Interview question generationGOOGLE_API_KEY=your_google_api_key_here

EOF

All services communicate through a Docker network called `jobkai-network`.    echo -e "${YELLOW}Please edit backend/.env and add your API keys, then run this script again.${NC}"

    exit 0

## Docker Commandsfi



### View Logsecho -e "${GREEN}✓ backend/.env file found${NC}"

```bash

# All services# Load environment variables

docker compose logs -fexport $(cat backend/.env | grep -v '^#' | xargs)



# Specific service# Check API keys

docker compose logs -f frontendif [ -z "$GROQ_API_KEY" ] || [ "$GROQ_API_KEY" = "your_groq_api_key_here" ]; then

docker compose logs -f api-gateway    echo -e "${RED}Error: GROQ_API_KEY not set in backend/.env${NC}"

```    exit 1

fi

### Check Service Status

```bashif [ -z "$FINDWORK_API_KEY" ] || [ "$FINDWORK_API_KEY" = "your_findwork_api_key_here" ]; then

docker compose ps    echo -e "${RED}Error: FINDWORK_API_KEY not set in backend/.env${NC}"

```    exit 1

fi

### Restart a Service

```bashif [ -z "$GOOGLE_API_KEY" ] || [ "$GOOGLE_API_KEY" = "your_google_api_key_here" ]; then

docker compose restart frontend    echo -e "${RED}Error: GOOGLE_API_KEY not set in backend/.env${NC}"

docker compose restart api-gateway    exit 1

```fi



### Stop All Servicesecho -e "${GREEN}✓ All API keys are configured${NC}\n"

```bash

docker compose down# Build and start services

```echo -e "${BLUE}Building and starting all services...${NC}\n"

docker compose up -d --build

### Stop and Remove Volumes

```bashecho -e "\n${GREEN}========================================${NC}"

docker compose down -vecho -e "${GREEN}   JobKai is starting up!${NC}"

```echo -e "${GREEN}========================================${NC}\n"



### Rebuild a Serviceecho -e "Services:"

```bashecho -e "  ${BLUE}Frontend:${NC}      http://localhost:3000"

# Rebuild specific serviceecho -e "  ${BLUE}API Gateway:${NC}   http://localhost:8000"

docker compose up -d --build frontendecho -e "  ${BLUE}API Docs:${NC}      http://localhost:8000/docs"

echo -e ""

# Rebuild all servicesecho -e "Checking service health (this may take a minute)..."

docker compose up -d --build

```# Wait for services to be healthy

sleep 10

## Troubleshooting

# Check health

### Frontend Shows Firebase Errorif curl -sf http://localhost:8000/health > /dev/null 2>&1; then

    echo -e "${GREEN}✓ API Gateway is healthy${NC}"

This happens when Firebase environment variables are not passed to the Docker build.else

    echo -e "${YELLOW}⚠ API Gateway is still starting...${NC}"

**Solution:**fi

1. Ensure `front-end/.env` contains all Firebase variables

2. Run `./prepare-env.sh` to create root `.env`if wget --no-verbose --tries=1 --spider http://localhost:3000/ > /dev/null 2>&1; then

3. Rebuild: `docker compose up -d --build frontend`    echo -e "${GREEN}✓ Frontend is healthy${NC}"

else

### Service Won't Start    echo -e "${YELLOW}⚠ Frontend is still starting...${NC}"

fi

**Check logs:**

```bashecho -e "\n${BLUE}To view logs:${NC}"

docker compose logs frontendecho -e "  docker compose logs -f"

```echo -e ""

echo -e "${BLUE}To stop all services:${NC}"

**Common issues:**echo -e "  docker compose down"

- Missing API keys in `.env` filesecho -e ""

- Port already in use (change in `docker-compose.yml`)echo -e "${GREEN}Setup complete! 🚀${NC}"

- Build errors (check Node/Python versions in Dockerfiles)

### Can't Connect to Backend from Frontend

**In Docker:**
The frontend container is built with `VITE_API_URL=http://localhost:8000`. This works because the browser (client-side) makes requests to localhost:8000, which is mapped to the API Gateway container.

**If using a different host:**
Edit `docker-compose.yml` and change the `VITE_API_URL` build arg:
```yaml
args:
  VITE_API_URL: http://your-server-ip:8000
```

### API Gateway Can't Reach Microservices

Services communicate via Docker network using service names:
- `http://footprint-service:8001`
- `http://resume-reviewer-service:8002`
- etc.

These are automatically resolved by Docker's DNS.

## Production Deployment

### Environment Variables

For production, create production-specific `.env` files:

```bash
# .env.production
GROQ_API_KEY=prod_key_here
FINDWORK_API_KEY=prod_key_here
GOOGLE_API_KEY=prod_key_here
VITE_API_URL=https://api.your-domain.com
# ... Firebase config
```

### Use Production Config
```bash
docker compose --env-file .env.production up -d --build
```

### Security Considerations

1. **Never commit `.env` files** to version control
2. **Use secrets management** (Docker Secrets, AWS Secrets Manager, etc.)
3. **Enable HTTPS** (use reverse proxy like Nginx or Traefik)
4. **Restrict CORS** in API Gateway (`allow_origins=["*"]` → specific domains)
5. **Set up rate limiting** (already configured in API Gateway)
6. **Use environment-specific Firebase projects** (dev/staging/prod)

### Scaling

To run multiple instances of a service:
```bash
docker compose up -d --scale job-matcher-service=3
```

Note: You'll need a load balancer (Nginx, Traefik) for this.

## Development with Docker

### Hot Reload (Not Recommended for Docker)

Docker builds create production bundles. For development with hot reload:
```bash
# Frontend
cd front-end
npm run dev

# Backend services
cd backend/api-gateway
pip install -r requirements.txt
uvicorn main:app --reload
```

### Hybrid Approach

Run backend in Docker, frontend locally:
```bash
# Start backend
cd backend
docker compose up -d

# Start frontend locally
cd ../front-end
npm run dev
```

Frontend will connect to `http://localhost:8000` (API Gateway in Docker).

## File Structure

```
tsyp-JobKai/
├── docker-compose.yml          # Main compose file (all services)
├── .env                         # Root env (created by prepare-env.sh)
├── .env.example                # Template
├── start.sh                    # Quick start script
├── prepare-env.sh              # Env preparation
├── backend/
│   ├── docker-compose.yml      # Backend + frontend (alternative)
│   ├── .env                     # Backend API keys
│   └── [services]/
│       ├── Dockerfile
│       └── docker-compose.yml  # Individual service compose
└── front-end/
    ├── Dockerfile              # Multi-stage build
    ├── docker-compose.yml      # Standalone frontend
    ├── .env                     # Frontend config (Firebase)
    ├── .env.example
    └── nginx.conf              # Nginx config for production
```

## Cleanup

Remove all containers, networks, and volumes:
```bash
docker compose down -v
docker system prune -a
```

## Support

For issues:
1. Check logs: `docker compose logs -f [service-name]`
2. Verify environment files exist and have correct values
3. Ensure all ports are available (3000, 8000-8004)
4. Check Docker daemon is running: `docker ps`

## Next Steps

- Set up CI/CD pipeline (GitHub Actions, GitLab CI)
- Configure monitoring (Prometheus, Grafana)
- Set up log aggregation (ELK stack, Loki)
- Add container orchestration (Kubernetes, Docker Swarm)
