// Global State Types for JobKai
// Designed to be scalable for future Firestore/Azure DB integration

export interface User {
  id: string;
  name: string;
  email: string;
  token?: string;
  createdAt?: string;
}

export interface UploadedCV {
  fileName: string;
  fileObject: File | null; // Temporary client-side storage
  fileUrl?: string; // URL.createObjectURL for preview
  fileType: string; // 'application/pdf' or 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  lastModified: number;
  uploadedAt: string; // ISO timestamp
}

export interface ResumeAnalysis {
  score: number;
  missingSections: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  analyzedAt: string;
  improvedPDFPath?: string; // Path to improved resume if generated
}

export interface FootprintData {
  username: string;
  platform: 'github' | 'stackoverflow' | 'both';
  github?: {
    followers: number;
    repositories: number;
    stars: number;
    topLanguages: { name: string; percentage: number }[];
    contributions: number;
  };
  stackoverflow?: {
    reputation: number;
    badges: { gold: number; silver: number; bronze: number };
    answers: number;
    questions: number;
  };
  footprintScore: number;
  skills: string[];
  analyzedAt: string;
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  matchScore: number; // 0-100
  skills: string[];
  description: string;
  url?: string;
  postedDate?: string;
  source: 'remoteok' | 'themuse' | 'findwork' | 'linkedin';
}

export interface JobMatchResults {
  jobs: JobMatch[];
  totalMatches: number;
  averageMatchScore: number;
  topSkills: string[];
  matchedAt: string;
}

export interface DashboardStats {
  totalJobMatches: number;
  resumeScore: number;
  footprintScore: number;
  applicationsReviewed: number;
  lastActivity: string;
}
