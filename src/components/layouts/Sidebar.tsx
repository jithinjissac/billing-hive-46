
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  X,
} from "lucide-react";

interface SidebarProps {
  children?: React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function Sidebar({ children, showCloseButton = false, onClose }: SidebarProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  const logoUrl = "/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png";

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`${!isMobile ? "w-64 border-r bg-white" : "h-full bg-white"}`}>
      <div className="flex flex-col h-full">
        {(showCloseButton && isMobile) && (
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={logoUrl}
                alt="TechiusPay"
                className="h-8 w-auto"
              />
              <span className="font-semibold text-lg">TechiusPay</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
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
                  src={logoUrl}
                  alt="TechiusPay"
                  className="h-10 w-auto"
                />
                <span className="font-semibold text-lg">TechiusPay</span>
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
      {children}
    </div>
  );
}
