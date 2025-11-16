import apiClient, { createFormData, downloadFile } from './apiClient';
import type {
  ResumeAnalysis,
  FootprintData,
  JobMatchResults,
  JobMatch,
} from '@/store/types';

// ==========================================
// API Response Types (backend-specific)
// ==========================================

interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

interface ServiceHealthResponse {
  gateway: { status: string; timestamp: string };
  footprint: { status: string; available: boolean };
  resume: { status: string; available: boolean };
  job_matcher: { status: string; available: boolean };
}

interface ResumeAnalysisResponse {
  success: boolean;
  score: number;
  level: string;
  sections_detected: Record<string, boolean>;
  sections_missing: string[];
  contact_info: Record<string, any>;
  high_priority_issues: Array<{ 
    priority: string;
    category: string;
    issue: string; 
    recommendation: string;
  }>;
  medium_priority_issues: Array<{ 
    priority: string;
    category: string;
    issue: string; 
    recommendation: string;
  }>;
  statistics: {
    word_count: number;
    estimated_pages: number;
    experience_years: number;
    strong_verbs_count: number;
    weak_verbs_count: number;
    metrics_count: number;
    bullet_points: number;
  };
  timestamp: string;
}

interface FootprintAnalysisResponse {
  username: string;
  github?: {
    followers: number;
    public_repos: number;
    total_stars: number;
    top_languages: { name: string; percentage: number }[];
    total_contributions: number;
  };
  stackoverflow?: {
    reputation: number;
    badges: { gold: number; silver: number; bronze: number };
    answer_count: number;
    question_count: number;
  };
  footprint_score: number;
  skills: string[];
}

interface JobMatchResponse {
  matches: Array<{
    job_title?: string;
    company_name?: string;
    job_description?: string;
    time_posted?: string;
    num_applicants?: string;
    location?: string;
    remote?: boolean;
    employment_type?: string;
    url?: string;
    salary_min?: number;
    salary_max?: number;
    keywords?: string[];
    source: string;
    match_score: number;
  }>;
  total_jobs: number;
  themuse_jobs_count: number;
  remoteok_jobs_count: number;
  findwork_jobs_count: number;
  linkedin_jobs_count: number;
  cv_summary: string;
}

// ==========================================
// API Service Class
// ==========================================

class JobKaiAPI {
  // Health Check
  async checkHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  }

  async checkServicesHealth(): Promise<ServiceHealthResponse> {
    const response = await apiClient.get<ServiceHealthResponse>('/services/health');
    return response.data;
  }

  // ==========================================
  // Footprint Service
  // ==========================================
  async analyzeFootprint(
    githubUsername: string,
    stackoverflowId?: string
  ): Promise<FootprintData> {
    const response = await apiClient.post<FootprintAnalysisResponse>(
      '/api/v1/footprint/analyze',
      {
        github_username: githubUsername,
        stackoverflow_id: stackoverflowId,
      }
    );

    const data = response.data;

    // Transform backend response to frontend format with safe defaults
    return {
      username: data.username || githubUsername,
      platform: data.github && data.stackoverflow ? 'both' : data.github ? 'github' : 'stackoverflow',
      github: data.github
        ? {
            followers: data.github.followers || 0,
            repositories: data.github.public_repos || 0,
            stars: data.github.total_stars || 0,
            topLanguages: data.github.top_languages || [],
            contributions: data.github.total_contributions || 0,
          }
        : undefined,
      stackoverflow: data.stackoverflow
        ? {
            reputation: data.stackoverflow.reputation || 0,
            badges: data.stackoverflow.badges || { gold: 0, silver: 0, bronze: 0 },
            answers: data.stackoverflow.answer_count || 0,
            questions: data.stackoverflow.question_count || 0,
          }
        : undefined,
      footprintScore: 0, // Removed footprint score calculation
      skills: data.skills || [],
      analyzedAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // Resume Service
  // ==========================================
  async analyzeResume(file: File): Promise<ResumeAnalysis> {
    const formData = createFormData(file);

    const response = await apiClient.post<ResumeAnalysisResponse>(
      '/api/v1/resume/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = response.data;

    console.log('Backend analysis response:', data);

    // Transform backend response to frontend format
    // Extract strengths from statistics
    const strengths: string[] = [];
    if (data.statistics?.strong_verbs_count > 0) {
      strengths.push(`Uses ${data.statistics.strong_verbs_count} strong action verbs`);
    }
    if (data.statistics?.metrics_count > 0) {
      strengths.push(`Contains ${data.statistics.metrics_count} quantifiable achievements`);
    }
    if (data.statistics?.experience_years > 0) {
      strengths.push(`${data.statistics.experience_years} years of experience documented`);
    }

    // Extract weaknesses from high priority issues
    const weaknesses = (data.high_priority_issues || [])
      .map(issue => issue.issue)
      .filter(text => text && text.trim().length > 0);

    // Extract recommendations from both priority levels, filtering out empty ones
    const recommendations = [
      ...(data.high_priority_issues || []).map(issue => issue.recommendation),
      ...(data.medium_priority_issues || []).map(issue => issue.recommendation),
    ].filter(text => text && text.trim().length > 0);

    console.log('Transformed recommendations:', recommendations);

    return {
      score: data.score || 0,
      missingSections: data.sections_missing || [],
      strengths,
      weaknesses,
      recommendations,
      analyzedAt: data.timestamp || new Date().toISOString(),
    };
  }

  async improveResume(file: File): Promise<Blob> {
    const formData = createFormData(file);

    console.log('Step 1: Calling improve endpoint...');
    // First, call the improve endpoint to generate the PDF
    const response = await apiClient.post<{
      success: boolean;
      pdf_generated: boolean;
      files: {
        pdf_url: string | null;
      };
    }>(
      '/api/v1/resume/improve',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('Step 2: Improve response received:', response.data);

    // Check if PDF was generated
    if (!response.data.pdf_generated || !response.data.files.pdf_url) {
      console.error('PDF generation failed:', response.data);
      throw new Error('PDF generation failed. The improved resume was not generated successfully.');
    }

    // The download URL needs to go through the gateway proxy
    // Convert /api/v1/download/{timestamp}/pdf to /api/v1/resume/download/{timestamp}/pdf
    const downloadPath = response.data.files.pdf_url.replace('/api/v1/download/', '/api/v1/resume/download/');

    console.log('Step 3: Downloading PDF from:', downloadPath);
    // Download the generated PDF through gateway
    const pdfResponse = await apiClient.get(downloadPath, {
      responseType: 'blob',
    });

    console.log('Step 4: PDF downloaded successfully, size:', pdfResponse.data.size);
    return pdfResponse.data;
  }

  async downloadImprovedResume(file: File, filename: string = 'improved_resume.pdf'): Promise<void> {
    const blob = await this.improveResume(file);
    downloadFile(blob, filename);
  }

  // ==========================================
  // Job Matcher Service
  // ==========================================
  async matchJobs(
    cvFile: File,
    jobTitle?: string,
    location?: string
  ): Promise<JobMatchResults> {
    const formData = createFormData(
      cvFile,
      {
        job_title: jobTitle || '',  // Always send, even if empty
        location: location || '',    // Always send, even if empty
      },
      'cv_file' // Use the correct field name expected by the backend
    );

    const response = await apiClient.post<JobMatchResponse>(
      '/api/v1/jobs/match',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = response.data;

    // Transform backend response to frontend format with safe defaults
    const jobs: JobMatch[] = (data.matches || []).map((job: any) => ({
      id: job.job_id || job.url || String(Date.now() + Math.random()),
      title: job.job_title || job.title || 'Unknown Position',
      company: job.company_name || job.company || 'Unknown Company',
      location: job.location || 'Unknown Location',
      salary: job.salary_min && job.salary_max 
        ? `$${job.salary_min}-$${job.salary_max}` 
        : job.salary,
      matchScore: (job.match_score || 0) * 100, // Convert 0-1 to 0-100
      skills: job.keywords || job.required_skills || [],
      description: job.job_description || job.description || 'No description available',
      url: job.url,
      postedDate: job.time_posted || job.posted_date,
      source: job.source as any,
    }));

    // Calculate average match score from jobs
    const avgScore = jobs.length > 0
      ? jobs.reduce((sum, job) => sum + job.matchScore, 0) / jobs.length
      : 0;

    // Extract top skills from all jobs
    const allSkills = jobs.flatMap(job => job.skills);
    const skillCounts = allSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill]) => skill);

    return {
      jobs,
      totalMatches: data.total_jobs || jobs.length,
      averageMatchScore: avgScore,
      topSkills: topSkills,
      matchedAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const jobKaiAPI = new JobKaiAPI();

// Export individual methods with proper binding
export const checkHealth = jobKaiAPI.checkHealth.bind(jobKaiAPI);
export const checkServicesHealth = jobKaiAPI.checkServicesHealth.bind(jobKaiAPI);
export const analyzeFootprint = jobKaiAPI.analyzeFootprint.bind(jobKaiAPI);
export const analyzeResume = jobKaiAPI.analyzeResume.bind(jobKaiAPI);
export const improveResume = jobKaiAPI.improveResume.bind(jobKaiAPI);
export const downloadImprovedResume = jobKaiAPI.downloadImprovedResume.bind(jobKaiAPI);
export const matchJobs = jobKaiAPI.matchJobs.bind(jobKaiAPI);
