
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TotalsWidget } from "@/components/dashboard/TotalsWidget";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { InvoiceStats } from "@/components/dashboard/InvoiceStats";
import { MoveRight, Plus } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0
  });
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchDashboardData = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        
        // Fetch all invoices with a more efficient query
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('status')
          .limit(1000);
        
        if (error) throw error;
        
        if (isMounted) {
          // Calculate dashboard metrics
          const totalCount = invoices?.length || 0;
          const paidCount = invoices?.filter(inv => inv.status === 'paid').length || 0;
          const pendingCount = invoices?.filter(inv => inv.status === 'pending').length || 0;
          const overdueCount = invoices?.filter(inv => inv.status === 'overdue').length || 0;
          
          setDashboardData({
            totalInvoices: totalCount,
            paidInvoices: paidCount,
            pendingInvoices: pendingCount,
            overdueInvoices: overdueCount
          });
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchDashboardData();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Memoize the card grid to prevent unnecessary re-renders
  const totalsGrid = useMemo(() => (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <TotalsWidget 
        title="Total Invoices" 
        value={dashboardData.totalInvoices} 
        isLoading={isLoading}
      />
      <TotalsWidget 
        title="Paid Invoices" 
        value={dashboardData.paidInvoices}
        isLoading={isLoading}
      />
      <TotalsWidget 
        title="Pending Invoices" 
        value={dashboardData.pendingInvoices}
        isLoading={isLoading}
      />
      <TotalsWidget 
        title="Overdue Invoices" 
        value={dashboardData.overdueInvoices}
        isLoading={isLoading}
      />
    </div>
  ), [dashboardData, isLoading]);
  
  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button 
          onClick={() => navigate("/invoices/create")}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>
      
      {totalsGrid}
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7 mb-6">
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
