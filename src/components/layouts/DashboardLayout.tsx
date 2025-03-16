
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const logoUrl = "/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png";
  
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <div className="flex items-center">
            <img 
              src={logoUrl} 
              alt="TechiusPay Logo" 
              className="h-8 w-auto" 
            />
            <span className="ml-2 font-bold text-lg">TechiusPay</span>
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
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {children}
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
