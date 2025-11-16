# Footprint Service

Analyzes developer's online presence including GitHub repositories and StackOverflow activity.

## Port

**8001**

## Features

- GitHub profile statistics
- Repository analysis
- Programming language detection
- StackOverflow reputation and activity

## Quick Start

```bash
# From backend/footprint directory
docker compose up --build
```

## Testing

```bash
# Health check
curl http://localhost:8001/health

# Analyze GitHub profile
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "github_username": "torvalds"
  }'

# Analyze GitHub + StackOverflow
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "github_username": "torvalds",
    "stackoverflow_id": "123456"
  }'
```

## API Documentation

Once running, visit: http://localhost:8001/docs

## No Environment Variables Required

This service uses public APIs and doesn't require API keys.
