
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
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  
  useEffect(() => {
    console.log("ProtectedRoute: Component mounted, current auth state:", { 
      user: user ? "exists" : "null", 
      isLoading, 
      localLoading, 
      refreshAttempted 
    });

    // Force resolution after a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (localLoading) {
        console.log("ProtectedRoute: Loading timeout reached, forcing state resolution");
        setLocalLoading(false);
      }
    }, 3000); // 3 seconds max loading time
    
    const checkAuth = async () => {
      console.log("ProtectedRoute: Checking auth status...");
      
      // If we already have a user, no need to refresh
      if (user) {
        console.log("ProtectedRoute: User already authenticated:", user.id);
        setLocalLoading(false);
        return;
      }
      
      // Only attempt refresh if we haven't already and don't have a user
      if (!refreshAttempted && !user) {
        try {
          console.log("ProtectedRoute: Attempting to refresh session");
          setRefreshAttempted(true);
          const session = await refreshSession();
          
          if (!session) {
            console.log("ProtectedRoute: No session after refresh, will redirect to login");
          } else {
            console.log("ProtectedRoute: Session refreshed successfully");
          }
        } catch (error) {
          console.error("ProtectedRoute: Error refreshing session:", error);
        } finally {
          setLocalLoading(false);
        }
      } else {
        // Either we've already attempted refresh or isLoading is false
        setLocalLoading(false);
      }
    };
    
    checkAuth();
    
    return () => {
      clearTimeout(timeout);
    };
  }, [user, isLoading, refreshSession, refreshAttempted]);
  
  // Only show loading spinner for a short time or if genuinely loading
  if ((isLoading || localLoading) && !refreshAttempted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading your account...</p>
      </div>
    );
  }
  
  if (!user) {
    console.log("ProtectedRoute: No authenticated user, redirecting to login");
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  console.log("ProtectedRoute: User authenticated, rendering protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
