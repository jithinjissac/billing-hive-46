
import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyData {
  month: string;
  paid: number;
  pending: number;
  overdue: number;
}

export function InvoiceStats() {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchInvoiceStats();
  }, []);
  
  const fetchInvoiceStats = async () => {
    try {
      setIsLoading(true);
      
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('date, status, total');
        
      if (error) throw error;
      
      // Process the data to group by month
      const monthlyData: { [key: string]: MonthlyData } = {};
      
      // Get current year
      const currentYear = new Date().getFullYear();
      
      // Initialize with the last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        monthlyData[monthKey] = {
          month: monthName,
          paid: 0,
          pending: 0,
          overdue: 0
        };
      }
      
      // Fill in the data
      invoices?.forEach(invoice => {
        const invoiceDate = new Date(invoice.date);
        // Only include invoices from current year
        if (invoiceDate.getFullYear() === currentYear) {
          const monthKey = `${invoiceDate.getFullYear()}-${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}`;
          
          if (monthlyData[monthKey]) {
            if (invoice.status === 'paid') {
              monthlyData[monthKey].paid += Number(invoice.total);
            } else if (invoice.status === 'pending') {
              monthlyData[monthKey].pending += Number(invoice.total);
            } else if (invoice.status === 'overdue') {
              monthlyData[monthKey].overdue += Number(invoice.total);
            }
          }
        }
      });
      
      // Convert to array for chart
      const chartDataArray = Object.values(monthlyData);
      
      setChartData(chartDataArray);
    } catch (error) {
      console.error("Error fetching invoice stats:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar 
            dataKey="paid" 
            name="Paid" 
            stackId="a" 
            fill="#10b981" 
            radius={[0, 0, 0, 0]} 
          />
          <Bar 
            dataKey="pending" 
            name="Pending" 
            stackId="a" 
            fill="#f59e0b" 
            radius={[0, 0, 0, 0]} 
          />
          <Bar 
            dataKey="overdue" 
            name="Overdue" 
            stackId="a" 
            fill="#ef4444" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
