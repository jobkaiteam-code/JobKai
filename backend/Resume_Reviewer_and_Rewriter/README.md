# Resume Reviewer Service

AI-powered resume analysis and improvement using Groq API, spaCy, and LaTeX.

## Port

**8002**

## Requirements

- **GROQ_API_KEY** - Get from https://console.groq.com/

## Features

- PDF resume parsing
- AI-powered content analysis
- Resume scoring and recommendations
- LaTeX/PDF generation
- Section detection and validation
- Skills extraction

## Quick Start

```bash
# From backend/Resume_Reviewer_and_Rewriter directory

# 1. Create .env file
echo "GROQ_API_KEY=your_groq_api_key_here" > .env

# 2. Start service
docker compose up --build
```

## Testing

```bash
# Health check
curl http://localhost:8002/health

# Analyze resume
curl -X POST http://localhost:8002/api/v1/analyze \
  -F "file=@path/to/resume.pdf"

# Improve resume
curl -X POST http://localhost:8002/api/v1/improve \
  -F "file=@path/to/resume.pdf" \
  -F "job_description=Senior Software Engineer"
```

## API Documentation

Once running, visit: http://localhost:8002/docs

## Volumes

- `temp_files/` - Temporary uploaded files
- `generated_resumes/` - Generated LaTeX/PDF files

## Environment Variables

Create `.env` file in this directory:
```bash
GROQ_API_KEY=your_groq_api_key_here
```
