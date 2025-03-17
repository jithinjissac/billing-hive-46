
import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const logoUrl = "/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png";
  const { user, isLoading, profile, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Attempt to refresh session if needed and redirect if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
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
        setTimeout(() => {
          setLocalLoading(false);
        }, 100);
      }
    };
    
    checkAuth();
  }, [user, isLoading, navigate, refreshSession]);
  
  const closeSidebar = () => setSidebarOpen(false);
  
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
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] max-w-full flex flex-col">
              <Sidebar 
                showCloseButton={true} 
                onClose={closeSidebar} 
                userProfile={profile}
              />
            </SheetContent>
          </Sheet>
        </div>
        <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userProfile={profile} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-full">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
