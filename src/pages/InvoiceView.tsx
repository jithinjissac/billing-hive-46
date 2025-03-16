
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, ArrowLeft, Edit } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { InvoiceDetails } from "@/components/invoices/InvoiceDetails";
import { generatePDF } from "@/utils/pdfGenerator";
import { dummyInvoices } from "@/data/dummyData";
import { Invoice } from "@/types/invoice";
import { toast } from "sonner";

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
      await generatePDF(invoice);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download invoice");
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
          <Button variant="outline" onClick={() => window.print()}>
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
      
      <Card>
        <CardContent className="p-6">
          <InvoiceDetails invoice={invoice} />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default InvoiceView;
