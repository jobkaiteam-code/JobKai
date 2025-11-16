import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Activity, Code, FileText, ChevronRight, Sparkles } from "lucide-react";
import { useJobKaiStore } from "@/store/useJobKaiStore";
import { Link } from "react-router-dom";
import { useMemo } from "react";

export default function Dashboard() {
  const user = useJobKaiStore((state) => state.user);
  const uploadedCV = useJobKaiStore((state) => state.uploadedCV);
  const resumeAnalysis = useJobKaiStore((state) => state.resumeAnalysis);
  const jobMatches = useJobKaiStore((state) => state.jobMatches);
  const footprintData = useJobKaiStore((state) => state.footprintData);

  const userName = user?.name || 'User';

  function getTimeAgo(isoDate: string): string {
    const now = new Date();
    const date = new Date(isoDate);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  const recentActivity = useMemo(() => {
    const activities: Array<{action: string; detail: string; time: string; type: 'success'|'info'|'warning'; link?: string;}> = [];
    if (resumeAnalysis) activities.push({action: 'Resume Analyzed', detail: `Score: ${resumeAnalysis.score}/100`, time: getTimeAgo(resumeAnalysis.analyzedAt), type: 'success', link: '/resume-reviewer'});
    if (jobMatches) activities.push({action: 'Jobs Matched', detail: `Found ${jobMatches.totalMatches} opportunities`, time: getTimeAgo(jobMatches.matchedAt), type: 'info', link: '/job-matcher'});
    if (footprintData) activities.push({action: 'Footprint Scanned', detail: `Score: ${footprintData.footprintScore}/100`, time: getTimeAgo(footprintData.analyzedAt), type: 'warning', link: '/footprint-scanner'});
    return activities;
  }, [resumeAnalysis, jobMatches, footprintData]);

  const stats = [
    {title: "Resume Score", value: resumeAnalysis?.score ? `${resumeAnalysis.score}/100` : "Not analyzed", change: resumeAnalysis ? "Analyzed" : "Upload CV", icon: FileText, color: "text-chart-1", hasData: !!resumeAnalysis},
    {title: "Job Matches", value: jobMatches?.totalMatches || 0, change: jobMatches ? `${jobMatches.averageMatchScore.toFixed(0)}% avg match` : "Start matching", icon: Target, color: "text-chart-2", hasData: !!jobMatches},
    {title: "Footprint Score", value: footprintData?.footprintScore ? `${footprintData.footprintScore}/100` : "Not scanned", change: footprintData ? `${footprintData.skills.length} skills` : "Scan profile", icon: Code, color: "text-chart-3", hasData: !!footprintData},
    {title: "Total Activity", value: recentActivity.length, change: recentActivity.length > 0 ? "Active" : "Get started", icon: Activity, color: "text-chart-4", hasData: recentActivity.length > 0}
  ];

  const quickActions = [
    {title: "Upload Resume", description: "Get AI-powered insights", icon: FileText, color: "bg-chart-1/10 text-chart-1", link: "/resume-reviewer", disabled: false},
    {title: "Match Jobs", description: "Find your perfect role", icon: Target, color: "bg-chart-2/10 text-chart-2", link: "/job-matcher", disabled: !uploadedCV},
    {title: "Scan Footprint", description: "Analyze your presence", icon: Code, color: "bg-chart-3/10 text-chart-3", link: "/footprint-scanner", disabled: false},
    {title: "AI Interview", description: "Practice with AI", icon: Sparkles, color: "bg-chart-4/10 text-chart-4", link: "/ai-interviewer", disabled: false}
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">Here's your career progress overview</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-soft hover:shadow-medium transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className={`w-4 h-4 \${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className={`text-xs mt-1 \${stat.hasData ? 'text-success' : 'text-muted-foreground'}`}>{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jumpstart your job search journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} to={action.link} className={action.disabled ? 'pointer-events-none opacity-50' : ''}>
                    <Card className="border-2 hover:border-primary transition-all cursor-pointer h-full">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg \${action.color}`}><Icon className="w-6 h-6" /></div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                            {action.disabled && <Badge variant="outline" className="mt-2 text-xs">Upload CV first</Badge>}
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <Link key={index} to={activity.link || '#'} className="block">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="mt-1"><Badge variant={activity.type === 'success' ? 'default' : activity.type === 'info' ? 'secondary' : 'outline'} className="w-2 h-2 p-0 rounded-full" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No activity yet. Get started with the quick actions!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {!uploadedCV && (
        <Card className="shadow-soft border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10"><TrendingUp className="w-6 h-6 text-primary" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Get Started with Your Resume</h3>
                <p className="text-sm text-muted-foreground mb-3">Upload your resume to unlock job matching and get AI-powered insights</p>
                <Link to="/resume-reviewer"><Button>Upload Resume</Button></Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {uploadedCV && !jobMatches && (
        <Card className="shadow-soft border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-chart-2/10"><Target className="w-6 h-6 text-chart-2" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Ready to Find Jobs?</h3>
                <p className="text-sm text-muted-foreground mb-3">Your resume is uploaded. Now discover jobs that match your skills!</p>
                <Link to="/job-matcher"><Button>Match Jobs</Button></Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {!footprintData && (
        <Card className="shadow-soft border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-chart-3/10"><Code className="w-6 h-6 text-chart-3" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Analyze Your Developer Footprint</h3>
                <p className="text-sm text-muted-foreground mb-3">Discover your online presence and showcase your contributions</p>
                <Link to="/footprint-scanner"><Button variant="outline">Scan Footprint</Button></Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
