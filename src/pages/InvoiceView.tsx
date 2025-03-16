import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, ArrowLeft, Edit, Eye } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { InvoiceDetails } from "@/components/invoices/InvoiceDetails";
import { generatePDF } from "@/utils/pdf";
import { Invoice } from "@/types/invoice";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCompanySettings } from "@/services/settingsService";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [pdfPreview, setPdfPreview] = useState<string | undefined>(undefined);
  const [companySettings, setCompanySettings] = useState(getCompanySettings());
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setCompanySettings(getCompanySettings());
      
      if (invoice) {
        generatePdfPreview(invoice);
      }
    };
    
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, [invoice]);
  
  const generatePdfPreview = async (invoiceData: Invoice) => {
    try {
      setIsPdfLoading(true);
      const preview = await generatePDF(invoiceData, false);
      setPdfPreview(preview);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      toast.error("Failed to generate PDF preview");
    } finally {
      setIsPdfLoading(false);
    }
  };
  
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        
        if (!id) {
          toast.error("Invoice ID not provided");
          navigate("/invoices");
          return;
        }
        
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .single();
        
        if (invoiceError) {
          console.error("Error fetching invoice:", invoiceError);
          toast.error("Failed to load invoice");
          navigate("/invoices");
          return;
        }
        
        if (!invoiceData) {
          toast.error("Invoice not found");
          navigate("/invoices");
          return;
        }
        
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', invoiceData.customer_id)
          .single();
        
        if (customerError) {
          console.error("Error fetching customer:", customerError);
          toast.error("Failed to load customer data");
          return;
        }
        
        const { data: itemsData, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*, item_specs(*)')
          .eq('invoice_id', id);
        
        if (itemsError) {
          console.error("Error fetching invoice items:", itemsError);
          toast.error("Failed to load invoice items");
          return;
        }
        
        const { data: paymentData } = await supabase
          .from('payment_details')
          .select('*')
          .eq('invoice_id', id)
          .maybeSingle();
        
        const items = itemsData.map(item => {
          const specs = item.item_specs?.map(spec => spec.spec_text) || [];
          return {
            id: item.id,
            name: item.name || "",
            description: item.description,
            quantity: item.quantity,
            price: Number(item.price),
            specs
          };
        });
        
        console.log("Mapped items with names:", items);
        
        let status = invoiceData.status as "draft" | "pending" | "paid" | "overdue";
        
        console.log("Notes from DB:", invoiceData.notes);
        
        const fullInvoice: Invoice = {
          id: invoiceData.id,
          invoiceNumber: invoiceData.invoice_number,
          customer: {
            id: customerData.id,
            name: customerData.name,
            email: customerData.email || '',
            phone: customerData.phone || '',
            address: customerData.address || '',
          },
          date: invoiceData.date,
          dueDate: invoiceData.due_date,
          status: status,
          items: items,
          subtotal: Number(invoiceData.subtotal),
          tax: Number(invoiceData.tax),
          total: Number(invoiceData.total),
          notes: invoiceData.notes || '',
          currency: invoiceData.currency,
          discount: Number(invoiceData.discount || 0),
          paymentDetails: paymentData ? {
            accountHolder: paymentData.account_holder,
            bankName: paymentData.bank_name,
            accountNumber: paymentData.account_number,
            ifsc: paymentData.ifsc,
            branch: paymentData.branch,
          } : undefined
        };
        
        console.log("Loaded invoice:", JSON.stringify(fullInvoice, null, 2));
        
        setInvoice(fullInvoice);
        
        await generatePdfPreview(fullInvoice);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Failed to load invoice");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoice();
  }, [id, navigate]);
  
  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      await generatePDF(invoice, true);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download invoice");
    }
  };
  
  const handlePrintPDF = async () => {
    if (!pdfPreview) return;
    
    try {
      const printFrame = document.createElement('iframe');
      printFrame.style.display = 'none';
      document.body.appendChild(printFrame);
      
      printFrame.src = pdfPreview;
      
      printFrame.onload = () => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
        } catch (err) {
          console.error('Print operation failed:', err);
          toast.error("Print operation failed. Please try downloading instead.");
        }
      };
    } catch (error) {
      console.error("Error printing PDF:", error);
      toast.error("Unable to print. Please check your browser settings or try downloading instead.");
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (!invoice || !id) return;
    
    if (newStatus !== 'draft' && newStatus !== 'pending' && newStatus !== 'paid' && 
        newStatus !== 'overdue') {
      toast.error("Invalid status value");
      return;
    }
    
    try {
      setIsUpdatingStatus(true);
      
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus as "draft" | "pending" | "paid" | "overdue" })
        .eq('id', id);
      
      if (error) {
        console.error("Error updating invoice status:", error);
        toast.error("Failed to update invoice status");
        return;
      }
      
      setInvoice(prev => {
        if (!prev) return null;
        
        const updatedStatus = newStatus as "draft" | "pending" | "paid" | "overdue";
        
        return {
          ...prev,
          status: updatedStatus
        };
      });
      
      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast.error("Failed to update invoice status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return "bg-emerald-500 hover:bg-emerald-600";
      case 'pending':
        return "bg-amber-500 hover:bg-amber-600";
      case 'overdue':
        return "bg-rose-500 hover:bg-rose-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
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
  
  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Invoice not found</h2>
          <p className="text-muted-foreground mt-2">The invoice you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-4" onClick={() => navigate("/invoices")}>
            Back to Invoices
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Invoice #{invoice.invoiceNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center mr-2">
            <span className="text-sm text-muted-foreground mr-2">Status:</span>
            <Select
              value={invoice?.status}
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className={`w-32 ${getStatusColor(invoice?.status || '')} text-white`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" onClick={handlePrintPDF}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={() => navigate(`/invoices/edit/${id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">
            <span className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              Invoice Details
            </span>
          </TabsTrigger>
          <TabsTrigger value="preview">
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              PDF Preview
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardContent className="p-6">
              <InvoiceDetails 
                invoice={invoice} 
                companySettings={companySettings}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardContent className="p-6">
              {isPdfLoading ? (
                <div className="flex justify-center items-center h-[800px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : pdfPreview ? (
                <div className="w-full flex justify-center">
                  <iframe
                    src={pdfPreview}
                    className="w-full h-[800px] border rounded"
                    title="Invoice PDF Preview"
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-[800px]">
                  <div className="text-center">
                    <p>Unable to generate PDF preview</p>
                    <Button 
                      onClick={() => generatePdfPreview(invoice)} 
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default InvoiceView;
