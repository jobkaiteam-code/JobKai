import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JobDetailModal } from "@/components/JobDetailModal";
import { Target, Briefcase, MapPin, DollarSign, Search, FileText, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJobKaiStore } from "@/store/useJobKaiStore";
import { matchJobs } from "@/services/jobKaiAPI";
import type { JobMatch } from "@/store/types";
import { Link } from "react-router-dom";

export default function JobMatcher() {
  const { toast } = useToast();
  
  // Global state
  const uploadedCV = useJobKaiStore((state) => state.uploadedCV);
  const jobMatches = useJobKaiStore((state) => state.jobMatches);
  const isLoading = useJobKaiStore((state) => state.isLoadingJobs);
  const setJobMatches = useJobKaiStore((state) => state.setJobMatches);
  const setIsLoading = useJobKaiStore((state) => state.setIsLoadingJobs);

  // Local state for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleMatchJobs = async () => {
    if (!uploadedCV) {
      toast({
        title: "No CV Uploaded",
        description: "Please upload your CV in the Resume Reviewer page first",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedCV.fileObject) {
      toast({
        title: "CV File Missing",
        description: "Please re-upload your CV in the Resume Reviewer page",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting job matching for:', uploadedCV.fileName);
      console.log('Search params:', { jobTitle, location });
      const matches = await matchJobs(
        uploadedCV.fileObject,
        jobTitle || undefined,
        location || undefined
      );
      console.log('Job matching completed:', matches);
      
      setJobMatches(matches);
      
      toast({
        title: "Job Matching Complete",
        description: `Found ${matches.totalMatches} matching jobs with an average score of ${matches.averageMatchScore.toFixed(0)}%`,
      });
    } catch (error: any) {
      console.error('Job matching error:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: "Matching Failed",
        description: error.response?.data?.message || "Failed to match jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobClick = (job: JobMatch) => {
    setSelectedJob(job);
    setModalOpen(true);
  };

  // Filter jobs by search query
  const filteredJobs = jobMatches?.jobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Job Matcher</h1>
            <p className="text-muted-foreground mt-2">
              AI-powered job recommendations based on your CV
            </p>
          </div>
        </div>

        {/* CV Status & Match Section */}
        <Card className="shadow-soft border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Job Matching
            </CardTitle>
            <CardDescription>
              Find the best job opportunities that match your skills and experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CV Status */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              {uploadedCV ? (
                <>
                  <FileText className="w-5 h-5 text-success mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">CV Uploaded</p>
                    <p className="text-sm text-muted-foreground">{uploadedCV.fileName}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">No CV Uploaded</p>
                    <p className="text-sm text-muted-foreground">
                      Please upload your CV in the Resume Reviewer page first
                    </p>
                    <Link to="/resume-reviewer">
                      <Button variant="link" className="h-auto p-0 mt-2">
                        Go to Resume Reviewer →
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Optional Filters */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title (Optional)</Label>
                <Input
                  id="job-title"
                  placeholder="e.g., Frontend Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Remote, San Francisco"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Match Button */}
            <Button 
              onClick={handleMatchJobs}
              disabled={!uploadedCV || isLoading}
              className="w-full gap-2"
              size="lg"
            >
              <Sparkles className="w-4 h-4" />
              {isLoading ? 'Finding Matches...' : 'Match Jobs'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-foreground">Analyzing your CV and matching with jobs...</span>
              </div>
              <Progress value={66} className="h-2" />
              <p className="text-sm text-muted-foreground">
                This may take a minute as we search across multiple job boards
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Overview Stats */}
      {jobMatches && !isLoading && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{jobMatches.totalMatches}</div>
                <p className="text-xs text-muted-foreground mt-1">Jobs found across platforms</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Match Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {jobMatches.averageMatchScore.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {jobMatches.averageMatchScore >= 80 ? 'Excellent' : jobMatches.averageMatchScore >= 60 ? 'Good' : 'Fair'} compatibility
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {jobMatches.topSkills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Most in-demand skills</p>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title, company, skills, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Job Matches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {filteredJobs.length} Job {filteredJobs.length === 1 ? 'Match' : 'Matches'}
              </h2>
            </div>

            {filteredJobs.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No jobs found matching your search criteria
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredJobs.map((match) => (
                <Card 
                  key={match.id} 
                  className="shadow-soft hover:shadow-medium transition-all cursor-pointer"
                  onClick={() => handleJobClick(match)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-semibold text-foreground">{match.title}</h3>
                          <Badge
                            className={
                              match.matchScore >= 90
                                ? "bg-success text-success-foreground"
                                : match.matchScore >= 75
                                ? "bg-primary text-primary-foreground"
                                : "bg-accent text-accent-foreground"
                            }
                          >
                            {match.matchScore}% Match
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {match.source}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground font-medium mb-3">{match.company}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{match.location}</span>
                          </div>
                          {match.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{match.salary}</span>
                            </div>
                          )}
                          {match.postedDate && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{match.postedDate}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {match.skills && match.skills.slice(0, 6).map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                          {match.skills && match.skills.length > 6 && (
                            <Badge variant="outline">+{match.skills.length - 6} more</Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Profile Match</span>
                            <span className="font-medium text-foreground">{match.matchScore}%</span>
                          </div>
                          <Progress value={match.matchScore} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border">
                      {match.url ? (
                        <Button 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(match.url, '_blank');
                          }}
                        >
                          Apply Now
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1"
                          disabled
                        >
                          Apply Now
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJobClick(match);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Empty State - No matches yet */}
      {!jobMatches && !isLoading && (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ready to Find Your Perfect Job?
            </h3>
            <p className="text-muted-foreground mb-4">
              {uploadedCV 
                ? "Click 'Match Jobs' to discover opportunities tailored to your skills"
                : "Upload your CV in the Resume Reviewer page to get started"}
            </p>
            {!uploadedCV && (
              <Link to="/resume-reviewer">
                <Button>
                  Upload CV
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <JobDetailModal 
        job={selectedJob}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
