
import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCompanyLogo();
  }, []);
  
  const fetchCompanyLogo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('logo_url')
        .order('id', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        console.error("Error fetching company logo:", error);
        return;
      }
      
      if (data && data.logo_url) {
        setLogoUrl(data.logo_url);
      }
    } catch (error) {
      console.error("Error fetching company logo:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderLogo = () => {
    if (loading) {
      return <Skeleton className="h-10 w-14" />;
    }
    
    if (logoUrl) {
      return (
        <img 
          src={logoUrl} 
          alt="TechiusPay Logo" 
          className="h-10 w-auto" 
        />
      );
    }
    
    return null;
  };
  
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <div className="flex items-center">
            {renderLogo()}
            <span className="ml-2 font-bold text-xl">TechiusPay</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
