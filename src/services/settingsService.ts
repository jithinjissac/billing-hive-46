
// Default company settings
const defaultCompanySettings = {
  name: "Techius Solutions",
  address: "Mallappally, Kerala",
  uamNumber: "KL11D0004260",
  phone: "+91-9961560545",
  website: "www.techiussolutions.in",
  email: "info@techiussolutions.in",
  logo: "/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png"
};

// Default invoice settings
const defaultInvoiceSettings = {
  invoicePrefix: "INV-",
  defaultDueDays: 30,
  defaultTaxRate: 10,
  accentColor: "#00b3b3",
  defaultNotes: "Thank you for your business!",
  footerText: "Logic will get you from A to B. Imagination will take you everywhere. - Albert Einstein",
  template: "modern"
};

// Get company settings
export function getCompanySettings() {
  const storedSettings = localStorage.getItem('companySettings');
  if (storedSettings) {
    return JSON.parse(storedSettings);
  }
  return defaultCompanySettings;
}

// Update company settings
export function updateCompanySettings(settings: typeof defaultCompanySettings) {
  localStorage.setItem('companySettings', JSON.stringify(settings));
}

// Get invoice settings
export function getInvoiceSettings() {
  const storedSettings = localStorage.getItem('invoiceSettings');
  if (storedSettings) {
    return JSON.parse(storedSettings);
  }
  return defaultInvoiceSettings;
}

// Update invoice settings
export function updateInvoiceSettings(settings: typeof defaultInvoiceSettings) {
  localStorage.setItem('invoiceSettings', JSON.stringify(settings));
}
