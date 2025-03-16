
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Invoice, CurrencyCode } from "@/types/invoice";
import { supabase } from "@/integrations/supabase/client";

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (invoice: Invoice) => {
    setIsSubmitting(true);
    
    try {
      console.log("Creating invoice:", invoice);
      
      // Ensure currency is one of the valid enum values
      const currency = (invoice.currency as CurrencyCode) || "INR";
      
      // Ensure status is a valid database enum value
      const status = invoice.status;
      
      // First, insert the invoice record
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoice.invoiceNumber,
          customer_id: invoice.customer.id,
          date: invoice.date,
          due_date: invoice.dueDate,
          status: status,
          subtotal: invoice.subtotal,
          tax: invoice.isTaxEnabled ? invoice.tax : 0,
          total: invoice.total,
          notes: invoice.notes,
          currency: currency,
          discount: invoice.discount || 0
        })
        .select()
        .single();
        
      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        toast.error("Failed to create invoice");
        return;
      }
      
      // Then insert all invoice items
      const itemsToInsert = invoice.items.map(item => ({
        invoice_id: invoiceData.id, // Use the ID returned from the insert
        name: item.name || "", // Store the item name
        description: item.description,
        quantity: item.quantity,
        price: item.price
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
        
      if (itemsError) {
        console.error("Error creating invoice items:", itemsError);
        toast.error("Failed to create invoice items");
        return;
      }
      
      // Create payment details if not existing
      const { error: paymentError } = await supabase
        .from('payment_details')
        .insert({
          invoice_id: invoiceData.id // Use the ID returned from the insert
        });
        
      if (paymentError) {
        console.error("Error creating payment details:", paymentError);
        // Not critical, so just log, don't show error to user
      }
      
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
