
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, MapPin, FileText, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Customer } from "@/types/invoice";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { format } from "date-fns";
import { CustomerDialog } from "@/components/customers/CustomerDialog";

interface CustomerInvoice {
  id: string;
  invoice_number: string;
  date: string;
  due_date: string;
  total: number;
  status: "draft" | "pending" | "paid" | "overdue";
  currency: string;
}

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const invoicesPerPage = 10;

  useEffect(() => {
    const fetchCustomerAndInvoices = async () => {
      try {
        setIsLoading(true);
        
        if (!id) {
          toast.error("Customer ID not provided");
          navigate("/customers");
          return;
        }
        
        // Fetch customer data
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
        
        if (customerError) {
          console.error("Error fetching customer:", customerError);
          toast.error("Failed to load customer data");
          navigate("/customers");
          return;
        }
        
        if (!customerData) {
          toast.error("Customer not found");
          navigate("/customers");
          return;
        }
        
        // Set customer data
        const customerInfo: Customer = {
          id: customerData.id,
          name: customerData.name,
          email: customerData.email || '',
          phone: customerData.phone || '',
          address: customerData.address || '',
        };
        
        setCustomer(customerInfo);
        
        // Count total invoices for pagination
        const { count, error: countError } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', id);
        
        if (countError) {
          console.error("Error counting invoices:", countError);
        } else if (count !== null) {
          setTotalInvoices(count);
          setTotalPages(Math.ceil(count / invoicesPerPage) || 1);
        }
        
        // Fetch customer invoices with pagination
        const from = (currentPage - 1) * invoicesPerPage;
        const to = from + invoicesPerPage - 1;
        
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('id, invoice_number, date, due_date, total, status, currency')
          .eq('customer_id', id)
          .order('date', { ascending: false })
          .range(from, to);
        
        if (invoicesError) {
          console.error("Error fetching invoices:", invoicesError);
          toast.error("Failed to load customer invoices");
        } else {
          setInvoices(invoicesData || []);
        }
        
      } catch (error) {
        console.error("Error loading customer details:", error);
        toast.error("Failed to load customer details");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomerAndInvoices();
  }, [id, navigate, currentPage]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return "bg-emerald-500 text-emerald-50";
      case 'pending':
        return "bg-amber-500 text-amber-50";
      case 'overdue':
        return "bg-rose-500 text-rose-50";
      default:
        return "bg-gray-500 text-gray-50";
    }
  };

  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    setCustomer(updatedCustomer);
    toast.success("Customer details updated successfully");
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Customer not found</h2>
          <p className="text-muted-foreground mt-2">The customer you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-4" onClick={() => navigate("/customers")}>
            Back to Customers
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/customers")} className="h-9">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Customer Details</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsEditDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Customer
          </Button>
          
          <Button 
            onClick={() => navigate("/invoices/create", { state: { customerId: customer.id } })}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold break-words">{customer.name}</h3>
              </div>
              
              {customer.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline break-words">
                    {customer.email}
                  </a>
                </div>
              )}
              
              {customer.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline break-words">
                    {customer.phone}
                  </a>
                </div>
              )}
              
              {customer.address && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-1 flex-shrink-0" />
                  <span className="whitespace-pre-line break-words">{customer.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Invoices</div>
                <div className="text-2xl font-bold">{totalInvoices}</div>
              </div>
              
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Paid</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </div>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold text-amber-600">
                  {invoices.filter(inv => inv.status === 'pending').length}
                </div>
              </div>
              
              <div className="bg-rose-50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Overdue</div>
                <div className="text-2xl font-bold text-rose-600">
                  {invoices.filter(inv => inv.status === 'overdue').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.due_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: invoice.currency || 'USD'
                          }).format(invoice.total)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/invoices/${invoice.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="mt-4 overflow-x-auto">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i} className="hidden sm:inline-block">
                          <PaginationLink
                            isActive={currentPage === i + 1}
                            onClick={() => handlePageChange(i + 1)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No invoices found</h3>
              <p className="text-muted-foreground mt-1">This customer doesn't have any invoices yet.</p>
              <Button 
                onClick={() => navigate("/invoices/create", { state: { customerId: customer.id } })}
                className="mt-4"
              >
                Create Invoice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        customer={customer}
        onSubmit={handleCustomerUpdate}
      />
    </DashboardLayout>
  );
};

export default CustomerDetail;
