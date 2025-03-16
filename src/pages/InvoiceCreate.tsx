
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Invoice } from "@/types/invoice";

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (invoice: Invoice) => {
    setIsSubmitting(true);
    
    try {
      // In a real app, we would send the data to an API
      console.log("Creating invoice:", invoice);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Invoice created successfully!", {
        description: `Invoice #${invoice.invoiceNumber} has been created.`,
      });
      
      navigate("/invoices");
    } catch (error) {
      console.error("Failed to create invoice:", error);
      toast.error("Failed to create invoice", {
        description: "Please try again or contact support if the issue persists.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <InvoiceForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default InvoiceCreate;
