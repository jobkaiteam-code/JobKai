import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/config";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [otherInterest, setOtherInterest] = useState("");
  const [goal, setGoal] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const needsOnboarding = sessionStorage.getItem("jobkai_needs_onboarding");
    const authToken = sessionStorage.getItem("authToken");


    if (!needsOnboarding || !authToken) {
      navigate("/");
    }
  }, [navigate]);

  const handleComplete = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const finalInterests = [...interests];
    if (otherInterest.trim()) {
      finalInterests.push(`other: ${otherInterest.trim()}`);
    }

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          status,
          source,
          interests: finalInterests,
          goal,
          onboardingCompleted: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true } 
      );

      sessionStorage.removeItem("jobkai_needs_onboarding");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Welcome to JobKai! 🎉</CardTitle>
          <CardDescription className="text-base mt-2">
            Let's personalize your experience in just a few steps
          </CardDescription>
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i <= step ? "w-12 bg-primary" : "w-8 bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <Label className="text-lg font-semibold">
                What's your current status?
              </Label>
              <RadioGroup
                value={status}
                onValueChange={setStatus}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="cursor-pointer flex-1">
                    🎓 Student - Currently studying or recently graduated
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="employed" id="employed" />
                  <Label htmlFor="employed" className="cursor-pointer flex-1">
                    💼 Employed - Looking for new opportunities
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="unemployed" id="unemployed" />
                  <Label htmlFor="unemployed" className="cursor-pointer flex-1">
                    🔍 Actively Job Seeking
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="career-change" id="career-change" />
                  <Label
                    htmlFor="career-change"
                    className="cursor-pointer flex-1"
                  >
                    🔄 Career Change - Transitioning to a new field
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <Label className="text-lg font-semibold">
                How did you hear about us?
              </Label>
              <RadioGroup
                value={source}
                onValueChange={setSource}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="search" id="search" />
                  <Label htmlFor="search" className="cursor-pointer flex-1">
                    🔍 Search Engine (Google, Bing, etc.)
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="social" id="social" />
                  <Label htmlFor="social" className="cursor-pointer flex-1">
                    📱 Social Media (LinkedIn, Twitter, etc.)
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="referral" id="referral" />
                  <Label htmlFor="referral" className="cursor-pointer flex-1">
                    👥 Friend or Colleague Recommendation
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-all cursor-pointer">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="cursor-pointer flex-1">
                    📰 News Article or Blog Post
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <Label className="text-lg font-semibold">
                What are you interested in?
              </Label>
              <p className="text-sm text-muted-foreground">
                Select all areas that interest you (you can select multiple)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    value: "devops",
                    label: "⚙️ DevOps",
                    desc: "CI/CD, Infrastructure, Automation",
                  },
                  {
                    value: "mlops",
                    label: "🤖 MLOps",
                    desc: "ML Infrastructure, Model Deployment",
                  },
                  {
                    value: "ai",
                    label: "🧠 AI/Machine Learning",
                    desc: "ML Engineering, Data Science",
                  },
                  {
                    value: "marketing",
                    label: "📣 Marketing",
                    desc: "Digital Marketing, Growth",
                  },
                  {
                    value: "design",
                    label: "🎨 Design",
                    desc: "UI/UX, Product Design",
                  },
                  {
                    value: "frontend",
                    label: "💻 Frontend Development",
                    desc: "React, Vue, Angular",
                  },
                  {
                    value: "backend",
                    label: "🔧 Backend Development",
                    desc: "APIs, Databases, Servers",
                  },
                  {
                    value: "fullstack",
                    label: "🚀 Full Stack Development",
                    desc: "End-to-end Development",
                  },
                ].map((interest) => (
                  <button
                    key={interest.value}
                    type="button"
                    onClick={() => toggleInterest(interest.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      interests.includes(interest.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold">{interest.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {interest.desc}
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="otherInterest" className="text-base">
                  📝 Other (Please specify)
                </Label>
                <Input
                  id="otherInterest"
                  type="text"
                  placeholder="e.g., Cybersecurity, Data Engineering, Cloud Architecture..."
                  value={otherInterest}
                  onChange={(e) => setOtherInterest(e.target.value)}
                  className="transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  Don't see what you're looking for? Add your own interest area
                  here
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <Label className="text-lg font-semibold">
                What are you hoping to achieve with JobKai?
              </Label>
              <Textarea
                placeholder="Tell us about your career goals, what kind of opportunities you're looking for, or any specific challenges you're facing..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="min-h-32 resize-none transition-all"
              />
              <p className="text-sm text-muted-foreground">
                This helps us personalize your job recommendations and provide
                better career insights.
              </p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !status) ||
                  (step === 2 && !source) ||
                  (step === 3 &&
                    interests.length === 0 &&
                    !otherInterest.trim())
                }
                className="ml-auto"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!goal}
                className="ml-auto gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}