import { useState, useRef, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import {
  ArrowLeft,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  Play,
  Sparkles,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { auth } from "../firebase/config";
import { api } from "@/lib/api";
import { interviewer } from "@/constants";

type InterviewState =
  | "initial"
  | "setup"
  | "interview"
  | "feedback"
  | "loading";
type CallState = "waiting" | "connecting" | "active" | "ended";

interface SavedMessage {
  role: "user" | "assistant";
  content: string;
}

interface QuestionType {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

interface CategoryScore {
  name: string;
  score: number;
  comment: string;
}

interface FeedbackData {
  totalScore: number;
  categoryScores: CategoryScore[];
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  date: string;
  questionCount: number;
  overallScore: number;
  feedback?: FeedbackData;
}

export default function AIInterviewer() {
  const [state, setState] = useState<InterviewState>("initial");
  const [triesLeft, setTriesLeft] = useState(3);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [callState, setCallState] = useState<CallState>("waiting");
  const [currentInterviewId, setCurrentInterviewId] = useState<string | null>(
    null
  );

  const vapiRef = useRef<Vapi | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(
    null
  );
  const [interviews, setInterviews] = useState<Interview[]>([]);

  // Video stream refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [level, setLevel] = useState("");
  const [techstack, setTechstack] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [questionCount, setQuestionCount] = useState(8);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    {
      id: "general",
      label: "General Interview Questions",
      description: "Mix of behavioral and role-specific questions",
      checked: true,
    },
    {
      id: "behavioral",
      label: "Behavioral Focus",
      description: "STAR method, soft skills, and experiences",
      checked: true,
    },
    {
      id: "technical",
      label: "Technical Focus",
      description: "Role-specific technical skills",
      checked: false,
    },
    {
      id: "leadership",
      label: "Leadership Focus",
      description: "Management and leadership scenarios",
      checked: false,
    },
  ]);

  const getQuestionLabel = (count: number) => {
    if (count === 1) return "1 question (Quick)";
    if (count === 8) return "8 questions (Balanced)";
    if (count === 15) return "15 questions (Comprehensive)";
    return `${count} questions`;
  };

  // Camera and microphone access
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Could not access camera. Please check your permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  // Microphone access - CRITICAL for Vapi to hear you
  const requestMicrophoneAccess = async () => {
    try {
      // Request microphone permission to ensure browser allows it
      // Then immediately stop our stream so Vapi can use the mic
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      
      console.log("🎤 Microphone access granted");
      
      // Stop our test stream immediately - Vapi will request its own
      stream.getTracks().forEach(track => track.stop());
      
      setMicOn(true);
      return true;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied. Vapi needs microphone permission to hear you. Please allow microphone access and try again.");
      setMicOn(false);
      return false;
    }
  };

  const stopMicrophone = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setMicOn(false);
  };

  const toggleMicrophone = async () => {
    if (micOn) {
      stopMicrophone();
    } else {
      await requestMicrophoneAccess();
    }
  };

  // Cleanup on unmount or when leaving interview
  useEffect(() => {
    return () => {
      stopCamera();
      stopMicrophone();
    };
  }, []);

  const handleStartSetup = () => {
    if (triesLeft === 0) return;
    setState("setup");
  };
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          console.warn("Error stopping Vapi on unmount:", e);
        }
        vapiRef.current = null;
      }
    };
  }, []);

  const handleStartInterview = async () => {
    if (!role.trim() || questionTypes.every((qt) => !qt.checked)) {
      return;
    }

    const payload = {
      type: questionTypes
        .filter((qt) => qt.checked)
        .map((qt) => qt.id)
        .join(","),
      role,
      level: "uknown",
      techstack: "uknown",
      amount: questionCount,
      userid: auth.currentUser?.uid || "",
    };

    const data = await api.generateInterview(payload);
    console.log("Generated interview ID:", data.interviewId);
    setCurrentInterviewId(data.interviewId);

    sessionStorage.setItem("currentInterviewId", data.interviewId);

    setTriesLeft((prev) => Math.max(0, prev - 1));
    setState("interview");
  };

  // useEffect(() => {
  //   const savedId = sessionStorage.getItem("currentInterviewId");
  //   if (savedId) {
  //     setCurrentInterviewId(savedId);
  //     setState("interview");
  //   }
  // }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const response = await api.getUserInterviews(user.uid);
          if (response.success) {
            const formattedInterviews = response.interviews.map((int: any) => ({
              id: int.id,
              role: int.role,
              date: new Date(int.createdAt).toLocaleDateString(),
              questionCount: int.questions?.length || 0,
              overallScore: int.feedback?.totalScore || 0,
              feedback: int.feedback,
            }));
            setInterviews(formattedInterviews);
          }
        } catch (error) {
          console.error("Error fetching interviews:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStartCall = async () => {
    // prevent double-start
    if (callState === "connecting" || callState === "active") {
      console.warn("Call already in progress or connecting");
      return;
    }

    setInterviewStarted(true);
    if (!currentInterviewId) {
      alert("No interview selected!");
      return;
    }

    // 🎤 CRITICAL: Request microphone access BEFORE starting Vapi
    console.log("🎤 Requesting microphone access...");
    const micGranted = await requestMicrophoneAccess();
    
    if (!micGranted) {
      console.error("❌ Microphone access denied");
      setInterviewStarted(false);
      return;
    }

    setCallState("connecting");

    try {
      //-----------------------------------------------------------------------

      // console.log("🚀 handleStartCall called!");
      // console.log("🔑 Raw env:", import.meta.env);
      // console.log("🔑 VAPI Key:", import.meta.env.VITE_VAPI_PUBLIC_KEY);

      //-----------------------------------------------------------------------

      // Fetch interview to get questions
      const { success, interview } = await api.getInterview(
        auth.currentUser?.uid,
        currentInterviewId
      );

      if (!success) throw new Error("Failed to fetch interview");

      // Initialize VAPI
      const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
      
      console.log("🔑 Vapi Key Status:", publicKey ? "Present" : "Missing", publicKey?.substring(0, 10) + "...");
      
      if (!publicKey || publicKey === 'your_vapi_public_key_here') {
        alert("⚠️ Vapi API key is missing!\n\n1. Go to https://vapi.ai and sign up\n2. Get your Public Key from the dashboard\n3. Add it to front-end/.env file as:\n   VITE_VAPI_PUBLIC_KEY=your_actual_key\n4. Restart the dev server (npm run dev)");
        throw new Error("Vapi API key is missing or invalid");
      }

      // initialize Vapi once
      if (!vapiRef.current) {
        vapiRef.current = new Vapi(publicKey);
      } else {
        console.debug("Re-using existing Vapi instance");
      }

      // 🔥 Setup event listeners (like Next.js Agent component)
      vapiRef.current.on("call-start", (meta?: any) => {
        console.log("📞 Call started", meta);
        setCallState("active");
      });

      vapiRef.current.on("call-end", (meta?: any) => {
        console.log("☎️  Call ended", meta);
        setCallState("ended");
        // ensure we remove reference after call ends
        try {
          vapiRef.current?.stop();
        } catch (e) {
          console.warn("Error stopping Vapi on call-end:", e);
        }
        vapiRef.current = null;
      });

      // 🔥 Collect transcript messages (like Next.js)
      vapiRef.current.on("message", (message: any) => {
        if (
          message.type === "transcript" &&
          message.transcriptType === "final"
        ) {
          console.log(`💬 ${message.role}: ${message.transcript}`);
          setMessages((prev) => [
            ...prev,
            { role: message.role, content: message.transcript },
          ]);
        }
      });

      vapiRef.current.on("speech-start", () => {
        console.log("🗣️ User started speaking");
        setIsSpeaking(true);
      });

      vapiRef.current.on("speech-end", () => {
        console.log("🤐 User stopped speaking");
        setIsSpeaking(false);
      });

      // Listen for volume level to verify mic is working
      vapiRef.current.on("volume-level", (level: number) => {
        if (level > 0.1) {
          console.log(`🎤 Microphone level: ${level.toFixed(2)}`);
        }
      });

      vapiRef.current.on("error", (error?: any) => {
        console.error("❌ VAPI error:", error);
        setCallState("waiting");
        // surface useful info to the user
        const msg = error?.message || error?.errorMsg || "Call error";
        alert(`Call error: ${msg}. Please try again.`);
      });

      // 🔥 Format questions and start call (like Next.js)
      const formattedQuestions = interview.questions
        .map((q: string) => `- ${q}`)
        .join("\n");

      const assistantConfig = {
        ...interviewer,
        model: {
          ...interviewer.model,
          messages: [
            {
              ...interviewer.model.messages[0],
              content: interviewer.model.messages[0].content.replace(
                "{{questions}}",
                formattedQuestions
              ),
            },
          ],
        },
      };

      // Start the call with assistant config
      const startResult = await vapiRef.current.start(assistantConfig);
      console.debug("Vapi.start result:", startResult);
    } catch (error) {
      console.error("Error starting call:", error);
      setCallState("waiting");
      alert("Failed to start call. Please try again.");
    }
  };

  const handleEndInterview = async () => {
    try {
      // Stop VAPI call
      if (vapiRef.current) {
        vapiRef.current.stop();
      }

      // Stop media streams
      stopMicrophone();
      stopCamera();
      setInterviewStarted(false);

      // Show loading state
      setState("loading");

      // Wait for messages to be collected
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate feedback
      const userId = auth.currentUser?.uid;
      if (!userId || !currentInterviewId) {
        throw new Error("Missing user ID or interview ID");
      }

      console.log("📝 Generating feedback for interview:", currentInterviewId);
      console.log("Messages count:", messages.length);

      const response = await api.createFeedback(
        currentInterviewId,
        userId,
        messages
      );

      if (response.success) {
        console.log("✅ Feedback generated:", response.feedbackId);

        // Fetch the complete feedback
        const feedbackResponse = await api.getFeedback(
          userId,
          currentInterviewId
        );

        if (feedbackResponse.success) {
          // Fetch the interview details
          const interviewResponse = await api.getInterview(
            userId,
            currentInterviewId
          );

          if (interviewResponse.success) {
            // Create the complete interview object with feedback
            const completeInterview: Interview = {
              id: currentInterviewId,
              role: interviewResponse.interview.role,
              date: new Date(
                interviewResponse.interview.createdAt
              ).toLocaleDateString(),
              questionCount: interviewResponse.interview.questions?.length || 0,
              overallScore: feedbackResponse.feedback.totalScore,
              feedback: feedbackResponse.feedback,
            };

            setCurrentInterview(completeInterview);

            // Add to interviews list
            setInterviews((prev) => [completeInterview, ...prev]);

            // Clear messages
            setMessages([]);

            // Move to feedback state
            setState("feedback");
          }
        }
      } else {
        throw new Error("Failed to generate feedback");
      }
    } catch (error) {
      console.error("❌ Error ending interview:", error);
      alert("Failed to generate feedback. Please try again.");
      setState("initial");
    }
  };

  const handleNewInterview = () => {
    setRole("");
    setQuestionCount(8);
    setQuestionTypes(
      questionTypes.map((qt) => ({
        ...qt,
        checked: qt.id === "general" || qt.id === "behavioral",
      }))
    );
    setCurrentInterview(null);
    if (triesLeft === 0) {
      setTriesLeft(3);
    }
    setState("initial");
  };

  const handleViewFeedback = async (interview: Interview) => {
    // If feedback is already loaded, show it
    if (interview.feedback) {
      setCurrentInterview(interview);
      setState("feedback");
      return;
    }

    // Otherwise, fetch it
    try {
      setState("loading");
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user ID");

      const response = await api.getFeedback(userId, interview.id);

      if (response.success) {
        const updatedInterview = {
          ...interview,
          feedback: response.feedback,
        };
        setCurrentInterview(updatedInterview);

        // Update the interview in the list
        setInterviews((prev) =>
          prev.map((int) => (int.id === interview.id ? updatedInterview : int))
        );

        setState("feedback");
      } else {
        alert("Feedback not found for this interview");
        setState("initial");
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      alert("Failed to load feedback");
      setState("initial");
    }
  };

  const handleDeleteInterview = (id: string) => {
    setInterviews(interviews.filter((int) => int.id !== id));
  };

  const toggleQuestionType = (id: string) => {
    setQuestionTypes(
      questionTypes.map((qt) =>
        qt.id === id ? { ...qt, checked: !qt.checked } : qt
      )
    );
  };
  // Add this before your other state conditions
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">
            Generating Your Feedback
          </h2>
          <p className="text-muted-foreground">
            Our AI is analyzing your interview performance...
          </p>
        </Card>
      </div>
    );
  }

  // Initial State - Show history if user has interviews, otherwise show welcome
  if (state === "initial") {
    // If user has completed at least one interview, show history by default
    if (interviews.length > 0) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                AI Interviewer
              </h1>
              <p className="text-muted-foreground">
                Your interview history and performance
              </p>
            </div>
          </div>

          {/* Tries Counter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium">Interview Credits</span>
                </div>
                <div className="flex items-center gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < triesLeft ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {triesLeft}/3 remaining
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade prompt when no credits left */}
          {triesLeft === 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  No Credits Remaining
                </CardTitle>
                <CardDescription>
                  You've used all your interview credits. Upgrade to premium for
                  unlimited interviews!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Premium Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Unlimited AI interviews</li>
                    <li>• Detailed performance analytics</li>
                    <li>• Interview history export</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                  <Button variant="outline" onClick={handleNewInterview}>
                    Reset Credits (Demo)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Interview Button */}
          {triesLeft > 0 && (
            <div className="flex justify-center">
              <Button size="lg" onClick={handleStartSetup}>
                <Play className="h-4 w-4 mr-2" />
                New Interview
              </Button>
            </div>
          )}

          {/* Interview History */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Interview History</h2>
            <div className="grid gap-4">
              {interviews.map((interview) => (
                <Card
                  key={interview.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleViewFeedback(interview)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{interview.role}</h3>
                          <Badge variant="secondary">
                            {interview.questionCount} questions
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {interview.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {interview.overallScore}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Overall Score
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInterview(interview.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // First time - no interviews yet
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              AI Interviewer
            </h1>
            <p className="text-muted-foreground">
              Practice your interview skills with our AI
            </p>
          </div>
        </div>

        {/* Tries Counter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">Interview Credits</span>
              </div>
              <div className="flex items-center gap-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < triesLeft ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium">
                  {triesLeft}/3 remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Video className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>You didn't do interviews yet</CardTitle>
            <CardDescription>
              Start your first AI-powered mock interview to practice and improve
              your skills
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" onClick={handleStartSetup}>
              <Play className="h-4 w-4 mr-2" />
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Setup State - Configure interview
  if (state === "setup") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setState("initial")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Setup Interview
            </h1>
            <p className="text-muted-foreground">
              Configure your mock interview session
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interview Configuration</CardTitle>
            <CardDescription>
              Tell us about the role you're interviewing for and your
              preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Input */}
            <div className="space-y-2">
              <Label htmlFor="role">What role are you interviewing for?</Label>
              <Input
                id="role"
                placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            {/* Question Count Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Number of Questions</Label>
                <Badge variant="secondary">
                  {getQuestionLabel(questionCount)}
                </Badge>
              </div>
              <Slider
                value={[questionCount]}
                onValueChange={(value) => setQuestionCount(value[0])}
                min={1}
                max={15}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 question (Quick)</span>
                <span>8 questions (Balanced)</span>
                <span>15 questions (Comprehensive)</span>
              </div>
            </div>

            {/* Question Types */}
            <div className="space-y-4">
              <Label>Question Types</Label>
              <p className="text-sm text-muted-foreground">
                Select the types of questions you want to practice
              </p>
              <div className="space-y-4">
                {questionTypes.map((qt) => (
                  <div key={qt.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={qt.id}
                      checked={qt.checked}
                      onCheckedChange={() => toggleQuestionType(qt.id)}
                    />
                    <div className="space-y-1 leading-none">
                      <label
                        htmlFor={qt.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {qt.label}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {qt.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Alert */}
            {(!role.trim() || questionTypes.every((qt) => !qt.checked)) && (
              <Alert>
                <AlertDescription>
                  Please enter a role and select at least one question type to
                  continue.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                size="lg"
                onClick={handleStartInterview}
                disabled={
                  !role.trim() || questionTypes.every((qt) => !qt.checked)
                }
              >
                <Play className="h-4 w-4 mr-2" />
                Start Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interview State - Google Meet-like interface
  if (state === "interview") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Interview Session
            </h1>
            <p className="text-muted-foreground">Role: {role}</p>
          </div>
          <Badge variant="secondary">{questionCount} questions</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Candidate Video */}
          <Card className="relative overflow-hidden bg-slate-900">
            <div className="aspect-video flex items-center justify-center relative">
              {cameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <VideoOff className="h-16 w-16 text-slate-400" />
                </div>
              )}
              <div className="absolute bottom-4 left-4">
                <Badge className="bg-black/50 text-white">You</Badge>
              </div>
            </div>
          </Card>

          {/* HR Video */}
          <Card className="relative overflow-hidden bg-slate-900">
            <div className="aspect-video flex items-center justify-center relative">
              <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4">
                <Badge className="bg-black/50 text-white">AI Interviewer</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              {!interviewStarted ? (
                <Button
                  size="lg"
                  onClick={handleStartCall}
                  className="min-w-[200px]"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Call
                </Button>
              ) : (
                <>
                  <Button
                    variant={cameraOn ? "default" : "secondary"}
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={toggleCamera}
                  >
                    {cameraOn ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <VideoOff className="h-5 w-5" />
                    )}
                  </Button>

                  <Button
                    variant={micOn ? "default" : "secondary"}
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={toggleMicrophone}
                    disabled={callState === "active"}
                    title={callState === "active" ? "Microphone controlled by Vapi during call" : "Toggle microphone"}
                  >
                    {micOn ? (
                      <Mic className="h-5 w-5" />
                    ) : (
                      <MicOff className="h-5 w-5" />
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={handleEndInterview}
                  >
                    <Phone className="h-5 w-5 rotate-135" />
                  </Button>
                </>
              )}
            </div>

            {interviewStarted && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Interview in progress... Click the red button to end the call
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Feedback State
  // REPLACE THE ENTIRE "if (state === "feedback" && currentInterview)" BLOCK WITH:
  if (state === "feedback" && currentInterview) {
    const feedback = currentInterview.feedback;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setState("initial")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Interview Feedback
            </h1>
            <p className="text-muted-foreground">
              {currentInterview.role} • {currentInterview.date}
            </p>
          </div>
        </div>

        {/* Overall Score */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
            <CardDescription>
              Your aggregate score across all categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold">
                  {currentInterview.overallScore}%
                </span>
                <Badge
                  variant={
                    currentInterview.overallScore >= 80
                      ? "default"
                      : currentInterview.overallScore >= 60
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {currentInterview.overallScore >= 80
                    ? "Excellent"
                    : currentInterview.overallScore >= 60
                    ? "Good"
                    : "Needs Improvement"}
                </Badge>
              </div>
              <Progress value={currentInterview.overallScore} />
            </div>
          </CardContent>
        </Card>

        {/* Category Scores */}
        {feedback?.categoryScores && (
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>
                Performance across different interview aspects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {feedback.categoryScores.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm font-medium">
                      {category.score}%
                    </span>
                  </div>
                  <Progress value={category.score} />
                  {category.comment && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {category.comment}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Strengths */}
        {feedback?.strengths && feedback.strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Strengths
              </CardTitle>
              <CardDescription>What you did well</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Areas for Improvement */}
        {feedback?.areasForImprovement &&
          feedback.areasForImprovement.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Areas for Improvement
                </CardTitle>
                <CardDescription>Focus areas for growth</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feedback.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

        {/* Final Assessment */}
        {feedback?.finalAssessment && (
          <Card>
            <CardHeader>
              <CardTitle>Final Assessment</CardTitle>
              <CardDescription>Overall evaluation summary</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {feedback.finalAssessment}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {triesLeft > 0 ? (
            <Button className="flex-1" onClick={handleNewInterview}>
              <Play className="h-4 w-4 mr-2" />
              New Interview
            </Button>
          ) : (
            <Button className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          )}
          <Button variant="outline" onClick={() => setState("initial")}>
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  return null;
}