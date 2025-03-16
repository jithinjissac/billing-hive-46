
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentInvoices() {
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchRecentInvoices = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            date,
            status,
            total,
            currency,
            customers:customer_id (name)
          `)
          .order('date', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        if (isMounted) {
          setRecentInvoices(data || []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching recent invoices:", error);
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchRecentInvoices();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {recentInvoices.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No recent invoices</p>
        </div>
      ) : (
        recentInvoices.map((invoice) => (
          <Link 
            key={invoice.id} 
            to={`/invoices/${invoice.id}`}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col">
              <span className="font-medium">#{invoice.invoice_number}</span>
              <span className="text-sm text-muted-foreground">
                {invoice.customers?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</span>
              <Badge 
                className={
                  invoice.status === "paid" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-800" :
                  invoice.status === "pending" ? "bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-800" :
                  "bg-rose-100 text-rose-800 hover:bg-rose-100 hover:text-rose-800"
                }
                variant="outline"
              >
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
