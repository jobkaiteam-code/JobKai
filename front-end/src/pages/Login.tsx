import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Github } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useJobKaiStore } from "@/store/useJobKaiStore";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GithubAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const setUser = useJobKaiStore((state) => state.setUser);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();
      sessionStorage.setItem("authToken", token);

      // Set user data in store
      const userData = {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || email.split('@')[0], // Use display name or email prefix
        email: userCredential.user.email || email,
        token: token,
        createdAt: new Date().toISOString()
      };
      setUser(userData);

      toast({
        title: "Welcome back!",
        description: `Signed in as ${userCredential.user.displayName || email}`,
      });

      navigate("/");
    } catch (error: any) {
      let errorMessage = "An error occurred during login.";

      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage = "Invalid email or password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection.";
          break;
        default:
          errorMessage = error.message;
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);

    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const token = await result.user.getIdToken();
      sessionStorage.setItem("authToken", token);

      // Set user data in store
      const userData = {
        id: result.user.uid,
        name: result.user.displayName || result.user.email?.split('@')[0] || 'GitHub User',
        email: result.user.email || '',
        token: token,
        createdAt: new Date().toISOString()
      };
      setUser(userData);

      toast({
        title: "Welcome back!",
        description: `Signed in with GitHub as ${userData.name}`,
      });

      navigate("/");
    } catch (error: any) {
      let errorMessage = "An error occurred during GitHub login.";

      switch (error.code) {
        case "auth/account-exists-with-different-credential":
          errorMessage =
            "An account already exists with the same email address.";
          break;
        case "auth/popup-blocked":
          errorMessage =
            "Popup was blocked. Please allow popups for this site.";
          break;
        case "auth/popup-closed-by-user":
          errorMessage = "Popup was closed before completing sign in.";
          break;
        case "auth/cancelled-popup-request":
          errorMessage = "Only one popup request is allowed at a time.";
          break;
        default:
          errorMessage = error.message;
      }

      toast({
        title: "GitHub login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <img src="/symbol.png" alt="JobKai Logo" className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">JobKai</h1>
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription className="mt-2">
              Sign in to continue to your dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGithubLogin}
                disabled={isLoading}
              >
                <Github className="w-4 h-4 mr-2" />
                Login with GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                //onClick={handleLinkedInLogin}
                disabled={isLoading}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Login with LinkedIn
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="transition-all"
                />
              </div>

              <Button
                type="submit"
                className="w-full transition-all hover:shadow-soft"
                disabled={isLoading}
              >
                {isLoading ? "Please wait..." : "Sign In"}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/signup"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Don't have an account? Sign up
                </Link>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}