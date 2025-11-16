.PHONY: help build up down restart logs ps clean test health

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker compose build

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## View logs from all services
	docker compose logs -f

logs-gateway: ## View API Gateway logs
	docker compose logs -f api-gateway

logs-footprint: ## View Footprint service logs
	docker compose logs -f footprint-service

logs-resume: ## View Resume Reviewer service logs
	docker compose logs -f resume-reviewer-service

logs-jobs: ## View Job Matcher service logs
	docker compose logs -f job-matcher-service

ps: ## List running containers
	docker compose ps

clean: ## Stop services and remove containers, networks, volumes
	docker compose down -v --rmi local

clean-all: ## Remove everything including images
	docker compose down -v --rmi all

rebuild: ## Rebuild and restart all services
	docker compose down
	docker compose build --no-cache
	docker compose up -d

health: ## Check health of all services
	@echo "Checking API Gateway health..."
	@curl -s http://localhost:8000/health | jq '.' || echo "API Gateway not responding"
	@echo "\nChecking all services health..."
	@curl -s http://localhost:8000/services/health | jq '.' || echo "Services health check failed"

test-footprint: ## Test Footprint service
	curl -X POST http://localhost:8000/api/v1/footprint/analyze \
		-H "Content-Type: application/json" \
		-d '{"github_username": "torvalds"}' | jq '.'

setup: ## Initial setup (copy .env.example to .env)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created. Please edit it with your API keys."; \
	else \
		echo ".env file already exists."; \
	fi

dev: ## Start services in development mode with logs
	docker-compose up --build

prod: ## Start services in production mode (detached)
	docker-compose up -d --build

scale-jobs: ## Scale Job Matcher service to 2 instances
	docker-compose up -d --scale job-matcher-service=2
