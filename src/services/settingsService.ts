
import { CurrencyCode, CurrencyInfo } from "@/types/invoice";
import { supabase } from "@/integrations/supabase/client";

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
export async function getCompanySettingsFromDB() {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.error("Error fetching company settings:", error);
      return null;
    }
    
    return {
      name: data.name,
      address: data.address,
      uamNumber: data.uam_number,
      phone: data.phone,
      website: data.website,
      email: data.email,
      logo: data.logo_url,
      stamp: data.stamp_url,
      slogan: data.slogan
    };
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return null;
  }
}

// Get company settings - compatible with existing code
export function getCompanySettings() {
  // First try to get from localStorage for backward compatibility
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

// Get invoice settings from DB
export async function getInvoiceSettingsFromDB() {
  try {
    const { data, error } = await supabase
      .from('invoice_settings')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.error("Error fetching invoice settings:", error);
      return null;
    }
    
    return {
      invoicePrefix: data.invoice_prefix,
      defaultDueDays: data.default_due_days,
      defaultTaxRate: data.default_tax_rate,
      accentColor: "#00b3b3", // Hardcoded for now
      defaultNotes: data.default_notes,
      footerText: data.footer_text,
      template: "modern", // Hardcoded for now
      defaultCurrency: data.default_currency as CurrencyCode,
      notes: data.notes
    };
  } catch (error) {
    console.error("Error fetching invoice settings:", error);
    return null;
  }
}

// Get invoice settings compatible with existing code
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
