
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
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  date: string;
  dueDate: string;
  status: "draft" | "pending" | "paid" | "overdue";
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}
