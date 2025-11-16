#!/bin/bash
cd backend

echo "=== Building and pushing updated services with CORS fixes ==="

# API Gateway
echo "1/5 Building API Gateway..."
docker build -t jobkairegistry.azurecr.io/api-gateway:latest ./api-gateway
docker push jobkairegistry.azurecr.io/api-gateway:latest

# Resume Reviewer
echo "2/5 Building Resume Reviewer..."
docker build -t jobkairegistry.azurecr.io/resume-reviewer-service:latest ./Resume_Reviewer_and_Rewriter
docker push jobkairegistry.azurecr.io/resume-reviewer-service:latest

# Footprint
echo "3/5 Building Footprint..."
docker build -t jobkairegistry.azurecr.io/footprint-service:latest ./footprint
docker push jobkairegistry.azurecr.io/footprint-service:latest

# AI Interviewer
echo "4/5 Building AI Interviewer..."
docker build -t jobkairegistry.azurecr.io/ai-interviewer-service:latest ./ai-interviewer
docker push jobkairegistry.azurecr.io/ai-interviewer-service:latest

# Job Matcher
echo "5/5 Building Job Matcher..."
docker build -t jobkairegistry.azurecr.io/job-matcher-service:latest ./Job_matcher_from_linkedin-main
docker push jobkairegistry.azurecr.io/job-matcher-service:latest

echo "=== All services rebuilt and pushed! ==="
