# JobKai AI Interviewer Service

Python/FastAPI microservice for AI-powered interview generation and feedback.

## Features

- **Generate Interview Questions**: AI-powered question generation using Google Gemini
- **Interview Management**: Store and retrieve interview sessions
- **Feedback Generation**: Comprehensive interview feedback with scoring
- **Firebase Integration**: Persistent storage of interviews and feedback

## API Endpoints

### Health Check
- `GET /` - Service info
- `GET /health` - Health status

### Interview Generation
- `POST /generate` - Generate interview questions

### Interview Management
- `GET /users/{userid}/interviews` - List all interviews
- `GET /users/{userid}/interviews/{interviewId}` - Get specific interview

### Feedback
- `POST /feedback/create` - Generate interview feedback
- `GET /users/{userid}/interviews/{interviewId}/feedback` - Get feedback

## Setup

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Set Environment Variables**


3. **Run Locally**
```bash
uvicorn main:app --reload --port 8004
```

4. **Run with Docker**
```bash
docker compose up -d
```



Update API Gateway to proxy requests to port 8004.

## Technology Stack

- FastAPI (Web framework)
- Google Generative AI (Gemini 2.0)
- Firebase Admin SDK (Database)
- Pydantic (Data validation)
- Uvicorn (ASGI server)

## Port

Service runs on port **8004**
