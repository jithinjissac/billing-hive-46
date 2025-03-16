
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  showCloseButton?: boolean;
  onClose?: () => void;
  userProfile?: any;
}

export function Sidebar({ showCloseButton = false, onClose, userProfile }: SidebarProps) {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };
  
  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Invoices",
      icon: FileText,
      href: "/invoices",
      active: pathname.includes("/invoices"),
    },
    {
      label: "Customers",
      icon: Users,
      href: "/customers",
      active: pathname.includes("/customers"),
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
      active: pathname === "/profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      active: pathname === "/settings",
    },
  ];
  
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col border-r bg-white h-screen overflow-hidden min-w-[220px] sticky top-0">
        <div className="flex h-14 items-center px-4 border-b">
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center font-bold text-lg"
          >
            <img 
              src="/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png" 
              alt="TechiusPay Logo" 
              className="h-8 w-auto mr-2" 
            />
            <span>TechiusPay</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 p-3">
          <nav className="grid items-start gap-2">
            {routes.map((route) => (
              <Link key={route.href} to={route.href}>
                <Button
                  variant={route.active ? "default" : "ghost"}
                  className={cn("w-full justify-start", 
                    route.active && "bg-[#00b3b3] hover:bg-[#00a3a3]"
                  )}
                >
                  <route.icon className="mr-2 h-4 w-4" />
                  {route.label}
                </Button>
              </Link>
            ))}
          </nav>
        </ScrollArea>
        
        {user && (
          <div className="p-3 border-t mt-auto">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.profile_picture_url} />
                  <AvatarFallback>
                    {user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium truncate max-w-[120px]">{userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}` : user.email}</p>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 mt-2"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
      
      {/* Mobile sidebar header with close button */}
      {showCloseButton && (
        <div className="h-14 flex items-center justify-between px-4 border-b lg:hidden">
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center font-bold text-lg"
          >
            <img 
              src="/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png" 
              alt="TechiusPay Logo" 
              className="h-8 w-auto mr-2" 
            />
            <span>TechiusPay</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      {/* Mobile Sidebar Content */}
      {showCloseButton && (
        <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 p-3">
            <nav className="grid items-start gap-2">
              {routes.map((route) => (
                <Link key={route.href} to={route.href} onClick={onClose}>
                  <Button
                    variant={route.active ? "default" : "ghost"}
                    className={cn("w-full justify-start", 
                      route.active && "bg-[#00b3b3] hover:bg-[#00a3a3]"
                    )}
                  >
                    <route.icon className="mr-2 h-4 w-4" />
                    {route.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </ScrollArea>
          
          {user && (
            <div className="p-3 border-t mt-auto">
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.profile_picture_url} />
                    <AvatarFallback>
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium truncate max-w-[180px]">{userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}` : user.email}</p>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 mt-2"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
