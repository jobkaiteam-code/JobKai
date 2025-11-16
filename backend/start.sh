#!/bin/bash

# JobKai Backend Quick Start Script
# This script helps you set up and run the JobKai backend services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   JobKai Backend Setup & Start${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed (v2)
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file and add your API keys:${NC}"
    echo -e "  - GROQ_API_KEY (get from https://console.groq.com/)"
    echo -e "  - FINDWORK_API_KEY (get from https://findwork.dev/developers/)"
    echo -e "\n${YELLOW}After adding keys, run this script again.${NC}"
    exit 0
fi

echo -e "${GREEN}✓ .env file found${NC}"

# Check if API keys are set
source .env
if [ -z "$GROQ_API_KEY" ] || [ -z "$FINDWORK_API_KEY" ]; then
    echo -e "${RED}Error: API keys not configured in .env file${NC}"
    echo "Please edit .env and add your actual API keys:"
    echo -e "  - GROQ_API_KEY (get from https://console.groq.com/)"
    echo -e "  - FINDWORK_API_KEY (get from https://findwork.dev/developers/)"
    exit 1
fi

# Check if placeholder values are still present
if [ "$GROQ_API_KEY" = "your_groq_api_key_here" ] || [ "$FINDWORK_API_KEY" = "your_findwork_api_key_here" ]; then
    echo -e "${RED}Error: Please replace placeholder values with actual API keys in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✓ API keys configured${NC}\n"

# Ask user if they want to build or rebuild
echo -e "${BLUE}What would you like to do?${NC}"
echo "1) Build and start services (first time)"
echo "2) Start existing services"
echo "3) Rebuild and start services (clean build)"
echo "4) Stop all services"
echo "5) View logs"
read -p "Enter your choice [1-5]: " choice

case $choice in
    1)
        echo -e "\n${BLUE}Building and starting all services...${NC}"
        docker compose up --build -d
        ;;
    2)
        echo -e "\n${BLUE}Starting existing services...${NC}"
        docker compose up -d
        ;;
    3)
        echo -e "\n${BLUE}Rebuilding all services from scratch...${NC}"
        docker compose down
        docker compose build --no-cache
        docker compose up -d
        ;;
    4)
        echo -e "\n${BLUE}Stopping all services...${NC}"
        docker compose down
        echo -e "${GREEN}✓ All services stopped${NC}"
        exit 0
        ;;
    5)
        echo -e "\n${BLUE}Showing logs (Ctrl+C to exit)...${NC}"
        docker compose logs -f
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Wait for services to be healthy
echo -e "\n${BLUE}Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "\n${BLUE}Checking service health...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API Gateway is healthy${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting for API Gateway to be ready... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}Error: API Gateway failed to start${NC}"
    echo "Check logs with: docker compose logs api-gateway"
    exit 1
fi

# Check all services
echo -e "\n${BLUE}Checking all backend services...${NC}"
SERVICES_HEALTH=$(curl -s http://localhost:8000/services/health)
echo "$SERVICES_HEALTH" | jq '.'

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Services are running!${NC}"
echo -e "${GREEN}========================================${NC}\n"
echo -e "API Gateway:          ${BLUE}http://localhost:8000${NC}"
echo -e "API Documentation:    ${BLUE}http://localhost:8000/docs${NC}"
echo -e "Health Check:         ${BLUE}http://localhost:8000/health${NC}"
echo -e "Services Status:      ${BLUE}http://localhost:8000/services/health${NC}"
echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  View logs:          ${BLUE}docker compose logs -f${NC}"
echo -e "  Stop services:      ${BLUE}docker compose down${NC}"
echo -e "  Restart services:   ${BLUE}docker compose restart${NC}"
echo -e "  View containers:    ${BLUE}docker compose ps${NC}"
echo -e "\nFor more commands, check the Makefile or README.md"
