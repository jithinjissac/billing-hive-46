
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, ArrowLeft, Edit, Eye } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { InvoiceDetails } from "@/components/invoices/InvoiceDetails";
import { generatePDF } from "@/utils/pdf";
import { dummyInvoices } from "@/data/dummyData";
import { Invoice } from "@/types/invoice";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCompanySettings } from "@/services/settingsService";

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [pdfPreview, setPdfPreview] = useState<string | undefined>(undefined);
  const [companySettings, setCompanySettings] = useState(getCompanySettings());
  
  // Listen for settings changes
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setCompanySettings(getCompanySettings());
      
      // Regenerate PDF preview if invoice exists
      if (invoice) {
        generatePdfPreview(invoice);
      }
    };
    
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, [invoice]);
  
  // Generate PDF preview without downloading
  const generatePdfPreview = async (invoiceData: Invoice) => {
    try {
      const preview = await generatePDF(invoiceData, false);
      setPdfPreview(preview);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
    }
  };
  
  useEffect(() => {
    // In a real app, this would be an API call
    const fetchInvoice = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find invoice in dummy data
        const foundInvoice = dummyInvoices.find(inv => inv.id === id);
        
        if (foundInvoice) {
          setInvoice(foundInvoice);
          
          // Generate PDF preview without download
          await generatePdfPreview(foundInvoice);
        } else {
          toast.error("Invoice not found");
          navigate("/invoices");
        }
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
      await generatePDF(invoice, true); // true to trigger download
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download invoice");
    }
  };
  
  const handlePrintPDF = async () => {
    if (!pdfPreview) return;
    
    // Open PDF in new window and print it
    const printWindow = window.open(pdfPreview, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    } else {
      toast.error("Unable to open print window. Please check your pop-up blocker settings.");
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
              {pdfPreview ? (
                <div className="w-full flex justify-center">
                  <iframe
                    src={pdfPreview}
                    className="w-full h-[800px] border rounded"
                    title="Invoice PDF Preview"
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-[800px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
