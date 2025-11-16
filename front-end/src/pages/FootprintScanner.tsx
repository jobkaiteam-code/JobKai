import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Github, Code, Star, GitFork, Activity, Users, Award, MessageSquare, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJobKaiStore } from "@/store/useJobKaiStore";
import { analyzeFootprint } from "@/services/jobKaiAPI";

export default function FootprintScanner() {
  const { toast } = useToast();
  
  // Global state
  const footprintData = useJobKaiStore((state) => state.footprintData);
  const isLoading = useJobKaiStore((state) => state.isLoadingFootprint);
  const setFootprintData = useJobKaiStore((state) => state.setFootprintData);
  const setIsLoading = useJobKaiStore((state) => state.setIsLoadingFootprint);

  // Local state
  const [githubUsername, setGithubUsername] = useState("");
  const [stackoverflowId, setStackoverflowId] = useState("");

  const handleScan = async () => {
    if (!githubUsername.trim() && !stackoverflowId.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter at least a GitHub username or StackOverflow ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting footprint analysis:', { githubUsername, stackoverflowId });
      const data = await analyzeFootprint(
        githubUsername.trim() || undefined,
        stackoverflowId.trim() || undefined
      );
      console.log('Footprint analysis completed:', data);
      
      setFootprintData(data);
      
      toast({
        title: "Scan Complete",
        description: `Found ${data.skills.length} skills from your developer profile`,
      });
    } catch (error: any) {
      console.error('Footprint analysis error:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: "Scan Failed",
        description: error.response?.data?.message || "Failed to analyze footprint. Please check your usernames and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Footprint Scanner</h1>
        <p className="text-muted-foreground mt-2">
          Analyze your online developer presence across platforms
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scan Configuration */}
        <Card className="shadow-soft lg:col-span-1">
          <CardHeader>
            <CardTitle>Connect Accounts</CardTitle>
            <CardDescription>Link your developer profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Username</Label>
              <div className="flex gap-2">
                <Input 
                  id="github" 
                  placeholder="e.g., torvalds"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  disabled={isLoading}
                />
                <Button variant="outline" size="icon" disabled>
                  <Github className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stackoverflow">StackOverflow ID (Optional)</Label>
              <div className="flex gap-2">
                <Input 
                  id="stackoverflow" 
                  placeholder="e.g., 12345"
                  value={stackoverflowId}
                  onChange={(e) => setStackoverflowId(e.target.value)}
                  disabled={isLoading}
                />
                <Button variant="outline" size="icon" disabled>
                  <Code className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleScan}
              disabled={isLoading || (!githubUsername.trim() && !stackoverflowId.trim())}
            >
              {isLoading ? "Scanning..." : "Scan Footprint"}
            </Button>

            {footprintData && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Last scanned:</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(footprintData.analyzedAt).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary animate-pulse" />
                    <span className="text-foreground">Analyzing your developer footprint...</span>
                  </div>
                  <Progress value={66} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Fetching profile data, repositories, and contributions
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footprint Overview */}
          {footprintData && !isLoading && (
            <>
              {/* Profile Overview */}
              <Card className="shadow-soft border-2 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-foreground mb-1">
                        {footprintData.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Developer profile analysis complete
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {footprintData.github && (
                        <Badge variant="secondary" className="text-sm">
                          <Github className="w-3 h-3 mr-1" />
                          GitHub
                        </Badge>
                      )}
                      {footprintData.stackoverflow && (
                        <Badge variant="secondary" className="text-sm">
                          <Code className="w-3 h-3 mr-1" />
                          StackOverflow
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                {footprintData.github && (
                  <>
                    <Card className="shadow-soft">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Contributions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {(footprintData.github.contributions || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total commits</p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-soft">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Github className="w-4 h-4" />
                          Repositories
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {footprintData.github.repositories}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Public repos</p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-soft">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Stars
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                          {(footprintData.github.stars || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total stars earned</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* GitHub Stats */}
              {footprintData.github && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Github className="w-5 h-5" />
                      GitHub Profile
                    </CardTitle>
                    <CardDescription>
                      @{footprintData.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Followers
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {(footprintData.github.followers || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <GitFork className="w-4 h-4" />
                          Public Repos
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {(footprintData.github.repositories || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Top Languages */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Top Languages</h4>
                      <div className="space-y-3">
                        {footprintData.github.topLanguages && footprintData.github.topLanguages.map((lang) => (
                          <div key={lang.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">{lang.name}</span>
                              <span className="text-sm text-muted-foreground">{lang.percentage}%</span>
                            </div>
                            <Progress value={lang.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* StackOverflow Stats */}
              {footprintData.stackoverflow && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      StackOverflow Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Reputation
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {(footprintData.stackoverflow.reputation || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Answers
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {footprintData.stackoverflow.answers || 0}
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Badges
                      </h4>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500 text-white">Gold</Badge>
                          <span className="text-lg font-bold text-foreground">
                            {footprintData.stackoverflow.badges?.gold || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-400 text-white">Silver</Badge>
                          <span className="text-lg font-bold text-foreground">
                            {footprintData.stackoverflow.badges?.silver || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-600 text-white">Bronze</Badge>
                          <span className="text-lg font-bold text-foreground">
                            {footprintData.stackoverflow.badges?.bronze || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skills Identified */}
              {footprintData.skills && footprintData.skills.length > 0 && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>Identified Skills & Technologies</CardTitle>
                    <CardDescription>
                      Programming languages and technologies from your repositories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {footprintData.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-sm px-3 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Empty State */}
          {!footprintData && !isLoading && (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Ready to Analyze Your Developer Footprint?
                </h3>
                <p className="text-muted-foreground">
                  Enter your GitHub username to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
