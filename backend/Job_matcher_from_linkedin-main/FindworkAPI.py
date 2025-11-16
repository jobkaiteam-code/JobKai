import requests
import os
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class FindworkAPI:
    """Class to fetch jobs from Findwork API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Findwork API client
        
        Args:
            api_key: Findwork API key. If not provided, will try to get from environment variable
        """
        self.api_key = api_key or os.getenv('FINDWORK_API_KEY', 'b5c1afd49df06777083254e74a4ed56ae7798f75')
        self.base_url = 'https://findwork.dev/api'
        
    def fetch_jobs(self, 
                   search: str = None,
                   location: str = None,
                   remote: bool = None,
                   employment_type: str = None,
                   sort_by: str = 'relevance',
                   page: int = 1) -> List[Dict]:
        """
        Fetch jobs from Findwork API
        
        Args:
            search: Job title or keywords to search for
            location: Geographic location for job search
            remote: Filter for remote jobs
            employment_type: Type of employment (full time, part time, etc.)
            sort_by: Sort order (relevance, date, salary)
            page: Page number for pagination
            
        Returns:
            List of job dictionaries
        """
        headers = {
            'Authorization': f'Token {self.api_key}',
            'Content-Type': 'application/json',
        }
        
        params = {}
        if search:
            params['search'] = search
        if location:
            params['location'] = location
        if remote is not None:
            params['remote'] = 'true' if remote else 'false'
        if employment_type:
            params['employment_type'] = employment_type
        if sort_by:
            params['sort_by'] = sort_by
        if page:
            params['page'] = page
            
        try:
            response = requests.get(
                f'{self.base_url}/jobs/',
                headers=headers,
                params=params,
                timeout=5  # Reduce timeout from 10 to 5 seconds
            )
            response.raise_for_status()
            data = response.json()
            
            # Transform Findwork API response to match our job format
            jobs = []
            for job in data.get('results', []):
                transformed_job = {
                    'job_title': job.get('role'),
                    'company_name': job.get('company_name'),
                    'job_description': job.get('description', ''),
                    'location': job.get('location'),
                    'remote': job.get('remote', False),
                    'employment_type': job.get('employment_type'),
                    'url': job.get('url'),
                    'time_posted': job.get('date_posted'),
                    'salary_min': job.get('salary_min'),
                    'salary_max': job.get('salary_max'),
                    'keywords': job.get('keywords', []),
                    'source': 'findwork',  # Add source identifier
                    'job_id': job.get('id')
                }
                jobs.append(transformed_job)
                
            return jobs
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Findwork API error: {str(e)}")
            raise  # Re-raise the exception instead of returning empty list
    
    def get_job_details(self, job_id: int) -> Optional[Dict]:
        """
        Get details for a specific job
        
        Args:
            job_id: The Findwork job ID
            
        Returns:
            Job details dictionary or None if not found
        """
        headers = {
            'Authorization': f'Token {self.api_key}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.get(
                f'{self.base_url}/jobs/{job_id}/',
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            job = response.json()
            
            return {
                'job_title': job.get('role'),
                'company_name': job.get('company_name'),
                'job_description': job.get('description', ''),
                'location': job.get('location'),
                'remote': job.get('remote', False),
                'employment_type': job.get('employment_type'),
                'url': job.get('url'),
                'time_posted': job.get('date_posted'),
                'salary_min': job.get('salary_min'),
                'salary_max': job.get('salary_max'),
                'keywords': job.get('keywords', []),
                'source': 'findwork',
                'job_id': job.get('id')
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching job details: {str(e)}")
            return None
