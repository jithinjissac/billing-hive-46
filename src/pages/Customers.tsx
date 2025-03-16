
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { CustomersList } from "@/components/customers/CustomersList";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  
  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customers</h1>
        <Button 
          onClick={() => setIsAddCustomerOpen(true)}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <CustomersList searchQuery={searchQuery} />
      
      <CustomerDialog 
        open={isAddCustomerOpen} 
        onOpenChange={setIsAddCustomerOpen} 
      />
    </DashboardLayout>
  );
};

export default Customers;
