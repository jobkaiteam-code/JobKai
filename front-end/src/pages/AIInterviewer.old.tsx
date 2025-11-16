import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Play, Square, BarChart3, MessageSquare, AlertCircle, Rocket } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AIInterviewer() {
  const [isActive, setIsActive] = useState(false);

  const profileData = {
    strengths: ["Problem Solving", "Communication", "Technical Skills", "Leadership"],
    weaknesses: ["Public Speaking", "Time Management"],
    score: 8.2,
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Interviewer & Profiler</h1>
        <p className="text-muted-foreground mt-2">
          Practice interviews and get personalized insights
        </p>
      </div>

      {/* Coming Soon Alert */}
      <Alert className="border-2 border-primary/50 bg-primary/5">
        <Rocket className="h-5 w-5 text-primary" />
        <AlertTitle className="text-lg font-semibold">Backend Integration Coming Soon!</AlertTitle>
        <AlertDescription className="text-sm mt-2">
          <p className="mb-2">
            The AI Interviewer backend with Vapi voice AI integration is currently under development. 
            The interface below is a demo preview of upcoming features.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Planned Features:</strong> Real-time voice interviews, AI-powered feedback, 
            personality profiling, and technical assessment scoring.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Interview Control */}
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>Virtual Interview</CardTitle>
            <CardDescription>Start your AI-powered interview simulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="technical">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
                <TabsTrigger value="hr">HR Round</TabsTrigger>
              </TabsList>

              <TabsContent value="technical" className="space-y-4 mt-6">
                <div className="p-6 rounded-lg bg-muted/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Technical Interview</h3>
                      <p className="text-sm text-muted-foreground">
                        Focus on coding, algorithms, and system design
                      </p>
                    </div>
                    <Badge>30 min</Badge>
                  </div>

                  {isActive && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <p className="text-sm text-foreground">
                          "Tell me about a challenging technical problem you've solved recently..."
                        </p>
                      </div>
                      <Progress value={33} className="h-2" />
                      <p className="text-xs text-muted-foreground">Question 1 of 3</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => setIsActive(!isActive)}
                    variant={isActive ? "destructive" : "default"}
                  >
                    {isActive ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Interview
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Interview
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="behavioral" className="space-y-4 mt-6">
                <div className="p-6 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-foreground mb-1">Behavioral Interview</h3>
                  <p className="text-sm text-muted-foreground">
                    Questions about teamwork, leadership, and conflict resolution
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="hr" className="space-y-4 mt-6">
                <div className="p-6 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-foreground mb-1">HR Round</h3>
                  <p className="text-sm text-muted-foreground">
                    General questions about experience, expectations, and company fit
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Profile Insights */}
        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Profile Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-5xl font-bold text-primary">{profileData.score}</div>
                <p className="text-sm text-muted-foreground">Overall Performance</p>
                <Progress value={profileData.score * 10} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Strengths</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profileData.strengths.map((strength) => (
                <div
                  key={strength}
                  className="flex items-center justify-between p-3 rounded-lg bg-success/10"
                >
                  <span className="text-sm font-medium text-foreground">{strength}</span>
                  <Badge variant="outline" className="bg-success/20">
                    Strong
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Areas to Improve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {profileData.weaknesses.map((weakness) => (
                <div
                  key={weakness}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/10"
                >
                  <span className="text-sm font-medium text-foreground">{weakness}</span>
                  <Badge variant="outline" className="bg-accent/20">
                    Focus
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
