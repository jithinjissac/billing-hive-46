
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
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Set a more reasonable timeout to avoid UI being stuck in loading state
    const timeout = setTimeout(() => {
      if (localLoading) {
        console.log("Loading timeout reached, clearing loading state");
        setLocalLoading(false);
      }
    }, 3000); // 3 seconds max loading time
    
    const checkAuth = async () => {
      console.log("ProtectedRoute: Checking auth status...");
      try {
        if (!user && !isLoading) {
          console.log("ProtectedRoute: No user found, attempting to refresh session");
          const session = await refreshSession();
          if (!session) {
            console.log("ProtectedRoute: No session after refresh, will redirect to login");
          } else {
            console.log("ProtectedRoute: Session refreshed successfully");
          }
        } else if (user) {
          console.log("ProtectedRoute: User already authenticated:", user.id);
        }
      } catch (error) {
        console.error("ProtectedRoute: Error checking auth:", error);
      } finally {
        setLocalLoading(false);
        setInitialized(true);
      }
    };
    
    if (!initialized) {
      checkAuth();
    } else if (!isLoading) {
      setLocalLoading(false);
    }
    
    return () => {
      clearTimeout(timeout);
    };
  }, [user, isLoading, refreshSession, initialized]);
  
  if (isLoading || localLoading) {
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
