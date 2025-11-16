<div align="center">
  <img src="image.png" alt="JobKai Logo" width="200"/>
  
  # JobKai - AI-Powered Career Platform

  <p>
    <strong>Your AI-powered career companion for resume optimization, job matching, and interview preparation</strong>
  </p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-local-development">Local Development</a> •
    <a href="#-kubernetes-deployment">Kubernetes</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="#-api-endpoints">API</a>
  </p>

  ![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
  ![Kubernetes](https://img.shields.io/badge/Kubernetes-Production-blue?logo=kubernetes)
  ![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green?logo=fastapi)
  ![React](https://img.shields.io/badge/React-Frontend-blue?logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-Powered-blue?logo=typescript)
  ![Azure](https://img.shields.io/badge/Azure-AKS-0078D4?logo=microsoft-azure)
</div>

---

## 📝 Overview

JobKai is a comprehensive AI-powered career platform that helps job seekers optimize their resumes, match with relevant jobs, showcase their developer footprint, and practice interviews with AI.

**🌐 Live Production**: [https://jobkai.app](https://jobkai.app)

**Production Infrastructure**:
- **Frontend**: React + TypeScript + Vite deployed on Azure AKS
- **Backend**: 5 FastAPI microservices orchestrated with Kubernetes
- **Container Registry**: Azure Container Registry (ACR)
- **SSL/TLS**: Let's Encrypt with cert-manager (automatic renewal)
- **Deployment**: Automated with Ansible playbooks
- **Authentication**: Firebase Auth with JWT tokens

## 🚀 Features

- **Resume Analysis & Improvement**: AI-powered resume review and enhancement using Groq API
- **Job Matching**: Intelligent job matching using multiple job APIs (Findwork, The Muse, RemoteOK)
- **Developer Footprint**: Analyze GitHub repositories and StackOverflow profiles
- **AI Interviewer**: Generate interview questions and get AI-powered feedback (Google Gemini)
- **Modern Web Interface**: React-based frontend with shadcn-ui components and custom logo
- **Voice AI Integration**: Vapi AI for voice-based interview practice
- **Firebase Authentication**: Secure user authentication with JWT tokens and auto-refresh
- **Production Ready**: Deployed on Kubernetes with automated CI/CD via Ansible

## 🏗️ Architecture

### Development Architecture
```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Vite + React)           │
│                   Port: 5173 (dev)                  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              API Gateway (FastAPI)                  │
│             Port: 8000 + Firebase Auth              │
└───┬────────┬────────┬────────┬───────────────────┬──┘
    │        │        │        │                   │
    ▼        ▼        ▼        ▼                   ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐  ┌────────────┐
│Foot  │ │Resume│ │Job   │ │AI        │  │Firebase    │
│print │ │Review│ │Match │ │Interview │  │(Auth & DB) │
│:8001 │ │:8002 │ │:8003 │ │:8004     │  │            │
└──────┘ └──────┘ └──────┘ └──────────┘  └────────────┘
```

### Production Architecture (Kubernetes on Azure AKS)
```
                    ┌─────────────────────────┐
                    │   Azure Load Balancer   │
                    └──────────┬──────────────┘
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  │
    ┌──────────────┐   ┌──────────────┐         │
    │   Frontend   │   │ API Gateway  │         │
    │ LoadBalancer │   │ LoadBalancer │         │
    │    :80       │   │    :8000     │         │
    └──────────────┘   └──────┬───────┘         │
                               │                  │
        ┌──────────────────────┼──────────────────┘
        │                      │
        ▼                      ▼
┌────────────────────────────────────────────────┐
│         Kubernetes Cluster (AKS)               │
│  Namespace: jobkai                             │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Footprint│  │  Resume  │  │   Jobs   │    │
│  │ Service  │  │ Reviewer │  │ Matcher  │    │
│  │  :8001   │  │  :8002   │  │  :8003   │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│                                                │
│  ┌──────────┐  ┌────────────────────────┐    │
│  │   AI     │  │  ConfigMaps & Secrets  │    │
│  │Interview │  │  (Environment Vars)    │    │
│  │  :8004   │  └────────────────────────┘    │
│  └──────────┘                                 │
└────────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────┐
│    Azure Container Registry (ACR)              │
│    jobkairegistry.azurecr.io                   │
│    • frontend:latest                           │
│    • api-gateway:latest                        │
│    • footprint:latest                          │
│    • resume-reviewer:latest                    │
│    • job-matcher:latest                        │
│    • ai-interviewer:latest                     │
└────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### For Local Development
- **Docker** and **Docker Compose** (v2+)
- **Node.js** (v18+) and **npm** (for frontend development)
- **Python** 3.11+ (if running services without Docker)
- **Git**: For cloning the repository

### Required API Keys
- **Groq API Key**: [Get from Groq Console](https://console.groq.com/) - For AI resume analysis
- **Findwork API Key**: [Get from Findwork](https://findwork.dev/developers/) - For job listings
- **Google API Key**: [Get from Google AI Studio](https://makersuite.google.com/app/apikey) - For AI interviews
- **Vapi AI Key**: [Get from Vapi Dashboard](https://vapi.ai/) - For voice interviews
- **Firebase Project**: [Create Firebase Project](https://console.firebase.google.com/) - For authentication

### For Kubernetes Deployment
- **kubectl**: Kubernetes CLI tool
- **Azure CLI**: For AKS and ACR access
- **Ansible** (2.16+): For automated deployment
- **Azure Container Registry**: Push Docker images
- **Azure Kubernetes Service (AKS)**: Running cluster

---

## 🧪 Local Development & Testing

### Step 1: Clone the Repository

```bash
git clone https://github.com/jobkaiteam-code/JobKai.git
cd tsyp-JobKai
```

### Step 2: Set Up Environment Variables

All services require environment variables. Use the `.env.example` files as templates:

#### Backend Services

```bash
# Navigate to backend
cd backend

# Copy the example file
cp .env.example .env

# Edit with your API keys
nano .env  # or use your preferred editor
```

**Required variables in `backend/.env`:**
```bash
# AI Services
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
FINDWORK_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Service URLs (for Docker Compose - use container names)
FOOTPRINT_URL=http://footprint:8001
RESUME_REVIEWER_URL=http://resume-reviewer:8002
JOB_MATCHER_URL=http://job-matcher:8003
AI_INTERVIEWER_URL=http://ai-interviewer:8004
```

#### Frontend

```bash
cd front-end

# Copy the example file
cp .env.example .env

# Edit with your Firebase config
nano .env
```

**Required variables in `front-end/.env`:**
```bash
# API Gateway URL
VITE_API_URL=http://localhost:8000

# Firebase Configuration (get from Firebase Console)
VITE_PUBLIC_FIREBASE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
VITE_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxx

# Vapi AI (for voice interviews)
VITE_VAPI_PUBLIC_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### Firebase Admin SDK (Backend)

Each backend service that uses Firebase needs the Firebase Admin SDK JSON file:

```bash
# Download from Firebase Console:
# Project Settings > Service Accounts > Generate New Private Key

# Place in each service directory:
cp your-firebase-adminsdk.json backend/api-gateway/jobkai-firebase-adminsdk.json
cp your-firebase-adminsdk.json backend/ai-interviewer/jobkai-firebase-adminsdk.json
```

### Step 3: Start Backend Services

#### Option A: Docker Compose (Recommended)

```bash
cd backend

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Check service health
./check-status.sh
```

#### Option B: Individual Services (for development)

```bash
cd backend

# Start API Gateway
cd api-gateway
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# In separate terminals, start each service:
# Footprint (port 8001)
cd backend/footprint
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Resume Reviewer (port 8002)
cd backend/Resume_Reviewer_and_Rewriter
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8002

# Job Matcher (port 8003)
cd backend/Job_matcher_from_linkedin-main
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8003

# AI Interviewer (port 8004)
cd backend/ai-interviewer
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8004
```

### Step 4: Start Frontend

```bash
cd front-end

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend will be available at http://localhost:5173
```

### Step 5: Test the Application

#### 1. **Health Check**

```bash
# Check API Gateway
curl http://localhost:8000/health

# Check all services
curl http://localhost:8000/services/health
```

#### 2. **Create a Test Account**

1. Open http://localhost:5173 in your browser
2. Click "Sign Up"
3. Enter email and password
4. Verify Firebase authentication works

#### 3. **Test Resume Analysis**

```bash
# Upload a test resume PDF
curl -X POST http://localhost:8000/api/v1/resume/analyze \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "file=@test-resume.pdf"
```

#### 4. **Test Job Matching**

```bash
curl -X POST http://localhost:8000/api/v1/jobs/match \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "cv_file=@test-cv.pdf" \
  -F "job_title=Software Engineer" \
  -F "location=Remote"
```

#### 5. **Test Footprint Analysis**

```bash
curl -X POST http://localhost:8000/api/v1/footprint/analyze \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"github_username": "torvalds"}'
```

#### 6. **Test AI Interview**

1. Navigate to AI Interviewer page in the UI
2. Fill in role and preferences
3. Click "Generate Interview"
4. Start voice call (requires microphone permission)

### Troubleshooting Local Setup

#### Frontend Can't Connect to Backend

```bash
# Check if backend is running
curl http://localhost:8000/health

# Verify VITE_API_URL in front-end/.env
echo $VITE_API_URL  # Should be http://localhost:8000
```

#### Firebase Authentication Errors

1. Ensure Firebase config in `front-end/.env` is correct
2. Add `localhost` to Firebase Console > Authentication > Authorized domains
3. Check Firebase Admin SDK JSON file exists in backend services

#### Service Can't Find Other Services

```bash
# If using Docker Compose, services use container names
# Check docker-compose.yml for correct service names

# If running locally without Docker, update .env:
FOOTPRINT_URL=http://localhost:8001
RESUME_REVIEWER_URL=http://localhost:8002
JOB_MATCHER_URL=http://localhost:8003
AI_INTERVIEWER_URL=http://localhost:8004
```

#### API Key Errors

```bash
# Verify all API keys are set
cd backend
cat .env | grep API_KEY

# Test individual services
curl http://localhost:8002/health  # Resume Reviewer
curl http://localhost:8004/health  # AI Interviewer
```

### Development Workflow

```bash
# 1. Make changes to code

# 2. For frontend changes (auto-reloads)
# Just save files - Vite HMR handles it

# 3. For backend changes with Docker Compose
cd backend
docker compose restart <service-name>
docker compose logs -f <service-name>

# 4. For backend changes without Docker
# Uvicorn --reload handles auto-restart

# 5. View logs
# Frontend: Check browser console
# Backend: docker compose logs -f
```

---

## 🚀 Quick Start Scripts

### Option 1: Full Docker Stack (Recommended for Production)

```bash
# 1. Create environment files
cat > backend/.env << EOF
GROQ_API_KEY=your_groq_api_key
FINDWORK_API_KEY=your_findwork_api_key
GOOGLE_API_KEY=your_google_api_key
EOF

cat > front-end/.env << EOF
VITE_API_URL=http://localhost:8000
VITE_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
VITE_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
VITE_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_PUBLIC_FIREBASE_APP_ID=your-app-id
EOF

# 2. Run the quick start script
chmod +x start.sh prepare-env.sh
./start.sh

**Access the application:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option 2: Separate Backend and Frontend (Development)

#### Start Backend Services

```bash
cd backend

# Create .env file with your API keys
cat > .env << EOF
GROQ_API_KEY=your_groq_api_key_here
FINDWORK_API_KEY=your_findwork_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
EOF

# Start all backend services with Docker
docker compose up -d

# Check service health
./check-status.sh
```

#### Start Frontend

```bash
cd front-end

# Create .env file with Firebase config
cat > .env << EOF
VITE_API_URL=http://localhost:8000
VITE_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
VITE_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
VITE_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_PUBLIC_FIREBASE_APP_ID=your-app-id
EOF

# Install and run
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:5173 (dev server)
- API Gateway: http://localhost:8000

## ☸️ Kubernetes Deployment

### Quick Deploy to AKS with Ansible

```bash
# 1. Connect to your AKS cluster
az aks get-credentials --resource-group <your-resource-group> --name <your-cluster-name>

# 2. Configure secrets
cd ansible
cp vars/secrets.yml.example vars/secrets.yml
# Edit vars/secrets.yml with your API keys and Firebase config

# 3. Deploy with Ansible
./quick-deploy.sh

# 4. Get service URLs
kubectl get services -n jobkai
```

### Manual Kubernetes Deployment

```bash
# 1. Build and push Docker images to ACR
az acr login --name <your-registry-name>

# Build all services
docker build -t <registry>.azurecr.io/frontend:latest ./front-end
docker build -t <registry>.azurecr.io/api-gateway:latest ./backend/api-gateway
docker build -t <registry>.azurecr.io/footprint:latest ./backend/footprint
docker build -t <registry>.azurecr.io/resume-reviewer:latest ./backend/Resume_Reviewer_and_Rewriter
docker build -t <registry>.azurecr.io/job-matcher:latest ./backend/Job_matcher_from_linkedin-main
docker build -t <registry>.azurecr.io/ai-interviewer:latest ./backend/ai-interviewer

# Push all images
docker push <registry>.azurecr.io/frontend:latest
docker push <registry>.azurecr.io/api-gateway:latest
docker push <registry>.azurecr.io/footprint:latest
docker push <registry>.azurecr.io/resume-reviewer:latest
docker push <registry>.azurecr.io/job-matcher:latest
docker push <registry>.azurecr.io/ai-interviewer:latest

# 2. Create namespace
kubectl create namespace jobkai

# 3. Create secrets
kubectl create secret generic jobkai-secrets -n jobkai \
  --from-literal=VITE_API_URL='http://<your-api-gateway-ip>:8000' \
  --from-literal=VITE_PUBLIC_FIREBASE_API_KEY='<your-key>' \
  --from-literal=VITE_PUBLIC_FIREBASE_AUTH_DOMAIN='<your-domain>' \
  --from-literal=VITE_PUBLIC_FIREBASE_PROJECT_ID='<your-project>' \
  --from-literal=VITE_PUBLIC_FIREBASE_STORAGE_BUCKET='<your-bucket>' \
  --from-literal=VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID='<your-sender>' \
  --from-literal=VITE_PUBLIC_FIREBASE_APP_ID='<your-app-id>' \
  --from-literal=VITE_VAPI_PUBLIC_KEY='<your-vapi-key>' \
  --from-literal=GROQ_API_KEY='<your-groq-key>' \
  --from-literal=GOOGLE_API_KEY='<your-google-key>' \
  --from-literal=FINDWORK_API_KEY='<your-findwork-key>'

# 4. Deploy all services
kubectl apply -f k8s/

# 5. Wait for services to be ready
kubectl get pods -n jobkai --watch

# 6. Get public IPs
kubectl get services -n jobkai -o wide
```

### Kubernetes Architecture

**Namespace**: `jobkai`

**Deployments**:
- `frontend` - React app (2 replicas, 100m CPU, 256Mi RAM)
- `api-gateway` - FastAPI gateway (2 replicas, 200m CPU, 512Mi RAM)
- `footprint` - GitHub/SO analyzer (1 replica, 100m CPU, 256Mi RAM)
- `resume-reviewer` - Resume AI (1 replica, 100m CPU, 256Mi RAM)
- `job-matcher` - Job matching (1 replica, 200m CPU, 1Gi RAM)
- `ai-interviewer` - Interview AI (1 replica, 100m CPU, 256Mi RAM)

**Services**:
- Frontend: LoadBalancer (port 80)
- API Gateway: LoadBalancer (port 8000)
- All backend services: ClusterIP (internal only)

**ConfigMaps & Secrets**:
- `jobkai-secrets` - API keys and Firebase config
- All services mount secrets as environment variables

### Automated Deployment with Ansible

The project includes comprehensive Ansible playbooks for automated deployment:

```bash
cd ansible

# Deploy entire platform
ansible-playbook deploy-jobkai.yml

# Update images only (faster redeployment)
ansible-playbook update-images.yml

# Teardown (delete all resources)
ansible-playbook teardown.yml
```

**Ansible Features**:
- ✅ Automated namespace creation
- ✅ Secret and ConfigMap management
- ✅ Rolling deployment of all services
- ✅ Health check validation
- ✅ Service URL retrieval
- ✅ Rollback support

See [ansible/README.md](ansible/README.md) for detailed documentation.

## 📖 Detailed Documentation

- **[Kubernetes Deployment](ansible/README.md)** - Complete K8S and Ansible guide
- **[Docker Setup Guide](DOCKER_SETUP.md)** - Complete Docker deployment guide
- **Backend Services**: See [backend/README.md](backend/README.md)
- **Frontend**: See [front-end/README.md](front-end/README.md)
- **Individual Microservices**:
  - [Footprint Service](backend/footprint/README.md)
  - [Resume Reviewer](backend/Resume_Reviewer_and_Rewriter/README.md)
  - [Job Matcher](backend/Job_matcher_from_linkedin-main/README.md)
  - [AI Interviewer](backend/ai-interviewer/README.md)
  - [API Gateway](backend/api-gateway/README.md)

## 🔧 Development

### Backend

```bash
cd backend

# Start specific service
cd <service-name>
docker compose up -d

# View logs
docker compose logs -f

# Stop service
docker compose down
```

### Frontend

```bash
cd front-end

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## 🧪 Testing

### Test Backend Services (Local)

```bash
# Health check
curl http://localhost:8000/health

# Check all services status
curl http://localhost:8000/services/health

# Test footprint analysis
curl -X POST http://localhost:8000/api/v1/footprint/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-firebase-token>" \
  -d '{"github_username": "torvalds"}'

# Test resume analysis (requires PDF)
curl -X POST http://localhost:8000/api/v1/resume/analyze \
  -H "Authorization: Bearer <your-firebase-token>" \
  -F "file=@path/to/resume.pdf"
```

### Test Kubernetes Deployment

```bash
# Get service endpoints
kubectl get services -n jobkai

# Port-forward for testing
kubectl port-forward -n jobkai svc/api-gateway 8000:8000

# Test from inside cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n jobkai -- \
  curl http://api-gateway.jobkai.svc.cluster.local:8000/health

# Check pod logs
kubectl logs -n jobkai -l app=api-gateway --tail=100 -f
```

### Firebase Authentication Setup

1. **Enable Sign-In Methods**:
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable: Email/Password, Google, GitHub

2. **Add Authorized Domains**:
   - Go to Firebase Console > Authentication > Settings
   - Add your production domain to "Authorized domains"
   - For Kubernetes: Add your LoadBalancer IP

3. **GitHub OAuth** (if using):
   - Create OAuth App at https://github.com/settings/developers
   - Set callback URL: `https://<your-project>.firebaseapp.com/__/auth/handler`
   - Add Client ID and Secret to Firebase

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Docker**: Containerization
- **Groq API**: AI-powered resume analysis
- **Google Gemini**: AI interview generation
- **Firebase Admin SDK**: Authentication and database
- **Beautiful Soup**: Web scraping
- **Sentence Transformers**: Job matching ML models

### Frontend
- **Vite**: Fast build tool
- **React**: UI library  
- **TypeScript**: Type safety
- **shadcn-ui**: Component library
- **Tailwind CSS**: Styling
- **Firebase**: Authentication with JWT tokens
- **React Query**: Data fetching
- **Vapi AI**: Voice interview integration

### Infrastructure & DevOps
- **Docker**: Containerization
- **Kubernetes**: Container orchestration (Azure AKS)
- **Azure Container Registry**: Docker image registry
- **Ansible**: Infrastructure automation
- **Nginx**: Production web server

## 📦 Project Structure

```
tsyp-JobKai/
├── backend/                              # Backend microservices
│   ├── api-gateway/                      # Central API gateway (port 8000)
│   │   ├── main.py                       # FastAPI app with Firebase auth
│   │   ├── middleware/                   # Authentication middleware
│   │   └── job-kai-firebase-adminsdk-*.json
│   ├── footprint/                        # GitHub/StackOverflow analysis (port 8001)
│   ├── Resume_Reviewer_and_Rewriter/    # Resume AI service (port 8002)
│   ├── Job_matcher_from_linkedin-main/  # Job matching service (port 8003)
│   ├── ai-interviewer/                  # AI interview service (port 8004)
│   ├── docker-compose.yml               # Main Docker compose file
│   ├── start.sh                         # Quick start script
│   ├── stop-all.sh                      # Stop all services
│   └── check-status.sh                  # Check service health
│
├── front-end/                           # React frontend
│   ├── src/
│   │   ├── components/                  # React components
│   │   ├── pages/                       # Page components (Login, Signup, etc.)
│   │   ├── services/                    # API services with token refresh
│   │   ├── firebase/                    # Firebase config
│   │   └── lib/                         # Utilities
│   ├── Dockerfile                       # Multi-stage build with Nginx
│   ├── nginx.conf                       # Production server config
│   └── package.json
│
├── k8s/                                 # Kubernetes manifests
│   ├── namespace.yaml                   # JobKai namespace
│   ├── secrets.yaml                     # API keys and Firebase config
│   ├── configmap.yaml                   # Environment variables
│   ├── frontend.yaml                    # Frontend deployment + LoadBalancer
│   ├── api-gateway.yaml                 # API Gateway deployment + LoadBalancer
│   ├── footprint.yaml                   # Footprint service deployment
│   ├── resume-reviewer.yaml             # Resume service deployment
│   ├── job-matcher.yaml                 # Job matcher deployment
│   ├── ai-interviewer.yaml              # AI interviewer deployment
│   └── ingress.yaml                     # Optional ingress configuration
│
├── ansible/                             # Ansible automation
│   ├── deploy-jobkai.yml                # Main deployment playbook
│   ├── update-images.yml                # Update images only
│   ├── teardown.yml                     # Remove all resources
│   ├── quick-deploy.sh                  # Quick deployment script
│   ├── inventory.ini                    # Ansible inventory
│   ├── ansible.cfg                      # Ansible configuration
│   └── vars/
│       ├── secrets.yml                  # Encrypted secrets
│       └── secrets.yml.example          # Template
│
├── image.png / symbol.png               # JobKai logos
├── docker-compose.yml                   # Full stack Docker compose
├── start.sh                             # Quick start all services
└── README.md                            # This file
```

## 🌐 API Endpoints

All endpoints are accessible through the API Gateway

**Local**: `http://localhost:8000`  
**Kubernetes**: `http://<api-gateway-loadbalancer-ip>:8000`

### Public Endpoints (No Auth Required)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/services/health` | GET | All services status |
| `/docs` | GET | Interactive API documentation |

### Protected Endpoints (Requires Firebase Auth Token)
| Service | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Footprint | `/api/v1/footprint/analyze` | POST | Analyze GitHub/StackOverflow profile |
| Resume | `/api/v1/resume/analyze` | POST | Analyze resume PDF with AI |
| Resume | `/api/v1/resume/improve` | POST | Improve resume with AI suggestions |
| Jobs | `/api/v1/jobs/match` | POST | Match jobs based on CV/skills |
| Interview | `/api/v1/interview/generate` | POST | Generate AI interview questions |
| Interview | `/api/v1/interview/feedback` | POST | Get AI feedback on answers |

**Authentication**: All protected endpoints require a Firebase JWT token in the `Authorization` header:
```bash
Authorization: Bearer <firebase-id-token>
```

**Interactive API Documentation**: 
- Local: http://localhost:8000/docs
- Kubernetes: `http://<api-gateway-ip>:8000/docs`

## 🐛 Troubleshooting

### Local Development Issues

**Services not starting?**
```bash
# Check Docker status
docker ps

# View service logs
cd backend
docker compose logs -f <service-name>

# Rebuild services
docker compose up -d --build
```

**API Key errors?**
- Verify your `.env` file in the `backend/` directory contains valid API keys
- Ensure no extra spaces or quotes around the keys

**Firebase authentication errors?**
- Check Firebase console for authorized domains
- Verify Firebase config in `.env` files
- Ensure token refresh is working (check browser console)

### Frontend Issues

**Dependencies not installing?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors?**
```bash
# Check TypeScript errors
npm run lint
```

**"API key not valid" Firebase errors?**
- Verify all `VITE_PUBLIC_FIREBASE_*` environment variables are set correctly
- Check that the Firebase project is active
- Ensure authorized domains are configured in Firebase Console

### Kubernetes Issues

**Pods not starting?**
```bash
# Check pod status
kubectl get pods -n jobkai

# View pod logs
kubectl logs -n jobkai <pod-name>

# Describe pod for events
kubectl describe pod -n jobkai <pod-name>

# Check secrets are created
kubectl get secrets -n jobkai
```

**Can't access services?**
```bash
# Check LoadBalancer external IPs
kubectl get services -n jobkai

# If pending, check cloud provider configuration
kubectl describe service frontend -n jobkai
kubectl describe service api-gateway -n jobkai

# Port-forward for testing
kubectl port-forward -n jobkai svc/api-gateway 8000:8000
```

**Image pull errors?**
```bash
# Login to Azure Container Registry
az acr login --name <your-registry>

# Check images exist
az acr repository list --name <your-registry>

# Update Kubernetes to use ACR
az aks update -n <cluster-name> -g <resource-group> --attach-acr <acr-name>
```

**CORS errors in browser?**
- Ensure API Gateway has proper CORS configuration
- Check that frontend is calling the correct API Gateway URL
- Verify `VITE_API_URL` environment variable is set correctly

### Common Issues

**Browser shows "unauthorized domain" for Firebase:**
1. Go to Firebase Console → Authentication → Settings
2. Add your domain to "Authorized domains"
3. For Kubernetes: Add LoadBalancer IP
4. Wait a few minutes for changes to propagate

**Password field warnings (HTTP):**
- Expected behavior on HTTP (not HTTPS)
- For production, set up HTTPS using cert-manager or reverse proxy
- For testing, warnings can be ignored

**Token expires after 1 hour:**
- Frontend automatically refreshes tokens
- Check browser console for "Token auto-refresh" messages
- If not working, verify `getFirebaseToken()` is called in API client

## 🔐 Security Notes

- ✅ All API endpoints (except health checks) require Firebase authentication
- ✅ JWT tokens auto-refresh before expiration
- ✅ All secrets managed via Kubernetes Secrets or .env files (never committed)
- ✅ HTTPS enforced in production with Let's Encrypt (automatic renewal)
- ⚠️ Use HTTPS in production (HTTP shows browser warnings)
- ⚠️ Keep API keys and secrets secure (use Kubernetes secrets)
- ⚠️ Never commit `.env` files or Firebase admin SDK JSON to Git
- ⚠️ Review Firebase security rules and CORS configuration

## 📦 Environment Variables Reference

All services use environment variables for configuration. Use the provided `.env.example` files as templates:

### Backend Services
- `backend/.env.example` - Global backend configuration
- `backend/api-gateway/.env.example` - API Gateway specific
- `backend/Resume_Reviewer_and_Rewriter/.env.example` - Resume service (Groq API)
- `backend/Job_matcher_from_linkedin-main/.env.example` - Job matcher (Findwork API)
- `backend/ai-interviewer/.env.example` - AI Interviewer (Google Gemini)
- `backend/footprint/.env.example` - Developer footprint service

### Frontend
- `front-end/.env.example` - Frontend configuration (Firebase, Vapi, API URL)

**To set up:**
```bash
# Copy example files
cp backend/.env.example backend/.env
cp front-end/.env.example front-end/.env

# Edit with your actual API keys
nano backend/.env
nano front-end/.env

# For individual services (if needed)
cp backend/api-gateway/.env.example backend/api-gateway/.env
cp backend/Resume_Reviewer_and_Rewriter/.env.example backend/Resume_Reviewer_and_Rewriter/.env
# ... etc
```

**Required API Keys:**
- **Groq**: Resume AI analysis - [console.groq.com](https://console.groq.com/)
- **Google Gemini**: Interview AI - [makersuite.google.com](https://makersuite.google.com/app/apikey)
- **Findwork**: Job listings - [findwork.dev/developers](https://findwork.dev/developers/)
- **Vapi**: Voice interviews - [vapi.ai/dashboard](https://vapi.ai/dashboard)
- **Firebase**: Authentication & database - [console.firebase.google.com](https://console.firebase.google.com/)

## ✅ Production Checklist

Before deploying to production:
- [ ] Set up HTTPS with Let's Encrypt (cert-manager configured)
- [ ] Configure Firebase authorized domains with production domain
- [ ] Enable all required Firebase sign-in methods (Email, Google, GitHub)
- [ ] Add Firebase Admin SDK JSON files to backend services
- [ ] Create Kubernetes secrets with all API keys
- [ ] Set up proper monitoring and logging (Prometheus + Grafana recommended)
- [ ] Configure resource limits and autoscaling in Kubernetes
- [ ] Set up backup strategy for Firebase Firestore data
- [ ] Review and update CORS configuration for production domains
- [ ] Enable Firebase security rules for Firestore
- [ ] Set up CI/CD pipeline for automated deployments (GitHub Actions recommended)
- [ ] Configure DNS with custom domain (A records for frontend and API)
- [ ] Test all services health checks
- [ ] Perform load testing
- [ ] Set up error tracking (Sentry recommended)

## 🌐 Production Deployment (Azure AKS)

**Current Production Setup:**
- **Frontend**: https://jobkai.app
- **API**: https://api.jobkai.app
- **Cluster**: Azure AKS (JobKaiCluster, East US)
- **Nodes**: 2x Standard B2s (2 vCPU, 4GB RAM each)
- **SSL**: Let's Encrypt with automatic renewal
- **DNS**: Cloudflare + name.com
- **Registry**: Azure Container Registry (ACR)

For detailed deployment instructions, see:
- [`ansible/README.md`](ansible/README.md) - Automated deployment with Ansible
- [`summary/TECHNICAL_ARCHITECTURE_AND_SECURITY.md`](summary/TECHNICAL_ARCHITECTURE_AND_SECURITY.md) - Complete technical documentation

## 📝 License

This project is part of the TSYP (IEEE Tunisia Section Young Professionals) challenge.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the repository.

---

<div align="center">
  <p><strong>Built with ❤️ for TSYP (IEEE Tunisia Section Young Professionals)</strong></p>
  <p>
    <a href="#-overview">Back to Top</a>
  </p>
</div># JobKai
