#!/bin/bash

# JobKai - Check Status of All Services

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  JobKai - Service Status${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check Docker containers
echo -e "${BLUE}Running Containers:${NC}"
docker ps --filter "name=jobkai" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No containers found"
echo ""

# Function to check service health
check_health() {
    local name=$1
    local port=$2
    
    if curl -s http://localhost:${port}/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ${name} (Port ${port})${NC} - Healthy"
        return 0
    else
        echo -e "${RED}✗ ${name} (Port ${port})${NC} - Not responding"
        return 1
    fi
}

# Check each service
echo -e "${BLUE}Service Health:${NC}"
check_health "Footprint Service   " 8001
check_health "Resume Reviewer     " 8002
check_health "Job Matcher         " 8003
check_health "API Gateway         " 8000

echo ""

# Try to get detailed health from API Gateway
echo -e "${BLUE}Detailed Service Status (via API Gateway):${NC}"
if curl -s http://localhost:8000/services/health > /dev/null 2>&1; then
    curl -s http://localhost:8000/services/health | jq '.' 2>/dev/null || curl -s http://localhost:8000/services/health
else
    echo -e "${YELLOW}API Gateway not available${NC}"
fi

echo ""
echo -e "${BLUE}Quick Access URLs:${NC}"
echo -e "  API Gateway:         http://localhost:8000"
echo -e "  API Documentation:   http://localhost:8000/docs"
echo -e "  Footprint Service:   http://localhost:8001/docs"
echo -e "  Resume Reviewer:     http://localhost:8002/docs"
echo -e "  Job Matcher:         http://localhost:8003/docs"
