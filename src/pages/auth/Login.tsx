import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Eye, EyeOff, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, profile, removeProfilePicture } = useAuth();
  const logoUrl = "/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png";
  
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    
    if (query.get('confirmation') === 'success') {
      toast.success("Email confirmed successfully! You can now log in.");
    }
    
    if (query.get('email_change') === 'success') {
      toast.success("Email changed successfully! Please log in with your new email.");
    }
    
    if (user) {
      navigate('/dashboard');
    }
  }, [location, user, navigate]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login error:", error);
        
        if (error.message.includes("Email not confirmed")) {
          toast.error("Please confirm your email before logging in", {
            description: "Check your inbox for a confirmation email",
            action: {
              label: "Resend",
              onClick: async () => {
                const { error: resendError } = await supabase.auth.resend({
                  type: 'signup',
                  email,
                });
                if (resendError) {
                  toast.error("Failed to resend confirmation email");
                } else {
                  toast.success("Confirmation email resent");
                }
              }
            }
          });
        } else if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      // No need to redirect here as the useEffect hook will handle it
      // once the auth state changes
    } catch (error) {
      console.error("Unexpected login error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveProfilePicture = async () => {
    try {
      await removeProfilePicture();
      toast.success("Profile picture removed");
    } catch (error) {
      console.error("Error removing profile picture:", error);
      toast.error("Failed to remove profile picture");
    }
  };
  
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <img
              src={logoUrl}
              alt="TechiusPay Logo"
              className="h-16 w-auto mx-auto mb-3"
            />
            <h1 className="text-2xl font-bold text-gray-800">TechiusPay</h1>
            <p className="text-sm text-muted-foreground">You are already signed in</p>
          </div>
          
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center">Account Options</CardTitle>
              <CardDescription className="text-center">
                Manage your account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {profile?.profile_picture_url && (
                  <div className="mb-4 flex flex-col items-center">
                    <img 
                      src={profile.profile_picture_url} 
                      alt="Profile" 
                      className="h-20 w-20 rounded-full object-cover border border-gray-200" 
                    />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleRemoveProfilePicture}
                      className="mt-2 flex items-center"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Remove Picture
                    </Button>
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  Signed in as: <span className="font-semibold">{user.email}</span>
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                variant="default" 
                className="w-full" 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/profile')}
              >
                Edit Profile
              </Button>
            </CardFooter>
          </Card>
          
          <div className="text-center mt-8">
            <Button variant="ghost" asChild>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src={logoUrl}
            alt="TechiusPay Logo"
            className="h-16 w-auto mx-auto mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-800">TechiusPay</h1>
          <p className="text-sm text-muted-foreground">Invoice Management System</p>
        </div>
        
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/auth/reset-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    autoComplete="current-password"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-0 top-0 h-11 w-11"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                  Create an account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        <div className="text-center mt-8">
          <Button variant="ghost" asChild>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
