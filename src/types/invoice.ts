
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  specs?: string[]; // Added specs for detailed descriptions
}

export type CurrencyCode = "INR" | "USD" | "GBP" | "AUD";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  date: string;
  dueDate: string;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  discount?: number;
  pdfPreview?: string;
  currency?: CurrencyCode;
  isTaxEnabled?: boolean;
  paymentDetails?: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
  };
}

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
}
