
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const location = useLocation();
  
  return (
    <div className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png" 
              alt="Company Logo" 
              className="h-10 w-auto" 
            />
            <span className="ml-2 font-bold text-xl">Billing Hive</span>
          </div>
        </div>
        
        <div className="flex-1 px-3 py-2">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.href || 
                  (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t">
          <button
            className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            onClick={() => {
              // In a real app, this would log out the user
              alert("Logout functionality would go here");
            }}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
