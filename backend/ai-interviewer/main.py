from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import google.generativeai as genai
import os
from datetime import datetime
import json
import firebase_admin
from firebase_admin import credentials, firestore
from functools import lru_cache

app = FastAPI(title="JobKai AI Interviewer Service", version="1.0.0")

# CORS middleware - Very permissive for public access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Initialize Firebase Admin
try:
    # Try to load from local file first, fallback to environment variable
    firebase_cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT", "jobkai-firebase-adminsdk.json")
    cred = credentials.Certificate(firebase_cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print(f"✅ Firebase initialized successfully from {firebase_cred_path}")
except Exception as e:
    print(f"⚠️  Firebase initialization failed: {e}")
    db = None

# Configure Google AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    print("✅ Google AI configured successfully")
else:
    print("⚠️  GOOGLE_API_KEY not found in environment")

# Pydantic Models
class GenerateInterviewRequest(BaseModel):
    type: str  # "technical" or "behavioral"
    role: str
    level: str  # "junior", "mid", "senior"
    techstack: str
    amount: int
    userid: str

class InterviewQuestion(BaseModel):
    question: str
    category: str

class Interview(BaseModel):
    id: Optional[str] = None
    role: str
    type: str
    level: str
    techstack: List[str]
    questions: List[str]
    userId: str
    finalized: bool
    createdAt: str

class Message(BaseModel):
    role: str
    content: str

class FeedbackRequest(BaseModel):
    interviewId: str
    userId: str
    messages: List[Message]

class CategoryScore(BaseModel):
    name: str
    score: int
    comment: str

class Feedback(BaseModel):
    interviewId: str
    totalScore: int
    categoryScores: List[CategoryScore]
    strengths: List[str]
    areasForImprovement: List[str]
    finalAssessment: str
    createdAt: str

# Helper function to check Firebase availability
def get_db():
    if db is None:
        raise HTTPException(status_code=500, detail="Firebase not initialized")
    return db

@app.get("/")
async def root():
    return {
        "service": "JobKai AI Interviewer Service",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": [
            "/generate - Generate interview questions",
            "/users/{userid}/interviews/{interviewId} - Get interview details",
            "/feedback/create - Generate interview feedback",
            "/users/{userid}/interviews/{interviewId}/feedback - Get feedback",
            "/users/{userid}/interviews - List all interviews"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "firebase": db is not None,
        "google_ai": bool(GOOGLE_API_KEY)
    }

@app.post("/generate")
async def generate_interview(request: GenerateInterviewRequest, database=Depends(get_db)):
    """Generate interview questions - questions will be asked by Vapi AI during voice interview"""
    try:
        print(f"📝 Generating interview for {request.role} - {request.level} level")
        
        # Generate questions based on role, level, and type
        questions = generate_questions_template(
            role=request.role,
            level=request.level,
            techstack=request.techstack,
            interview_type=request.type,
            amount=request.amount
        )
        
        print(f"✅ Generated {len(questions)} questions")
        
        # Save to Firebase
        interview_data = {
            "role": request.role,
            "type": request.type,
            "level": request.level,
            "techstack": [t.strip() for t in request.techstack.split(",")],
            "questions": questions,
            "userId": request.userid,
            "finalized": True,
            "createdAt": datetime.utcnow().isoformat()
        }
        
        doc_ref = database.collection("users").document(request.userid).collection("interviews").add(interview_data)
        interview_id = doc_ref[1].id
        
        print(f"✅ Interview saved with ID: {interview_id}")
        
        return {
            "success": True,
            "interviewId": interview_id,
            "questions": questions
        }
        
    except Exception as e:
        print(f"❌ Error generating interview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_questions_template(role: str, level: str, techstack: str, interview_type: str, amount: int) -> list:
    """Generate interview questions based on template patterns"""
    questions = []
    tech_list = [t.strip() for t in techstack.split(",") if t.strip()]
    
    # Behavioral questions
    behavioral_questions = [
        "Tell me about yourself and your background.",
        "What interests you about this role?",
        "Describe a challenging project you worked on and how you overcame obstacles.",
        "How do you handle tight deadlines and pressure?",
        "Tell me about a time you had to work with a difficult team member.",
        "What are your greatest strengths and weaknesses?",
        "Where do you see yourself in 5 years?",
        "Why are you looking to leave your current position?",
    ]
    
    # Technical questions based on tech stack
    technical_questions = [
        f"What experience do you have with {tech_list[0] if tech_list else 'this technology'}?",
        f"Can you explain a complex {role} problem you solved recently?",
        f"How do you approach debugging and troubleshooting issues?",
        f"What best practices do you follow in {role} development?",
        f"Describe your experience with {tech_list[1] if len(tech_list) > 1 else 'version control'}.",
        f"How do you stay updated with new technologies and industry trends?",
        f"Walk me through your development workflow.",
        f"What testing strategies do you use in your projects?",
    ]
    
    # Level-specific questions
    if level.lower() in ["senior", "lead"]:
        technical_questions.extend([
            "How do you mentor junior developers?",
            "Describe your experience with system architecture and design patterns.",
            "How do you make technical decisions that impact the entire team?",
        ])
    
    # Mix questions based on type
    if interview_type.lower() == "behavioral":
        questions = behavioral_questions[:amount]
    elif interview_type.lower() == "technical":
        questions = technical_questions[:amount]
    else:  # balanced
        half = amount // 2
        questions = behavioral_questions[:half] + technical_questions[:amount - half]
    
    return questions[:amount]

@app.get("/users/{userid}/interviews/{interviewId}")
async def get_interview(userid: str, interviewId: str, database=Depends(get_db)):
    """Get interview details by ID"""
    try:
        doc = database.collection("users").document(userid).collection("interviews").document(interviewId).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        interview_data = doc.to_dict()
        interview_data["id"] = doc.id
        
        return {
            "success": True,
            "interview": interview_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching interview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback/create")
async def create_feedback(request: FeedbackRequest, database=Depends(get_db)):
    """Generate interview feedback using Google Gemini AI"""
    try:
        if not request.messages or len(request.messages) == 0:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        print(f"📝 Creating feedback for interview: {request.interviewId}")
        print(f"💬 Messages received: {len(request.messages)}")
        
        # Format transcript
        formatted_transcript = "\n".join([
            f"- {msg.role}: {msg.content}" for msg in request.messages
        ])
        
        # Use Gemini 2.5 Flash-Lite (newer, more efficient model)
        model = genai.GenerativeModel('gemini-2.0-flash-lite')
        
        prompt = f"""You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. 
Be thorough and detailed in your analysis. Do not be lenient — highlight mistakes and areas to improve.

Transcript:
{formatted_transcript}

Score the candidate from 0–100 for each category and provide detailed feedback.

Return your response in the following JSON format:
{{
  "totalScore": <number 0-100>,
  "categoryScores": [
    {{"name": "Communication Skills", "score": <0-100>, "comment": "detailed comment"}},
    {{"name": "Technical Knowledge", "score": <0-100>, "comment": "detailed comment"}},
    {{"name": "Problem-Solving", "score": <0-100>, "comment": "detailed comment"}},
    {{"name": "Cultural & Role Fit", "score": <0-100>, "comment": "detailed comment"}},
    {{"name": "Confidence & Clarity", "score": <0-100>, "comment": "detailed comment"}}
  ],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasForImprovement": ["area 1", "area 2", "area 3"],
  "finalAssessment": "comprehensive final assessment paragraph"
}}

Be critical, structured, and objective in feedback."""

        response = model.generate_content(prompt)
        feedback_text = response.text.strip()
        
        # Clean up markdown code blocks if present
        if feedback_text.startswith("```json"):
            feedback_text = feedback_text[7:]
        if feedback_text.startswith("```"):
            feedback_text = feedback_text[3:]
        if feedback_text.endswith("```"):
            feedback_text = feedback_text[:-3]
        feedback_text = feedback_text.strip()
        
        # Parse JSON response
        try:
            feedback_obj = json.loads(feedback_text)
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse AI response as JSON: {e}")
            print(f"Response: {feedback_text}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
        
        # Save feedback to Firebase
        feedback_data = {
            "interviewId": request.interviewId,
            "totalScore": feedback_obj.get("totalScore", 0),
            "categoryScores": feedback_obj.get("categoryScores", []),
            "strengths": feedback_obj.get("strengths", []),
            "areasForImprovement": feedback_obj.get("areasForImprovement", []),
            "finalAssessment": feedback_obj.get("finalAssessment", ""),
            "createdAt": datetime.utcnow().isoformat()
        }
        
        doc_ref = database.collection("users").document(request.userId).collection("interviews").document(request.interviewId).collection("feedback").add(feedback_data)
        feedback_id = doc_ref[1].id
        
        print(f"✅ Feedback saved with ID: {feedback_id}")
        
        return {
            "success": True,
            "feedbackId": feedback_id,
            "feedback": feedback_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{userid}/interviews/{interviewId}/feedback")
async def get_feedback(userid: str, interviewId: str, database=Depends(get_db)):
    """Get feedback for an interview"""
    try:
        feedback_docs = database.collection("users").document(userid).collection("interviews").document(interviewId).collection("feedback").limit(1).stream()
        
        feedback_list = list(feedback_docs)
        if not feedback_list:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        feedback_doc = feedback_list[0]
        feedback_data = feedback_doc.to_dict()
        feedback_data["id"] = feedback_doc.id
        
        return {
            "success": True,
            "feedback": feedback_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{userid}/interviews")
async def list_interviews(userid: str, database=Depends(get_db)):
    """List all interviews for a user"""
    try:
        interviews_ref = database.collection("users").document(userid).collection("interviews").order_by("createdAt", direction=firestore.Query.DESCENDING)
        
        interviews = []
        for doc in interviews_ref.stream():
            interview_data = doc.to_dict()
            interview_data["id"] = doc.id
            
            # Try to fetch feedback
            feedback_docs = database.collection("users").document(userid).collection("interviews").document(doc.id).collection("feedback").limit(1).stream()
            feedback_list = list(feedback_docs)
            
            if feedback_list:
                feedback_doc = feedback_list[0]
                interview_data["feedback"] = feedback_doc.to_dict()
                interview_data["feedbackId"] = feedback_doc.id
            
            interviews.append(interview_data)
        
        return {
            "success": True,
            "interviews": interviews
        }
        
    except Exception as e:
        print(f"❌ Error listing interviews: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
