
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, refreshSession } = useAuth();
  const location = useLocation();
  const [localLoading, setLocalLoading] = useState(true);
  
  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLocalLoading(false);
    }, 2000);
    
    const checkAuth = async () => {
      try {
        // Only check if there's no user and isLoading is false (initial load complete)
        if (!user && !isLoading) {
          // Attempt to refresh the session one time
          const session = await refreshSession();
          
          // If still no session after refresh, we'll redirect
          if (!session) {
            console.log("No session after refresh, will redirect");
          }
        }
      } finally {
        // Always set loading to false to ensure UI doesn't get stuck
        setLocalLoading(false);
      }
    };
    
    if (!isLoading) {
      checkAuth();
    }
    
    return () => {
      clearTimeout(timeout);
    };
  }, [user, isLoading, refreshSession]);
  
  // If still loading, show a spinner with a message
  if (isLoading || localLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading your account...</p>
      </div>
    );
  }
  
  // If not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  // If authenticated, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
