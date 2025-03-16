
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileDown } from "lucide-react";
import { InvoicesList } from "@/components/invoices/InvoicesList";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { Invoice } from "@/types/invoice";
import { formatDate, formatCurrency } from "@/utils/formatters";

const Invoices = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  useEffect(() => {
    // Fetch invoices once on component mount
    fetchInvoices();
  }, []);
  
  useEffect(() => {
    // Apply filters whenever searchQuery or statusFilter changes
    applyFilters();
  }, [searchQuery, statusFilter, invoices]);
  
  const fetchInvoices = async () => {
    try {
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
        items: [], // We'll fetch items separately when needed
        discount: Number(inv.discount) || 0,
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
    }
  };
  
  const applyFilters = () => {
    let filtered = [...invoices];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.customer.name.toLowerCase().includes(query) ||
        formatCurrency(invoice.total, invoice.currency).toLowerCase().includes(query)
      );
    }
    
    setFilteredInvoices(filtered);
  };
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Prepare data for export
      const dataToExport = filteredInvoices.map(invoice => ({
        'Invoice Number': invoice.invoiceNumber,
        'Date': formatDate(invoice.date),
        'Due Date': formatDate(invoice.dueDate),
        'Customer': invoice.customer.name,
        'Status': invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1),
        'Subtotal': invoice.subtotal,
        'Tax': invoice.tax,
        'Total': invoice.total,
        'Currency': invoice.currency
      }));
      
      // Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      // Create a workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
      
      // Write the workbook to a file and download it
      XLSX.writeFile(workbook, "TechiusPay_Invoices.xlsx");
      
      toast.success("Invoices exported successfully");
    } catch (error) {
      console.error("Error exporting invoices:", error);
      toast.error("Failed to export invoices");
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <Button 
            onClick={() => navigate("/invoices/create")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <InvoicesList searchQuery={searchQuery} statusFilter={statusFilter} />
    </DashboardLayout>
  );
};

export default Invoices;
