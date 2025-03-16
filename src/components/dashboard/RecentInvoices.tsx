
import { Badge } from "@/components/ui/badge";
import { dummyInvoices } from "@/data/dummyData";
import { formatCurrency } from "@/utils/formatters";
import { Link } from "react-router-dom";

export function RecentInvoices() {
  // Get the 5 most recent invoices
  const recentInvoices = [...dummyInvoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  return (
    <div className="space-y-4">
      {recentInvoices.map((invoice) => (
        <Link 
          key={invoice.id} 
          to={`/invoices/${invoice.id}`}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col">
            <span className="font-medium">#{invoice.invoiceNumber}</span>
            <span className="text-sm text-muted-foreground">
              {invoice.customer.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatCurrency(invoice.total)}</span>
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
      ))}
      
      {recentInvoices.length === 0 && (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No recent invoices</p>
        </div>
      )}
    </div>
  );
}
