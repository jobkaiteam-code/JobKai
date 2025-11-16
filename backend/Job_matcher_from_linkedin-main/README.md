# LinkedIn Job Scraper and Matcher - FastAPI

This project scrapes job postings from LinkedIn based on job title and location, and matches them to a candidate's CV using natural language processing to recommend the best job matches. Now available as a **FastAPI REST API** with **Docker support** for easy integration into your applications!

## Features

- **FastAPI REST API**: Modern, fast API endpoints for job matching
- **Job Scraping**: Scrapes job postings from LinkedIn using web scraping techniques
- **AI-Powered Matching**: Uses sentence embeddings (all-MiniLM-L6-v2) and cosine similarity to match job descriptions with CVs
- **Docker Support**: Fully containerized for easy deployment
- **PDF CV Processing**: Upload PDF CVs via API for instant matching
- **Health Checks**: Built-in health monitoring endpoints

## Requirements

- **For Docker (Recommended)**:
  - Docker
  - Docker Compose

- **For Local Development**:
  - Python 3.11+
  - Libraries: FastAPI, uvicorn, requests, beautifulsoup4, pandas, pdfplumber, sentence-transformers, scikit-learn

## Quick Start with Docker

### 1. Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The API will be available at `http://localhost:8000`

### 2. View API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 3. Stop the Container

```bash
docker-compose down
```

## Docker Commands

### Build Docker Image Manually

```bash
docker build -t job-matcher-api .
```

### Run Container Manually

```bash
docker run -p 8000:8000 job-matcher-api
```

## Local Installation (Without Docker)

1. Clone the repository or download the files
2. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the API:
   ```bash
   python app.py
   # or
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Health Check
```http
GET /health
```
Returns the health status of the API and model loading state.

### Match Jobs with CV
```http
POST /api/v1/match-jobs
Content-Type: multipart/form-data
```

**Parameters:**
- `cv_file` (file, required): PDF file containing the candidate's CV
- `job_title` (string, required): Job title/keywords to search for
- `location` (string, required): Geographic location for job search
- `top_n` (integer, optional): Number of top matches to return (default: 10)

**Example using cURL:**
```bash
curl -X POST "http://localhost:8000/api/v1/match-jobs" \
  -F "cv_file=@/path/to/resume.pdf" \
  -F "job_title=machine learning engineer" \
  -F "location=tunisia" \
  -F "top_n=5"
```

**Example using Python:**
```python
import requests

url = "http://localhost:8000/api/v1/match-jobs"
files = {"cv_file": open("resume.pdf", "rb")}
data = {
    "job_title": "machine learning engineer",
    "location": "tunisia",
    "top_n": 5
}

response = requests.post(url, files=files, data=data)
print(response.json())
```

**Response:**
```json
{
  "matches": [
    {
      "job_title": "Machine Learning Engineer",
      "company_name": "Tech Company",
      "job_description": "...",
      "time_posted": "2 days ago",
      "num_applicants": "50 applicants",
      "match_score": 0.85
    }
  ],
  "total_jobs": 25,
  "cv_summary": "First 200 characters of CV..."
}
```

### Scrape Jobs (Without CV Matching)
```http
POST /api/v1/scrape-jobs
Content-Type: application/json
```

**Request Body:**
```json
{
  "job_title": "software engineer",
  "location": "san francisco"
}
```

**Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/scrape-jobs" \
  -H "Content-Type: application/json" \
  -d '{"job_title": "data scientist", "location": "new york"}'
```

## Usage Examples

### Using the Original Scripts

The original functionality is still available:

#### Job Scraping
- Use the `main.ipynb` Jupyter notebook to scrape jobs interactively
- Or use the `Jobscraping` class in `Jobscraping.py`:
  ```python
  from Jobscraping import Jobscraping
  scraper = Jobscraping()
  jobs = scraper.scrape_jobs("Machine Learning Engineer", "Tunisia")
  ```

#### Job Matching
- Run `job_matcher.py` to match jobs to a CV
- Ensure you have a PDF CV file (currently hardcoded as "racem dammak.pdf")
- The script will output job recommendations sorted by match score

## Project Structure

```
.
├── app.py                      # FastAPI application
├── Jobscraping.py             # LinkedIn job scraper class
├── job_matcher.py             # Original standalone matcher script
├── main.ipynb                 # Jupyter notebook for testing
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker container definition
├── docker-compose.yml         # Docker Compose configuration
├── .dockerignore             # Docker build exclusions
└── README.md                  # This file
```

## Integration into Your App

### Example: React/Next.js Frontend

```javascript
async function matchJobs(cvFile, jobTitle, location) {
  const formData = new FormData();
  formData.append('cv_file', cvFile);
  formData.append('job_title', jobTitle);
  formData.append('location', location);
  formData.append('top_n', 10);

  const response = await fetch('http://localhost:8000/api/v1/match-jobs', {
    method: 'POST',
    body: formData
  });

  return await response.json();
}
```

### Example: Mobile App (Flutter/React Native)

```dart
// Flutter example
Future<Map<String, dynamic>> matchJobs(File cvFile, String jobTitle, String location) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://localhost:8000/api/v1/match-jobs'),
  );
  
  request.files.add(await http.MultipartFile.fromPath('cv_file', cvFile.path));
  request.fields['job_title'] = jobTitle;
  request.fields['location'] = location;
  
  var response = await request.send();
  var responseData = await response.stream.bytesToString();
  return jsonDecode(responseData);
}
```

## Environment Variables

You can configure the following environment variables:

- `PORT`: API port (default: 8000)
- `HOST`: API host (default: 0.0.0.0)

## Deployment

### Deploy to Cloud

The containerized application can be easily deployed to:

- **AWS**: ECS, Fargate, or EC2
- **Google Cloud**: Cloud Run, GKE
- **Azure**: Container Instances, AKS
- **Heroku**: Using container deployment
- **DigitalOcean**: App Platform or Droplets

### Example: Deploy to Google Cloud Run

```bash
# Build and tag
docker build -t gcr.io/your-project/job-matcher-api .

# Push to Google Container Registry
docker push gcr.io/your-project/job-matcher-api

# Deploy
gcloud run deploy job-matcher-api \
  --image gcr.io/your-project/job-matcher-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Performance Considerations

- **First Request**: The first API call may take longer (~30-40 seconds) as the AI model loads into memory
- **Subsequent Requests**: Fast response times after initial model loading
- **Memory**: Requires ~2GB RAM for the sentence transformer model
- **Scaling**: Stateless design allows horizontal scaling

## Notes

- LinkedIn's structure may change, so the scraping selectors might need updates
- This is for educational purposes; respect LinkedIn's terms of service
- The API uses the `all-MiniLM-L6-v2` model for efficient embedding generation
- Health checks are built into the Docker container for monitoring

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs -f
```

### Port already in use
```bash
# Change port in docker-compose.yml
ports:
  - "8001:8000"  # Change 8001 to any available port
```

### Model loading issues
The model downloads on first run. Ensure you have:
- Stable internet connection
- Sufficient disk space (~500MB for model)

## Authors

Yasmine & Racem

## License

For educational purposes only. Please respect LinkedIn's terms of service and API usage policies.

