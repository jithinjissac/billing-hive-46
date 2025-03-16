
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Download, Edit, MoreHorizontal, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { generatePDF } from "@/utils/pdf";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";

export function InvoicesList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchInvoices();
  }, []);
  
  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      
      // Fetch invoices with customer information
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers:customer_id (*)
        `)
        .order('created_at', { ascending: false });
      
      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError);
        toast.error("Failed to load invoices");
        return;
      }
      
      // Format the data to match our app's structure
      const formattedInvoices = invoicesData.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        date: inv.date,
        dueDate: inv.due_date,
        status: inv.status,
        subtotal: Number(inv.subtotal),
        tax: Number(inv.tax),
        total: Number(inv.total),
        currency: inv.currency,
        notes: inv.notes,
        items: [], // Add the missing items property as an empty array
        customer: {
          id: inv.customers.id,
          name: inv.customers.name,
          email: inv.customers.email || '',
          phone: inv.customers.phone || '',
          address: inv.customers.address || '',
        }
      }));
      
      setInvoices(formattedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadPDF = async (invoice: any) => {
    try {
      // We need to fetch the complete invoice with items first
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*, item_specs(*)')
        .eq('invoice_id', invoice.id);
        
      if (itemsError) {
        console.error("Error fetching invoice items:", itemsError);
        toast.error("Failed to download invoice");
        return;
      }
      
      // Format the items
      const items = itemsData.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        price: Number(item.price),
        specs: item.item_specs?.map((spec: any) => spec.spec_text) || []
      }));
      
      // Create complete invoice object with items
      const completeInvoice = {
        ...invoice,
        items
      };
      
      await generatePDF(completeInvoice);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download invoice");
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting invoice:", error);
        toast.error("Failed to delete invoice");
        return;
      }
      
      setInvoices(invoices.filter(invoice => invoice.id !== id));
      toast.success("Invoice deleted successfully");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>{formatDate(invoice.date)}</TableCell>
                <TableCell>{invoice.customer.name}</TableCell>
                <TableCell>{formatCurrency(invoice.total, invoice.currency as any)}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/invoices/edit/${invoice.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete Invoice #{invoice.invoiceNumber}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(invoice.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
