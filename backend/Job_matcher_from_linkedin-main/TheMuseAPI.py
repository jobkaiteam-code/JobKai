import requests
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class TheMuseAPI:
    """Class to fetch jobs from The Muse API (themuse.com)"""
    
    def __init__(self):
        """Initialize The Muse API client"""
        self.base_url = 'https://www.themuse.com/api/public'
        
    def fetch_jobs(self, 
                   keywords: str = None,
                   location: str = None,
                   category: str = None,
                   limit: int = 50) -> List[Dict]:
        """
        Fetch jobs from The Muse API
        
        Args:
            keywords: Job keywords to search for
            location: Geographic location
            category: Job category
            limit: Maximum number of results (max 100 per page)
            
        Returns:
            List of job dictionaries
        """
        try:
            endpoint = f"{self.base_url}/jobs"
            params = {
                'page': 0,
                'descending': True
            }
            
            if keywords:
                params['title'] = keywords
            if location:
                params['location'] = location
            if category:
                params['category'] = category
                
            logger.info(f"Fetching jobs from The Muse API for: {keywords}, location: {location}")
            
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            jobs = data.get('results', [])
            
            # Transform to our standard format
            transformed_jobs = []
            for job in jobs[:limit]:
                transformed_job = self._transform_job(job)
                if transformed_job:
                    transformed_jobs.append(transformed_job)
            
            logger.info(f"Successfully fetched {len(transformed_jobs)} jobs from The Muse")
            return transformed_jobs
            
        except requests.exceptions.RequestException as e:
            logger.error(f"The Muse API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching from The Muse: {e}")
            raise
    
    def _transform_job(self, job: Dict) -> Dict:
        """Transform Muse job format to our standard format"""
        try:
            company = job.get('company', {})
            locations = job.get('locations', [])
            location_str = locations[0].get('name', 'Remote') if locations else 'Remote'
            
            # Extract categories/keywords
            categories = job.get('categories', [])
            keywords = [cat.get('name', '') for cat in categories if cat.get('name')]
            
            # Check if remote
            is_remote = any('remote' in loc.get('name', '').lower() for loc in locations)
            
            return {
                'job_title': job.get('name', 'N/A'),
                'company_name': company.get('name', 'N/A'),
                'job_description': job.get('contents', job.get('short_description', 'N/A')),
                'location': location_str,
                'source': 'themuse',
                'url': job.get('refs', {}).get('landing_page', ''),
                'employment_type': job.get('type', 'Full-time'),
                'remote': is_remote,
                'keywords': keywords,
                'time_posted': job.get('publication_date', ''),
                'company_logo': company.get('logo', ''),
            }
        except Exception as e:
            logger.error(f"Error transforming Muse job: {e}")
            return None
    
    def get_categories(self) -> List[str]:
        """Get list of available job categories"""
        try:
            endpoint = f"{self.base_url}/categories"
            response = requests.get(endpoint, timeout=10)
            response.raise_for_status()
            
            categories = response.json().get('results', [])
            return [cat.get('name') for cat in categories]
        except Exception as e:
            logger.error(f"Error fetching categories: {e}")
            return []
    
    def get_locations(self) -> List[str]:
        """Get list of available locations"""
        try:
            endpoint = f"{self.base_url}/locations"
            response = requests.get(endpoint, timeout=10)
            response.raise_for_status()
            
            locations = response.json().get('results', [])
            return [loc.get('name') for loc in locations]
        except Exception as e:
            logger.error(f"Error fetching locations: {e}")
            return []
