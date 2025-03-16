
import { CurrencyCode, CurrencyInfo } from "@/types/invoice";

// Default company settings
const defaultCompanySettings = {
  name: "Techius Solutions",
  address: "Mallappally, Kerala",
  uamNumber: "KL11D0004260",
  phone: "+91-9961560545",
  website: "www.techiussolutions.in",
  email: "info@techiussolutions.in",
  logo: "/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png",
  stamp: "", // Added stamp field
  slogan: "EXPERIENCE THE DIGITAL INNOVATION" // Added company slogan
};

// Default invoice settings
const defaultInvoiceSettings = {
  invoicePrefix: "TS-INV/",
  defaultDueDays: 30,
  defaultTaxRate: 10,
  accentColor: "#00b3b3",
  defaultNotes: "Thank you for your business!",
  footerText: "Logic will get you from A to B. Imagination will take you everywhere. - Albert Einstein",
  template: "modern",
  defaultCurrency: "INR" as CurrencyCode,
  notes: [
    "Upgrading the current cloud hosting service plans are extra payable as per the client requirements.",
    "Server downtime may occur rarely during scheduled maintenances or damages due to natural disasters."
  ]
};

// Available currencies
export const availableCurrencies: CurrencyInfo[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" }
];

// Database simulation (in a real app, this would be a database connection)
const db = {
  getItem: (key: string) => {
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    // Trigger event for real-time updates
    const event = new CustomEvent('settings-updated', { detail: { key, value } });
    window.dispatchEvent(event);
    return true;
  }
};

// Get company settings
export function getCompanySettings() {
  const storedSettings = db.getItem('companySettings');
  if (storedSettings) {
    return JSON.parse(storedSettings);
  }
  return defaultCompanySettings;
}

// Update company settings
export function updateCompanySettings(settings: typeof defaultCompanySettings) {
  return db.setItem('companySettings', JSON.stringify(settings));
}

// Get invoice settings
export function getInvoiceSettings() {
  const storedSettings = db.getItem('invoiceSettings');
  if (storedSettings) {
    return JSON.parse(storedSettings);
  }
  return defaultInvoiceSettings;
}

// Update invoice settings
export function updateInvoiceSettings(settings: typeof defaultInvoiceSettings) {
  return db.setItem('invoiceSettings', JSON.stringify(settings));
}

// Get currency info by code
export function getCurrencyByCode(code: CurrencyCode): CurrencyInfo {
  return availableCurrencies.find(c => c.code === code) || availableCurrencies[0];
}
