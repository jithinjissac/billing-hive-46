
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Trash, Plus } from "lucide-react";
import { Invoice, InvoiceItem, Customer, CurrencyCode } from "@/types/invoice";
import { formatCurrency } from "@/utils/formatters";
import { getInvoiceSettings, availableCurrencies } from "@/services/settingsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (invoice: Invoice) => void;
  isSubmitting: boolean;
}

export function InvoiceForm({ invoice, onSubmit, isSubmitting }: InvoiceFormProps) {
  // Get default settings
  const defaultSettings = getInvoiceSettings();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoiceNumber || generateInvoiceNumber());
  const [customerId, setCustomerId] = useState(invoice?.customer.id || "");
  const [date, setDate] = useState(invoice?.date || new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState(invoice?.dueDate || getDefaultDueDate());
  const [status, setStatus] = useState<"draft" | "pending" | "paid" | "overdue">(invoice?.status || "pending");
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items || [
    { id: crypto.randomUUID(), description: "", quantity: 1, price: 0 }
  ]);
  const [notes, setNotes] = useState(invoice?.notes || defaultSettings.defaultNotes);
  const [currency, setCurrency] = useState<CurrencyCode>(invoice?.currency as CurrencyCode || defaultSettings.defaultCurrency);
  
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  // Calculate totals when items change
  useEffect(() => {
    const calculatedSubtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
    
    const calculatedTax = calculatedSubtotal * (defaultSettings.defaultTaxRate / 100);
    const calculatedTotal = calculatedSubtotal + calculatedTax;
    
    setSubtotal(calculatedSubtotal);
    setTax(calculatedTax);
    setTotal(calculatedTotal);
  }, [items, defaultSettings.defaultTaxRate]);
  
  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
        return;
      }
      
      if (data) {
        const formattedCustomers = data.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
        }));
        
        setCustomers(formattedCustomers);
        
        // If we have customers and no customerId is selected, select the first one
        if (formattedCustomers.length > 0 && !customerId) {
          setCustomerId(formattedCustomers[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  
  function generateInvoiceNumber() {
    const prefix = defaultSettings.invoicePrefix;
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }
  
  function getDefaultDueDate() {
    const date = new Date();
    date.setDate(date.getDate() + defaultSettings.defaultDueDays);
    return date.toISOString().substring(0, 10);
  }
  
  const handleAddItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), description: "", quantity: 1, price: 0 }
    ]);
  };
  
  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };
  
  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCustomer = customers.find(c => c.id === customerId);
    
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    
    const invoiceData: Invoice = {
      id: invoice?.id || crypto.randomUUID(),
      invoiceNumber,
      customer: selectedCustomer,
      date,
      dueDate,
      status,
      items,
      currency: currency as CurrencyCode,
      subtotal,
      tax,
      total,
      notes
    };
    
    onSubmit(invoiceData);
  };
  
  // Type guard to ensure value is a valid status
  const handleStatusChange = (value: string) => {
    if (value === "draft" || value === "pending" || value === "paid" || value === "overdue") {
      setStatus(value);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <Select
            value={customerId}
            onValueChange={setCustomerId}
            disabled={isLoadingCustomers}
            required
          >
            <SelectTrigger id="customer">
              <SelectValue placeholder={isLoadingCustomers ? "Loading customers..." : "Select customer"} />
            </SelectTrigger>
            <SelectContent>
              {customers.length === 0 ? (
                <SelectItem value="no-customers" disabled>
                  No customers found
                </SelectItem>
              ) : (
                customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={currency}
            onValueChange={(value) => setCurrency(value as CurrencyCode)}
          >
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map((currencyOption) => (
                <SelectItem key={currencyOption.code} value={currencyOption.code}>
                  {currencyOption.symbol} - {currencyOption.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
      </div>
      
      <Separator />
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Invoice Items</h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleAddItem}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    placeholder="Item description"
                    required
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                    required
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => handleItemChange(item.id, "price", Number(e.target.value))}
                    required
                    className="w-28"
                  />
                </TableCell>
                <TableCell>
                  {formatCurrency(item.quantity * item.price, currency)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
              <TableCell>{formatCurrency(subtotal, currency)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right">Tax ({defaultSettings.defaultTaxRate}%)</TableCell>
              <TableCell>{formatCurrency(tax, currency)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
              <TableCell className="font-bold">{formatCurrency(total, currency)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Payment terms, delivery notes, etc."
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Invoice"}
        </Button>
      </div>
    </form>
  );
}
