#!/bin/bash

# JobKai - Stop All Services
# Stops all independently running services

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  JobKai - Stopping All Services${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Stop all services using main docker-compose.yml
echo -e "${YELLOW}Stopping all JobKai services...${NC}"
docker compose down

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All Services Stopped!${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Show remaining containers (if any)
RUNNING=$(docker ps --filter "name=jobkai" --format "{{.Names}}" | wc -l)
if [ $RUNNING -gt 0 ]; then
    echo -e "${YELLOW}Note: Some containers are still running:${NC}"
    docker ps --filter "name=jobkai" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${GREEN}No JobKai containers running${NC}"
fi
