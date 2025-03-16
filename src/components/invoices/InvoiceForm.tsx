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
import { Trash, Plus, UserPlus } from "lucide-react";
import { Invoice, InvoiceItem, Customer, CurrencyCode } from "@/types/invoice";
import { formatCurrency } from "@/utils/formatters";
import { getInvoiceSettings, availableCurrencies } from "@/services/settingsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (invoice: Invoice) => void;
  isSubmitting: boolean;
  editMode?: boolean;
  initialInvoice?: Invoice;
  onSaveSuccess?: (invoiceId: string) => void;
}

export function InvoiceForm({ invoice, onSubmit, isSubmitting, editMode = false, initialInvoice, onSaveSuccess }: InvoiceFormProps) {
  // Get default settings
  const defaultSettings = getInvoiceSettings();
  
  // Use initialInvoice if provided (for edit mode), otherwise fallback to invoice
  const invoiceData = initialInvoice || invoice;
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(invoiceData?.invoiceNumber || generateInvoiceNumber());
  const [customerId, setCustomerId] = useState(invoiceData?.customer?.id || "");
  const [date, setDate] = useState(invoiceData?.date || new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState(invoiceData?.dueDate || getDefaultDueDate());
  const [status, setStatus] = useState<"draft" | "pending" | "paid" | "overdue">(
    invoiceData?.status || "pending"
  );
  const [items, setItems] = useState<InvoiceItem[]>(invoiceData?.items || [
    { id: crypto.randomUUID(), name: "", description: "", quantity: 1, price: 0 }
  ]);
  const [currency, setCurrency] = useState<CurrencyCode>(invoiceData?.currency as CurrencyCode || defaultSettings.defaultCurrency);
  const [discount, setDiscount] = useState(invoiceData?.discount || 0);
  const [isTaxEnabled, setIsTaxEnabled] = useState(invoiceData?.isTaxEnabled === true);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [availableNotes, setAvailableNotes] = useState<string[]>(defaultSettings.notes || []);
  const [newNote, setNewNote] = useState("");
  
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  
  useEffect(() => {
    fetchCustomers();
    fetchSettingsNotes();
  }, []);
  
  useEffect(() => {
    const calculatedSubtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
    
    const discountAmount = discount > 0 ? (calculatedSubtotal * (discount / 100)) : 0;
    const afterDiscount = calculatedSubtotal - discountAmount;
    
    const calculatedTax = isTaxEnabled ? afterDiscount * (defaultSettings.defaultTaxRate / 100) : 0;
    const calculatedTotal = afterDiscount + calculatedTax;
    
    setSubtotal(calculatedSubtotal);
    setTax(calculatedTax);
    setTotal(calculatedTotal);
  }, [items, discount, isTaxEnabled, defaultSettings.defaultTaxRate]);
  
  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      console.log("Fetching customers...");
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
        return;
      }
      
      console.log("Customers data:", data);
      
      if (data && data.length > 0) {
        const formattedCustomers = data.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
        }));
        
        console.log("Formatted customers:", formattedCustomers);
        setCustomers(formattedCustomers);
        
        // If we have customers and no customerId is selected, select the first one
        if (formattedCustomers.length > 0 && !customerId) {
          setCustomerId(formattedCustomers[0].id);
        }
      } else {
        console.log("No customers found or empty data array");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  
  const fetchSettingsNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('notes')
        .limit(1)
        .single();
        
      if (error) {
        console.error("Error fetching invoice settings notes:", error);
        return;
      }
      
      if (data && data.notes) {
        setAvailableNotes(data.notes);
        
        // If we have existing notes from invoice data, parse them and set as selected
        if (invoiceData?.notes) {
          const invoiceNoteLines = invoiceData.notes.split('\n').filter(note => note.trim() !== '');
          setSelectedNotes(invoiceNoteLines);
        } else {
          // Otherwise, don't select any notes by default
          setSelectedNotes([]);
        }
      }
    } catch (error) {
      console.error("Error fetching invoice settings notes:", error);
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
      { id: crypto.randomUUID(), name: "", description: "", quantity: 1, price: 0 }
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
  
  const handleAddCustomer = async (customer: Customer) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error adding customer:", error);
        toast.error("Failed to add customer");
        return;
      }
      
      toast.success("Customer added successfully!");
      setIsAddCustomerOpen(false);
      
      // Update customers list and select the new customer
      await fetchCustomers();
      setCustomerId(customer.id);
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer");
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCustomer = customers.find(c => c.id === customerId);
    
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    
    // Join selected notes into a string
    const notesText = selectedNotes.join('\n');
    
    const finalInvoiceData: Invoice = {
      id: invoiceData?.id || crypto.randomUUID(),
      invoiceNumber,
      customer: selectedCustomer,
      date,
      dueDate,
      status,
      items: items.filter(item => item.quantity > 0),  // Only include items with quantity > 0
      currency: currency as CurrencyCode,
      subtotal,
      tax,
      total,
      notes: notesText,
      discount,
      isTaxEnabled
    };
    
    onSubmit(finalInvoiceData);
    
    // If in edit mode and onSaveSuccess is provided, call it with the invoice ID
    if (editMode && onSaveSuccess && finalInvoiceData.id) {
      onSaveSuccess(finalInvoiceData.id);
    }
  };
  
  const handleStatusChange = (value: string) => {
    if (value === "draft" || value === "pending" || value === "paid" || value === "overdue") {
      setStatus(value as "draft" | "pending" | "paid" | "overdue");
    }
  };
  
  const handleNoteToggle = (note: string) => {
    setSelectedNotes(prevNotes => {
      if (prevNotes.includes(note)) {
        // Note exists, remove it
        return prevNotes.filter(n => n !== note);
      } else {
        // Note doesn't exist, add it
        return [...prevNotes, note];
      }
    });
  };
  
  const handleAddNewNote = () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }
    
    // Add to available notes
    setAvailableNotes(prev => [...prev, newNote]);
    
    // Add to selected notes as well (it's selected by default)
    setSelectedNotes(prev => [...prev, newNote]);
    
    // Clear the input
    setNewNote("");
    
    toast.success("Note added successfully!");
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
          <Label htmlFor="customer" className="flex justify-between">
            <span>Customer</span>
            <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Add New
                </Button>
              </DialogTrigger>
              <CustomerDialog 
                open={isAddCustomerOpen} 
                onOpenChange={setIsAddCustomerOpen}
                onSubmit={handleAddCustomer}
              />
            </Dialog>
          </Label>
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
              <TableHead className="w-[25%]">Item Name</TableHead>
              <TableHead className="w-[35%]">Description</TableHead>
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
                    value={item.name || ""}
                    onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                    placeholder="Item name"
                    required
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.description || ""}
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
              <TableCell colSpan={4} className="text-right">Subtotal</TableCell>
              <TableCell>{formatCurrency(subtotal, currency)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell colSpan={3} className="text-right">Discount (%)</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-20"
                />
              </TableCell>
              <TableCell>
                {discount > 0 ? `- ${formatCurrency(subtotal * (discount / 100), currency)}` : '-'}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell colSpan={3} className="text-right">Tax ({defaultSettings.defaultTaxRate}%)</TableCell>
              <TableCell>
                <div className="flex items-center justify-center">
                  <Switch 
                    checked={isTaxEnabled} 
                    onCheckedChange={setIsTaxEnabled}
                    id="tax-toggle"
                  />
                </div>
              </TableCell>
              <TableCell>{isTaxEnabled ? formatCurrency(tax, currency) : '-'}</TableCell>
              <TableCell></TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell colSpan={4} className="text-right font-bold">Total</TableCell>
              <TableCell className="font-bold">{formatCurrency(total, currency)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      
      <div className="space-y-4">
        <Label className="block text-base font-medium">Invoice Notes</Label>
        
        <div className="space-y-2">
          {availableNotes.map((note, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Checkbox 
                id={`note-${index}`} 
                checked={selectedNotes.includes(note)}
                onCheckedChange={() => handleNoteToggle(note)}
              />
              <Label 
                htmlFor={`note-${index}`}
                className="text-sm font-normal leading-tight cursor-pointer"
              >
                {note}
              </Label>
            </div>
          ))}
        </div>
        
        <div className="pt-4 space-y-2 border-t border-gray-200">
          <Label htmlFor="new-note">Add New Note</Label>
          <div className="flex gap-2">
            <Textarea
              id="new-note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter a new note to add to the invoice"
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={handleAddNewNote}
              className="mt-auto"
            >
              Add Note
            </Button>
          </div>
        </div>
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
