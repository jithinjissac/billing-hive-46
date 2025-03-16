
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
  
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png" 
              alt="Company Logo" 
              className="h-10 w-auto" 
            />
            <span className="ml-2 font-bold text-xl">Billing Hive</span>
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
      <main className="flex-1 p-8 ml-64">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
