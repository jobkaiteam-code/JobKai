import requests
import logging
from typing import List, Dict, Optional
import time

logger = logging.getLogger(__name__)


class RemoteOKAPI:
    """Class to fetch jobs from RemoteOK API (remoteok.com)"""
    
    def __init__(self):
        """Initialize RemoteOK API client"""
        self.base_url = 'https://remoteok.com/api'
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; JobMatcher/1.0)'
        }
        
    def fetch_jobs(self, 
                   keywords: str = None,
                   limit: int = 50) -> List[Dict]:
        """
        Fetch jobs from RemoteOK API
        
        Args:
            keywords: Job keywords to search for (used for filtering)
            limit: Maximum number of results
            
        Returns:
            List of job dictionaries
        """
        try:
            endpoint = f"{self.base_url}"
            
            logger.info(f"Fetching jobs from RemoteOK API for: {keywords}")
            
            # RemoteOK rate limits requests, add small delay
            time.sleep(1)
            
            response = requests.get(endpoint, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # First item is metadata, skip it
            jobs = data[1:] if len(data) > 1 else []
            
            # Filter by keywords if provided
            if keywords:
                keywords_lower = keywords.lower()
                jobs = [
                    job for job in jobs 
                    if keywords_lower in job.get('position', '').lower() 
                    or keywords_lower in job.get('description', '').lower()
                    or any(keywords_lower in tag.lower() for tag in job.get('tags', []))
                ]
            
            # Transform to our standard format
            transformed_jobs = []
            for job in jobs[:limit]:
                transformed_job = self._transform_job(job)
                if transformed_job:
                    transformed_jobs.append(transformed_job)
            
            logger.info(f"Successfully fetched {len(transformed_jobs)} jobs from RemoteOK")
            return transformed_jobs
            
        except requests.exceptions.RequestException as e:
            logger.error(f"RemoteOK API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching from RemoteOK: {e}")
            raise
    
    def _transform_job(self, job: Dict) -> Dict:
        """Transform RemoteOK job format to our standard format"""
        try:
            # Extract salary if available
            salary_min = job.get('salary_min')
            salary_max = job.get('salary_max')
            
            # Extract tags as keywords
            tags = job.get('tags', [])
            
            # Get location (RemoteOK shows specific locations even for remote jobs)
            location = job.get('location', 'Remote')
            if not location or location == 'false':
                location = 'Remote'
            
            # Get company name
            company = job.get('company', 'N/A')
            
            # Build job URL
            job_url = f"https://remoteok.com/remote-jobs/{job.get('slug', '')}" if job.get('slug') else job.get('url', '')
            
            return {
                'job_title': job.get('position', 'N/A'),
                'company_name': company,
                'job_description': job.get('description', 'N/A'),
                'location': location,
                'source': 'remoteok',
                'url': job_url,
                'employment_type': job.get('type', 'Full-time'),
                'remote': True,  # RemoteOK only has remote jobs
                'keywords': tags,
                'time_posted': job.get('date', ''),
                'salary_min': salary_min,
                'salary_max': salary_max,
                'company_logo': job.get('company_logo', ''),
                'apply_url': job.get('apply_url', job_url),
            }
        except Exception as e:
            logger.error(f"Error transforming RemoteOK job: {e}")
            return None
