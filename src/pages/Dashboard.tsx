import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TotalsWidget } from "@/components/dashboard/TotalsWidget";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { InvoiceStats } from "@/components/dashboard/InvoiceStats";
import { MoveRight, Plus, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseHealthIndicator } from "@/components/dashboard/DatabaseHealthIndicator";
import { useHealthCheck } from "@/contexts/HealthCheckContext";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0
  });
  const { lastCheckStatus, forceHealthCheck } = useHealthCheck();
  
  // Create a fetchDashboardData function we can reuse
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setDataError(null);
      
      // Fetch all invoices with a more efficient query
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('status')
        .limit(1000);
      
      if (error) {
        console.error("Error fetching dashboard data:", error);
        setDataError("Failed to load dashboard data. Please try again.");
        return;
      }
      
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
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setDataError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    let isMounted = true;
    let timeout: number;
    
    const initializeDashboard = async () => {
      try {
        // Set a timeout to prevent infinite loading state
        timeout = window.setTimeout(() => {
          if (isMounted && isLoading) {
            console.error("Dashboard data fetch timeout - forcing load completion");
            if (isMounted) {
              setIsLoading(false);
              setDataError("Data loading timed out. Please check your connection and refresh.");
            }
          }
        }, 10000); // 10 second timeout
        
        // Only fetch data if the database is connected
        if (lastCheckStatus === true) {
          await fetchDashboardData();
        } else if (lastCheckStatus === false) {
          // If database is disconnected, show an error
          setDataError("Database is disconnected. Please check your connection and try again.");
          setIsLoading(false);
        }
        // If lastCheckStatus is null, we're still checking - keep loading state
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        if (isMounted) {
          setDataError("Failed to initialize dashboard. Please refresh the page.");
          setIsLoading(false);
        }
      }
    };
    
    initializeDashboard();
    
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [fetchDashboardData, lastCheckStatus]);
  
  // Effect to fetch data when database status changes to connected
  useEffect(() => {
    if (lastCheckStatus === true && dataError) {
      // Database is now connected but we had an error before, try to fetch data again
      fetchDashboardData();
    }
  }, [lastCheckStatus, dataError, fetchDashboardData]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      // First check database connection
      await forceHealthCheck();
      // Then fetch data
      await fetchDashboardData();
      toast.success("Dashboard refreshed");
    } catch (error) {
      toast.error("Failed to refresh dashboard");
    }
  };
  
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
  
  if (dataError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <p className="text-lg text-red-500 mb-4">{dataError}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => navigate("/invoices/create")}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>
      
      <DatabaseHealthIndicator />
      
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
