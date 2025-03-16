import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatDate, convertNumberToWords } from "@/utils/formatters";
import { Invoice } from "@/types/invoice";
import { getCompanySettings, getInvoiceSettings } from "@/services/settingsService";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceDetailsProps {
  invoice: Invoice;
  companySettings?: {
    name: string;
    address: string;
    uamNumber: string;
    phone: string;
    website: string;
    email: string;
    logo: string;
    stamp: string;
    slogan: string;
  };
  creatorName?: string;
}

export function InvoiceDetails({ 
  invoice,
  companySettings: initialCompanySettings,
  creatorName
}: InvoiceDetailsProps) {
  const [companySettings, setCompanySettings] = useState(
    initialCompanySettings || getCompanySettings()
  );
  const [invoiceSettings, setInvoiceSettings] = useState(getInvoiceSettings());
  const [companyData, setCompanyData] = useState<any>(null);
  
  const displayCreatorName = invoice.creatorName || creatorName || "RICHU EAPEN GEORGE";
  
  useEffect(() => {
    const fetchCompanySettings = async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();
        
      if (!error && data) {
        setCompanyData(data);
      }
    };
    
    fetchCompanySettings();
  }, []);
  
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setCompanySettings(getCompanySettings());
      setInvoiceSettings(getInvoiceSettings());
    };
    
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-800";
      case 'pending':
        return "bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-800";
      case 'overdue':
        return "bg-rose-100 text-rose-800 hover:bg-rose-100 hover:text-rose-800";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800";
    }
  };

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case "USD": return "$";
      case "GBP": return "£";
      case "AUD": return "A$";
      default: return "₹"; // INR default
    }
  };

  const currencySymbol = getCurrencySymbol(invoice.currency as string || "INR");
  const amountInWords = convertNumberToWords(invoice.total, invoice.currency as any || "INR");
  
  const invoiceNotes = Array.isArray(invoice.notes) 
    ? invoice.notes 
    : (typeof invoice.notes === 'string' 
        ? invoice.notes.split('\n').filter(note => note.trim() !== '') 
        : []);

  const discountAmount = invoice.discount > 0 ? (invoice.subtotal * (invoice.discount / 100)) : 0;
  
  const logoUrl = companyData?.logo_url || companySettings.logo || "";
  const stampUrl = companyData?.stamp_url || companySettings.stamp || "";

  return (
    <div className="invoice-container max-w-4xl mx-auto border border-gray-200 rounded-md overflow-hidden">
      <div className="h-2 bg-[#00b3b3]"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 border-b border-gray-200 gap-4">
        <div className="logo-section">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Company Logo"
              className="h-16 sm:h-20 w-auto object-contain"
              onError={(e) => {
                console.error("Logo load error:", e);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="h-16 sm:h-20 flex items-center text-gray-400 italic">
              No logo available
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">{companySettings.slogan}</div>
        </div>
        
        <div className="text-right text-xs sm:text-sm">
          <p className="break-words">
            {companySettings.name}, {companySettings.address}<br />
            UAM No: {companySettings.uamNumber}<br />
            Phone: {companySettings.phone}<br />
            Web: {companySettings.website}<br />
            E-mail: {companySettings.email}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between p-4 sm:p-6 bg-gray-50 border-b border-gray-200 gap-4">
        <h1 className="text-xl sm:text-2xl text-gray-600 font-normal">INVOICE</h1>
        <div className="text-right text-xs sm:text-sm">
          <p>
            <span className="font-bold">Date: </span>{formatDate(invoice.date)}<br />
            <span className="font-bold">Invoice No: </span>{invoice.invoiceNumber}<br />
            {invoice.dueDate && <><span className="font-bold">Due Date: </span>{formatDate(invoice.dueDate)}<br /></>}
            {invoice.currency && <><span className="font-bold">Currency: </span>{invoice.currency}</>}
          </p>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="inline-block px-3 sm:px-4 py-1 mb-2 bg-[#00b3b3] text-white text-xs sm:text-sm">BILL TO</div>
        <p className="text-xs sm:text-sm break-words">
          <span className="font-bold">{invoice.customer.name}</span><br />
          {invoice.customer.email && <>{invoice.customer.email}<br /></>}
          {invoice.customer.phone && <>{invoice.customer.phone}<br /></>}
          <span className="whitespace-pre-line">{invoice.customer.address}</span>
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-gray-600 text-xs sm:text-sm">ITEM</TableHead>
              <TableHead className="text-gray-600 text-xs sm:text-sm">DESCRIPTION</TableHead>
              <TableHead className="text-right text-gray-600 text-xs sm:text-sm">AMOUNT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item) => (
              item.quantity > 0 ? (
                <TableRow key={item.id}>
                  <TableCell className="align-top font-medium text-xs sm:text-sm">
                    {item.name || 'Unnamed Item'}
                  </TableCell>
                  <TableCell className="align-top text-xs sm:text-sm">
                    {item.description}
                    {item.specs && item.specs.length > 0 ? (
                      <ul className="list-none pl-0 text-xs text-gray-500 space-y-1 mt-1">
                        {item.specs.map((spec, index) => (
                          <li key={index}>• {spec}</li>
                        ))}
                      </ul>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {formatCurrency(item.quantity * item.price, invoice.currency as any)}
                  </TableCell>
                </TableRow>
              ) : null
            ))}
            <TableRow className="font-bold">
              <TableCell className="text-xs sm:text-sm">SUB TOTAL</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(invoice.subtotal, invoice.currency as any)}</TableCell>
            </TableRow>
            {invoice.tax > 0 && (
              <TableRow>
                <TableCell className="text-xs sm:text-sm">TAX</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(invoice.tax, invoice.currency as any)}</TableCell>
              </TableRow>
            )}
            {invoice.discount > 0 && (
              <TableRow>
                <TableCell className="text-xs sm:text-sm">DISCOUNT</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right text-xs sm:text-sm">-{formatCurrency(discountAmount, invoice.currency as any)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:justify-end p-3 sm:p-4 border-t border-b border-gray-200">
        <div className="bg-gray-600 text-white px-3 py-1 mb-2 sm:mb-0 sm:mr-3 text-xs sm:text-sm sm:min-w-40 break-words">
          {amountInWords}
        </div>
        <div className="bg-[#00b3b3] text-white px-3 py-1 text-xs sm:text-sm font-bold text-right w-full sm:w-24">
          {formatCurrency(invoice.total, invoice.currency as any)}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between p-4 sm:p-6 border-b border-gray-200 gap-4">
        <div className="payment-details text-xs sm:text-sm">
          <h3 className="underline font-bold mb-2">Payment Account Details</h3>
          <p className="mb-1 break-words">
            Account Holder: {invoice.paymentDetails?.accountHolder || "Jithin Jacob Issic"}<br />
            Bank Name: {invoice.paymentDetails?.bankName || "Federal Bank"}<br />
            Account Number: {invoice.paymentDetails?.accountNumber || "99980111697400"}<br />
            IFSC: {invoice.paymentDetails?.ifsc || "FDRL0001443"}<br />
            Branch: {invoice.paymentDetails?.branch || "Mallappally"}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-xs sm:text-sm mb-2">
            For {companySettings.name},<br />
            <span className="font-bold">{displayCreatorName}</span>
          </div>
          {stampUrl ? (
            <img 
              src={stampUrl}
              alt="Company Stamp"
              className="w-20 sm:w-24 h-auto inline-block object-contain"
              onError={(e) => {
                console.error("Stamp load error:", e);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-20 sm:w-24 h-20 sm:h-24 inline-block border border-dashed border-gray-300 flex items-center justify-center text-gray-400 italic text-xs">
              No stamp available
            </div>
          )}
        </div>
      </div>
      
      <div className="py-3 sm:py-4 text-center border-b border-gray-200 text-sm sm:text-base">
        {invoiceSettings.defaultNotes}
      </div>
      
      <div className="bg-gray-600 text-white p-3 sm:p-4 text-center text-xs sm:text-sm italic">
        {invoiceSettings.footerText}
      </div>
      
      <div className="bg-[#00b3b3] text-white p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-bold mb-2">Note:</h3>
        <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1 break-words">
          {invoiceNotes.length > 0 ? (
            invoiceNotes.map((note, index) => (
              <li key={index}>{note}</li>
            ))
          ) : (
            <li>No additional notes for this invoice.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

