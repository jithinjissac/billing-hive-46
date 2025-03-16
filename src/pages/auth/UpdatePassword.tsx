
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const logoUrl = "/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png";
  
  // Check if we have a hash in the URL that indicates we're in password reset flow
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (!hashParams.get('access_token')) {
      toast.error("Invalid password reset link");
      navigate("/auth/login");
    }
  }, [navigate]);
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        console.error("Update password error:", error);
        toast.error(error.message);
        return;
      }
      
      setIsSuccess(true);
      toast.success("Password updated successfully!");
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (error) {
      console.error("Unexpected update password error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src={logoUrl}
            alt="TechiusPay Logo"
            className="h-14 w-auto mx-auto mb-2"
          />
          <h1 className="text-2xl font-bold">TechiusPay</h1>
          <p className="text-sm text-muted-foreground">Invoice Management System</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Update Password</CardTitle>
            <CardDescription>
              Enter your new password
            </CardDescription>
          </CardHeader>
          {!isSuccess ? (
            <form onSubmit={handleUpdatePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters long
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating password...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md text-green-700 text-center">
                <p className="font-medium mb-2">Password Updated!</p>
                <p className="text-sm">Your password has been updated successfully. You will be redirected to the login page shortly.</p>
              </div>
              <Button 
                asChild 
                variant="outline" 
                className="w-full mt-4"
              >
                <Link to="/auth/login">
                  Back to Login
                </Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UpdatePassword;
