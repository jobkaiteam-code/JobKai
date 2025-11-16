from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from collections import Counter

app = FastAPI(title="JobKai Footprint Service")

# Add CORS middleware - Very permissive for public access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

class FootprintRequest(BaseModel):
    github_username: str | None = None
    stackoverflow_id: str | None = None

GITHUB_USER_API = "https://api.github.com/users/{username}"
GITHUB_REPOS_API = "https://api.github.com/users/{username}/repos?per_page=100"
STACKOVERFLOW_API = "https://api.stackexchange.com/2.3/users/{id}?order=desc&sort=reputation&site=stackoverflow"

@app.get("/health")
def health():
    return {"status": "ok"}

def calculate_language_percentages(repos_data):
    """Calculate language usage percentages from repositories"""
    language_counts = Counter()
    
    for repo in repos_data:
        language = repo.get("language")
        if language:
            language_counts[language] += 1
    
    total_repos = sum(language_counts.values())
    if total_repos == 0:
        return []
    
    # Convert to percentages and format
    top_languages = []
    for language, count in language_counts.most_common(5):  # Top 5 languages
        percentage = round((count / total_repos) * 100, 1)
        top_languages.append({
            "name": language,
            "percentage": percentage
        })
    
    return top_languages

@app.post("/analyze")
async def analyze_footprint(request: FootprintRequest):
    result = {
        "username": request.github_username or request.stackoverflow_id,
        "skills": []
    }
    
    async with httpx.AsyncClient(timeout=20) as client:
        # GitHub profile
        if request.github_username:
            try:
                user_resp = await client.get(GITHUB_USER_API.format(username=request.github_username))
                user_resp.raise_for_status()
                user_data = user_resp.json()
                
                repos_resp = await client.get(GITHUB_REPOS_API.format(username=request.github_username))
                repos_resp.raise_for_status()
                repos_data = repos_resp.json()

                # Calculate total stars and contributions
                total_stars = sum(repo.get("stargazers_count", 0) for repo in repos_data)
                total_forks = sum(repo.get("forks_count", 0) for repo in repos_data)
                
                # Get top languages with percentages
                top_languages = calculate_language_percentages(repos_data)
                
                # Collect unique skills from repositories
                skills_set = set()
                for repo in repos_data:
                    if repo.get("language"):
                        skills_set.add(repo.get("language"))
                
                result["github"] = {
                    "public_repos": user_data.get("public_repos", 0),
                    "followers": user_data.get("followers", 0),
                    "following": user_data.get("following", 0),
                    "total_stars": total_stars,
                    "total_forks": total_forks,
                    "top_languages": top_languages,
                    "total_contributions": total_stars + total_forks,  # Simplified metric
                    "created_at": user_data.get("created_at"),
                    "profile_url": user_data.get("html_url")
                }
                
                result["skills"].extend(list(skills_set))
                
            except httpx.HTTPError as e:
                result["github"] = {"error": f"GitHub fetch error: {str(e)}"}

        # Stack Overflow
        if request.stackoverflow_id:
            try:
                so_resp = await client.get(STACKOVERFLOW_API.format(id=request.stackoverflow_id))
                so_resp.raise_for_status()
                so_data = so_resp.json()
                user = so_data["items"][0] if so_data.get("items") else {}
                
                result["stackoverflow"] = {
                    "reputation": user.get("reputation", 0),
                    "answer_count": user.get("answer_count", 0),
                    "question_count": user.get("question_count", 0),
                    "badges": user.get("badge_counts", {"gold": 0, "silver": 0, "bronze": 0}),
                    "profile_url": user.get("link")
                }
            except httpx.HTTPError as e:
                result["stackoverflow"] = {"error": f"Stack Overflow fetch error: {str(e)}"}

    return result
