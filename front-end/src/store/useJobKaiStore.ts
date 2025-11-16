import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  User,
  UploadedCV,
  ResumeAnalysis,
  FootprintData,
  JobMatchResults,
  DashboardStats,
} from './types';

interface JobKaiStore {
  // User State
  user: User | null;
  setUser: (user: User | null) => void;

  // CV State
  uploadedCV: UploadedCV | null;
  setUploadedCV: (cv: UploadedCV | null) => void;

  // Resume Analysis State
  resumeAnalysis: ResumeAnalysis | null;
  setResumeAnalysis: (analysis: ResumeAnalysis | null) => void;

  // Footprint State
  footprintData: FootprintData | null;
  setFootprintData: (data: FootprintData | null) => void;

  // Job Matches State
  jobMatches: JobMatchResults | null;
  setJobMatches: (matches: JobMatchResults | null) => void;

  // Dashboard Stats (aggregated)
  dashboardStats: DashboardStats | null;
  setDashboardStats: (stats: DashboardStats | null) => void;

  // Loading States
  isLoadingResume: boolean;
  isLoadingJobs: boolean;
  isLoadingFootprint: boolean;
  setIsLoadingResume: (loading: boolean) => void;
  setIsLoadingJobs: (loading: boolean) => void;
  setIsLoadingFootprint: (loading: boolean) => void;

  // Reset Functions (for logout or data cleanup)
  resetResumeData: () => void;
  resetJobData: () => void;
  resetFootprintData: () => void;
  resetAllData: () => void;
}

// Create the store with persistence
// Note: File objects cannot be serialized to localStorage, so we handle them separately
export const useJobKaiStore = create<JobKaiStore>()(
  persist(
    (set) => ({
      // Initial State
      user: null,
      uploadedCV: null,
      resumeAnalysis: null,
      footprintData: null,
      jobMatches: null,
      dashboardStats: null,
      isLoadingResume: false,
      isLoadingJobs: false,
      isLoadingFootprint: false,

      // User Actions
      setUser: (user) => set({ user }),

      // CV Actions
      setUploadedCV: (cv) => {
        // Store CV metadata, but File object is kept in memory only
        set({ uploadedCV: cv });
      },

      // Resume Analysis Actions
      setResumeAnalysis: (analysis) => set({ resumeAnalysis: analysis }),

      // Footprint Actions
      setFootprintData: (data) => set({ footprintData: data }),

      // Job Matches Actions
      setJobMatches: (matches) => set({ jobMatches: matches }),

      // Dashboard Actions
      setDashboardStats: (stats) => set({ dashboardStats: stats }),

      // Loading Actions
      setIsLoadingResume: (loading) => set({ isLoadingResume: loading }),
      setIsLoadingJobs: (loading) => set({ isLoadingJobs: loading }),
      setIsLoadingFootprint: (loading) => set({ isLoadingFootprint: loading }),

      // Reset Actions
      resetResumeData: () =>
        set({
          uploadedCV: null,
          resumeAnalysis: null,
          isLoadingResume: false,
        }),

      resetJobData: () =>
        set({
          jobMatches: null,
          isLoadingJobs: false,
        }),

      resetFootprintData: () =>
        set({
          footprintData: null,
          isLoadingFootprint: false,
        }),

      resetAllData: () =>
        set({
          uploadedCV: null,
          resumeAnalysis: null,
          footprintData: null,
          jobMatches: null,
          dashboardStats: null,
          isLoadingResume: false,
          isLoadingJobs: false,
          isLoadingFootprint: false,
        }),
    }),
    {
      name: 'jobkai-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Exclude File objects from persistence (they can't be serialized)
      partialize: (state) => ({
        user: state.user,
        // Don't persist fileObject, only metadata
        uploadedCV: state.uploadedCV
          ? {
              ...state.uploadedCV,
              fileObject: null, // Exclude File object from localStorage
              fileUrl: undefined, // Exclude blob URL from localStorage
            }
          : null,
        resumeAnalysis: state.resumeAnalysis,
        footprintData: state.footprintData,
        jobMatches: state.jobMatches,
        dashboardStats: state.dashboardStats,
      }),
    }
  )
);

// Selector hooks for better performance (optional, but recommended)
export const useUser = () => useJobKaiStore((state) => state.user);
export const useUploadedCV = () => useJobKaiStore((state) => state.uploadedCV);
export const useResumeAnalysis = () => useJobKaiStore((state) => state.resumeAnalysis);
export const useFootprintData = () => useJobKaiStore((state) => state.footprintData);
export const useJobMatches = () => useJobKaiStore((state) => state.jobMatches);
export const useDashboardStats = () => useJobKaiStore((state) => state.dashboardStats);
