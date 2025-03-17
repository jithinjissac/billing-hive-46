
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
    // Set a maximum loading time to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLocalLoading(false);
    }, 3000);
    
    const checkAuth = async () => {
      try {
        if (!user) {
          console.log("No user found in protected route, attempting to refresh session");
          await refreshSession();
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        // Always set loading to false after checking auth
        setLocalLoading(false);
        clearTimeout(loadingTimeout);
      }
    };
    
    if (!isLoading) {
      checkAuth();
    } else if (isLoading) {
      // If the auth context is still loading, wait for it to finish
      console.log("Auth context is still loading, waiting for it to complete");
    }
    
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [user, isLoading, refreshSession]);
  
  // Only show loading state for a brief period
  if (isLoading && localLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading your account...</p>
      </div>
    );
  }
  
  // If no user and not loading, redirect to login
  if (!user) {
    console.log("No user found after loading, redirecting to login");
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
