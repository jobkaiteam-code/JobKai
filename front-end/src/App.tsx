import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ResumeReviewer from "./pages/ResumeReviewer";
import JobMatcher from "./pages/JobMatcher";
import AIInterviewer from "./pages/AIInterviewer";
import FootprintScanner from "./pages/FootprintScanner";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-reviewer"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ResumeReviewer />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/job-matcher"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <JobMatcher />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-interviewer"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AIInterviewer />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/footprint-scanner"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <FootprintScanner />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
