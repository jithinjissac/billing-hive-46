
import { ReactNode, useEffect, useState, memo } from "react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { forceRefresh } from "@/utils/databaseHealthCheck";

interface DashboardLayoutProps {
  children: ReactNode;
}

// Create memoized sidebar component for better performance
const MemoizedSidebar = memo(Sidebar);

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const logoUrl = "/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png";
  const { user, isLoading, profile, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Attempt to refresh session if needed and redirect if not authenticated
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      if (!isMounted) return;
      setLocalLoading(true);
      
      try {
        // If we're already loading from auth context, wait for that to complete
        if (isLoading) {
          return;
        }
        
        if (!user) {
          console.log("No user found, redirecting to login");
          navigate('/auth/login');
          return;
        }
      } finally {
        // Always set loading to false after a short delay to prevent flash
        if (isMounted) {
          setTimeout(() => {
            setLocalLoading(false);
          }, 100);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [user, isLoading, navigate, refreshSession]);
  
  const closeSidebar = () => setSidebarOpen(false);
  
  const handleForceRefresh = () => {
    forceRefresh();
  };
  
  // Show loading spinner only for a short time to prevent getting stuck
  if (localLoading && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-3 text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }
  
  // Force render the dashboard even if profile is not loaded yet
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <div className="flex items-center">
            <img 
              src={logoUrl} 
              alt="TechiusPay Logo" 
              className="h-8 w-auto" 
            />
            <span className="ml-2 font-bold text-lg">TechiusPay</span>
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleForceRefresh}
              title="Force refresh application"
              className="mr-2"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] max-w-full flex flex-col">
                <MemoizedSidebar 
                  showCloseButton={true} 
                  onClose={closeSidebar} 
                  userProfile={profile}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <MemoizedSidebar userProfile={profile} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-full">
        <div className="container mx-auto">
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleForceRefresh}
              title="Force refresh application"
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
