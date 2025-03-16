export type CurrencyCode = "INR" | "USD" | "GBP" | "AUD";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

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
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | string[];
  currency?: CurrencyCode;
  discount?: number;
  isTaxEnabled?: boolean;
  paymentDetails?: PaymentDetails;
  // Add creator information
  creatorId?: string;
  creatorName?: string;
}
