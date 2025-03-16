
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const logoUrl = "/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png";
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) {
        console.error("Reset password error:", error);
        toast.error(error.message);
        return;
      }
      
      setIsSuccess(true);
      toast.success("Password reset link sent! Check your email.");
    } catch (error) {
      console.error("Unexpected reset password error:", error);
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
            <CardTitle className="text-xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          {!isSuccess ? (
            <form onSubmit={handleResetPassword}>
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
                      Sending reset link...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                <div className="text-center text-sm">
                  Remember your password?{" "}
                  <Link to="/auth/login" className="text-primary hover:underline font-medium">
                    Back to login
                  </Link>
                </div>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md text-green-700 text-center">
                <p className="font-medium mb-2">Reset link sent!</p>
                <p className="text-sm">Check your email for the password reset link.</p>
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

export default ResetPassword;
