import pdfplumber
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from Jobscraping import Jobscraping

# Function to extract text from a PDF CV
def extract_cv_text(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

print("🔍 Extracting CV text...")
candidate_cv = extract_cv_text("racem dammak.pdf")

# Scrape job postings from LinkedIn (Jobscraping.py)
print("🤖 Scraping job postings...")
scraper = Jobscraping()
title = "machine learning"
location = "tunisia"
jobs = scraper.scrape_jobs(title, location)

# Compute embeddings and match jobs
print("🧠 Computing embeddings and matching jobs...")
model = SentenceTransformer('all-MiniLM-L6-v2')
cv_embedding = model.encode([candidate_cv])
job_embeddings = model.encode([job["job_description"] for job in jobs])

similarities = cosine_similarity(cv_embedding, job_embeddings)[0]

for i, job in enumerate(jobs):
    job["score"] = similarities[i]

sorted_jobs = sorted(jobs, key=lambda x: x["score"], reverse=True)

print("🔎 Job Recommendations:")
for job in sorted_jobs:
    print(f"{job['job_title']} | Match Score: {job['score']:.2f}")
    print(f"Description: {job['job_description']}\n")
    with open("job_recommendations.txt", "a", encoding="utf-8") as f:
        f.write(f"{job['job_title']} | Match Score: {job['score']:.2f}\n")
        f.write(f"Description: {job['job_description']}\n\n")