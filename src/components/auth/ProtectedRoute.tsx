
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
    const timeout = setTimeout(() => {
      setLocalLoading(false);
    }, 2000);
    
    const checkAuth = async () => {
      try {
        if (!user && !isLoading) {
          const session = await refreshSession();
          if (!session) {
            console.log("No session after refresh, will redirect");
          }
        }
      } finally {
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
  
  if (isLoading || localLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading your account...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
