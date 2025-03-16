
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TotalsWidget } from "@/components/dashboard/TotalsWidget";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { InvoiceStats } from "@/components/dashboard/InvoiceStats";
import { MoveRight, Plus } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const Dashboard = () => {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button 
          onClick={() => navigate("/invoices/create")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <TotalsWidget 
          title="Total Invoices" 
          value={42} 
          change={8} 
          trend="up" 
        />
        <TotalsWidget 
          title="Paid Invoices" 
          value={36} 
          change={5} 
          trend="up" 
        />
        <TotalsWidget 
          title="Pending Invoices" 
          value={4} 
          change={-2} 
          trend="down" 
        />
        <TotalsWidget 
          title="Overdue Invoices" 
          value={2} 
          change={-1} 
          trend="down" 
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Invoice Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceStats />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/invoices")}
              className="flex items-center gap-1 text-sm"
            >
              View All <MoveRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <RecentInvoices />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
