
import { Customer, Invoice } from "@/types/invoice";

// Dummy customers
export const dummyCustomers: Customer[] = [
  {
    id: "cust-001",
    name: "MACFAST",
    email: "info@macfast.org",
    phone: "+91-9876543210",
    address: "Tiruvalla, Pathanamthitta, Kerala - 689101",
  },
  {
    id: "cust-002",
    name: "St. Thomas College",
    email: "stthomas@example.com",
    phone: "+91-9876543211",
    address: "Kozhencherry, Kerala - 689641",
  },
  {
    id: "cust-003",
    name: "Kerala University",
    email: "info@keralauniversity.ac.in",
    phone: "+91-9876543212",
    address: "Thiruvananthapuram, Kerala - 695034",
  },
  {
    id: "cust-004",
    name: "MG University",
    email: "contact@mgu.ac.in",
    phone: "+91-9876543213",
    address: "Kottayam, Kerala - 686560",
  },
];

// Dummy invoices
export const dummyInvoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "TS-INV/221",
    customer: dummyCustomers[0],
    date: "2023-11-03",
    dueDate: "2023-12-03",
    status: "paid",
    items: [
      {
        id: "item-001",
        description: "MACFAST College Website, SSR, Library Cloud Hosting (20 March 2025 -20 March 2026)",
        quantity: 1,
        price: 24000,
      },
      {
        id: "item-002",
        description: "Annual Maintenance Charges (AMC)",
        quantity: 1,
        price: 5000,
      },
    ],
    subtotal: 29000,
    tax: 0,
    total: 29000,
    notes: "Upgrading the current cloud hosting service plans are extra payable as per the client requirements.",
  },
  {
    id: "inv-002",
    invoiceNumber: "TS-INV/222",
    customer: dummyCustomers[1],
    date: "2023-12-15",
    dueDate: "2024-01-15",
    status: "pending",
    items: [
      {
        id: "item-003",
        description: "Website Development",
        quantity: 1,
        price: 50000,
      },
      {
        id: "item-004",
        description: "SEO Setup",
        quantity: 1,
        price: 15000,
      },
    ],
    subtotal: 65000,
    tax: 6500,
    total: 71500,
    notes: "First payment of the project. Second payment will be due upon completion.",
  },
  {
    id: "inv-003",
    invoiceNumber: "TS-INV/223",
    customer: dummyCustomers[2],
    date: "2024-01-20",
    dueDate: "2024-02-20",
    status: "overdue",
    items: [
      {
        id: "item-005",
        description: "Student Management System - Monthly Subscription",
        quantity: 12,
        price: 5000,
      },
    ],
    subtotal: 60000,
    tax: 6000,
    total: 66000,
    notes: "Annual subscription billed monthly. Please pay before the due date to avoid service interruption.",
  },
  {
    id: "inv-004",
    invoiceNumber: "TS-INV/224",
    customer: dummyCustomers[3],
    date: "2024-02-05",
    dueDate: "2024-03-05",
    status: "draft",
    items: [
      {
        id: "item-006",
        description: "Server Maintenance - Q1 2024",
        quantity: 1,
        price: 18000,
      },
      {
        id: "item-007",
        description: "Backup Services - Q1 2024",
        quantity: 1,
        price: 12000,
      },
    ],
    subtotal: 30000,
    tax: 3000,
    total: 33000,
  },
];
