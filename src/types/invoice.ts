
// If this file contains more than just the Invoice type, make sure to include those as well
// This is just updating the InvoiceItem interface to add the name property

export type CurrencyCode = "INR" | "USD" | "GBP" | "AUD";

export interface PaymentDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface InvoiceItem {
  id: string;
  name?: string;  // Added name field
  description: string;
  quantity: number;
  price: number;
  specs?: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  date: string;
  dueDate: string;
  status: "draft" | "pending" | "paid" | "overdue";
  items: InvoiceItem[];
  currency?: CurrencyCode;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  discount?: number;
  isTaxEnabled?: boolean;
  paymentDetails?: PaymentDetails;
}
