
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  children?: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [companyLogo, setCompanyLogo] = useState<string>("/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png");
  const [companyName, setCompanyName] = useState<string>("TechiusPay");
  
  useEffect(() => {
    fetchCompanySettings();
  }, []);
  
  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('name, logo_url')
        .order('id', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        console.error("Error fetching company settings:", error);
        return;
      }
      
      if (data) {
        setCompanyName(data.name);
        if (data.logo_url) {
          setCompanyLogo(data.logo_url);
        }
      }
    } catch (error) {
      console.error("Error fetching company settings:", error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {isMobile && (
        <div className="flex items-center justify-between h-16 px-4 border-b bg-white">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={companyLogo}
              alt={companyName}
              className="h-8 w-auto"
            />
            <span className="font-semibold text-lg">{companyName}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      )}
      <div
        className={`${
          !isMobile ? "w-60 border-r" : "fixed inset-0 z-50 bg-white/80 backdrop-blur-sm"
        } ${isMobile && !isOpen && "hidden"}`}
      >
        <div
          className={`${
            !isMobile ? "w-60" : "w-3/4 h-full bg-white border-r"
          } flex flex-col`}
        >
          {isMobile && (
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src={companyLogo}
                  alt={companyName}
                  className="h-8 w-auto"
                />
                <span className="font-semibold text-lg">{companyName}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="lg:hidden"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          )}
          <ScrollArea className="flex-1 p-4">
            {!isMobile && (
              <div className="flex items-center gap-2 px-2 py-4">
                <Link to="/" className="flex items-center gap-2">
                  <img 
                    src={companyLogo}
                    alt={companyName}
                    className="h-8 w-auto"
                  />
                  <span className="font-semibold text-lg">{companyName}</span>
                </Link>
              </div>
            )}
            <nav className="space-y-1.5 mt-4">
              <Link to="/dashboard">
                <Button
                  variant={isActive("/dashboard") ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/invoices">
                <Button
                  variant={
                    isActive("/invoices") ||
                    location.pathname.startsWith("/invoices/")
                      ? "default"
                      : "ghost"
                  }
                  className="w-full justify-start"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Invoices
                </Button>
              </Link>
              <Link to="/customers">
                <Button
                  variant={isActive("/customers") ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Customers
                </Button>
              </Link>
              <Link to="/settings">
                <Button
                  variant={isActive("/settings") ? "default" : "ghost"}
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </nav>
            <Separator className="my-6" />
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-muted-foreground">
                TechiusPay
              </div>
              <div className="text-xs text-muted-foreground">
                v1.0.0
              </div>
            </div>
            <div className="mt-auto pt-4">
              <Button variant="ghost" className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </ScrollArea>
        </div>
        {isOpen && isMobile && (
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
      {children}
    </>
  );
}
