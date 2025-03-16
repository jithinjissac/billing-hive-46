
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Invoice } from "@/types/invoice";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const InvoiceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
            name: item.name || "",  // Include item name
            description: item.description,
            quantity: item.quantity,
            price: Number(item.price),
            specs
          };
        });
        
        let status = invoiceData.status;
        
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
          paymentDetails: paymentData ? {
            accountHolder: paymentData.account_holder,
            bankName: paymentData.bank_name,
            accountNumber: paymentData.account_number,
            ifsc: paymentData.ifsc,
            branch: paymentData.branch,
          } : undefined
        };
        
        setInvoice(fullInvoice);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Failed to load invoice");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoice();
  }, [id, navigate]);
  
  const handleSubmit = async (updatedInvoice: Invoice) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      
      const status = updatedInvoice.status;
      
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          invoice_number: updatedInvoice.invoiceNumber,
          customer_id: updatedInvoice.customer.id,
          date: updatedInvoice.date,
          due_date: updatedInvoice.dueDate,
          status: status,
          subtotal: updatedInvoice.subtotal,
          tax: updatedInvoice.tax,
          total: updatedInvoice.total,
          notes: updatedInvoice.notes,
          currency: updatedInvoice.currency,
          discount: updatedInvoice.discount || 0
        })
        .eq('id', id);
      
      if (invoiceError) {
        console.error("Error updating invoice:", invoiceError);
        toast.error("Failed to update invoice");
        return;
      }
      
      const { error: deleteItemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
      
      if (deleteItemsError) {
        console.error("Error deleting invoice items:", deleteItemsError);
        toast.error("Failed to update invoice items");
        return;
      }
      
      for (const item of updatedInvoice.items) {
        const { data: newItem, error: itemError } = await supabase
          .from('invoice_items')
          .insert({
            invoice_id: id,
            name: item.name || "",  // Include item name when updating
            description: item.description,
            quantity: item.quantity,
            price: item.price
          })
          .select()
          .single();
        
        if (itemError) {
          console.error("Error inserting invoice item:", itemError);
          toast.error("Failed to update invoice items");
          return;
        }
        
        if (item.specs && item.specs.length > 0 && newItem) {
          const specsToInsert = item.specs.map(spec => ({
            item_id: newItem.id,
            spec_text: spec
          }));
          
          const { error: specsError } = await supabase
            .from('item_specs')
            .insert(specsToInsert);
          
          if (specsError) {
            console.error("Error inserting item specs:", specsError);
          }
        }
      }
      
      if (updatedInvoice.paymentDetails) {
        const { error: paymentError } = await supabase
          .from('payment_details')
          .upsert({
            invoice_id: id,
            account_holder: updatedInvoice.paymentDetails.accountHolder,
            bank_name: updatedInvoice.paymentDetails.bankName,
            account_number: updatedInvoice.paymentDetails.accountNumber,
            ifsc: updatedInvoice.paymentDetails.ifsc,
            branch: updatedInvoice.paymentDetails.branch
          });
        
        if (paymentError) {
          console.error("Error updating payment details:", paymentError);
          toast.error("Failed to update payment details");
          return;
        }
      }
      
      toast.success("Invoice updated successfully");
      navigate(`/invoices/${id}`);
      
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveSuccess = (invoiceId: string) => {
    toast.success("Invoice updated successfully");
    navigate(`/invoices/${invoiceId}`);
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
          <Button variant="ghost" onClick={() => navigate(`/invoices/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Invoice #{invoice?.invoiceNumber}</h1>
        </div>
      </div>
      
      {invoice && (
        <InvoiceForm 
          editMode={true}
          initialInvoice={invoice}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </DashboardLayout>
  );
};

export default InvoiceEdit;
