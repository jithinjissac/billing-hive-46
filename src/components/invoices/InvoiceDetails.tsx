
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
}

export function InvoiceDetails({ 
  invoice,
  companySettings: initialCompanySettings
}: InvoiceDetailsProps) {
  const [companySettings, setCompanySettings] = useState(
    initialCompanySettings || getCompanySettings()
  );
  const [invoiceSettings, setInvoiceSettings] = useState(getInvoiceSettings());
  
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
  
  // Parse notes from the invoice
  const invoiceNotes = Array.isArray(invoice.notes) 
    ? invoice.notes 
    : (typeof invoice.notes === 'string' 
        ? invoice.notes.split('\n').filter(note => note.trim() !== '') 
        : []);

  // Calculate discount amount
  const discountAmount = invoice.discount > 0 ? (invoice.subtotal * (invoice.discount / 100)) : 0;

  console.log("Company settings in InvoiceDetails:", companySettings);
  console.log("Logo URL:", companySettings.logo);
  console.log("Stamp URL:", companySettings.stamp);

  return (
    <div className="invoice-container max-w-4xl mx-auto border border-gray-200 rounded-md overflow-hidden">
      <div className="h-2 bg-[#00b3b3]"></div>
      
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="logo-section">
          {companySettings.logo ? (
            <img
              src={companySettings.logo}
              alt="Company Logo"
              className="h-20 w-auto object-contain"
              onError={(e) => {
                console.error("Logo load error:", e);
                const target = e.target as HTMLImageElement;
                target.src = "/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png";
              }}
            />
          ) : (
            <img
              src="/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png"
              alt="Default Company Logo"
              className="h-20 w-auto object-contain"
            />
          )}
          <div className="text-xs text-gray-500 mt-1">{companySettings.slogan}</div>
        </div>
        
        <div className="text-right text-sm">
          <p>
            {companySettings.name}, {companySettings.address}<br />
            UAM No: {companySettings.uamNumber}<br />
            Phone: {companySettings.phone}<br />
            Web: {companySettings.website}<br />
            E-mail: {companySettings.email}
          </p>
        </div>
      </div>
      
      <div className="flex justify-between p-6 bg-gray-50 border-b border-gray-200">
        <h1 className="text-2xl text-gray-600 font-normal">INVOICE</h1>
        <div className="text-right text-sm">
          <p>
            <span className="font-bold">Date: </span>{formatDate(invoice.date)}<br />
            <span className="font-bold">Invoice No: </span>{invoice.invoiceNumber}<br />
            {invoice.dueDate && <><span className="font-bold">Due Date: </span>{formatDate(invoice.dueDate)}<br /></>}
            {invoice.currency && <><span className="font-bold">Currency: </span>{invoice.currency}</>}
          </p>
        </div>
      </div>
      
      <div className="p-6 border-b border-gray-200">
        <div className="inline-block px-4 py-1 mb-2 bg-[#00b3b3] text-white text-sm">BILL TO</div>
        <p className="text-sm">
          <span className="font-bold">{invoice.customer.name}</span><br />
          {invoice.customer.email && <>{invoice.customer.email}<br /></>}
          {invoice.customer.phone && <>{invoice.customer.phone}<br /></>}
          <span className="whitespace-pre-line">{invoice.customer.address}</span>
        </p>
      </div>
      
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="text-gray-600">ITEM</TableHead>
            <TableHead className="text-gray-600">DESCRIPTION</TableHead>
            <TableHead className="text-right text-gray-600">AMOUNT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.items.map((item) => (
            item.quantity > 0 ? (
              <TableRow key={item.id}>
                <TableCell className="align-top font-medium">
                  {item.name || 'Unnamed Item'}
                </TableCell>
                <TableCell className="align-top">
                  {item.description}
                  {item.specs && item.specs.length > 0 ? (
                    <ul className="list-none pl-0 text-xs text-gray-500 space-y-1 mt-1">
                      {item.specs.map((spec, index) => (
                        <li key={index}>• {spec}</li>
                      ))}
                    </ul>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.quantity * item.price, invoice.currency as any)}
                </TableCell>
              </TableRow>
            ) : null
          ))}
          <TableRow className="font-bold">
            <TableCell>SUB TOTAL</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right">{formatCurrency(invoice.subtotal, invoice.currency as any)}</TableCell>
          </TableRow>
          {invoice.tax > 0 && (
            <TableRow>
              <TableCell>TAX</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">{formatCurrency(invoice.tax, invoice.currency as any)}</TableCell>
            </TableRow>
          )}
          {invoice.discount && invoice.discount > 0 && (
            <TableRow>
              <TableCell>DISCOUNT</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">-{formatCurrency(discountAmount, invoice.currency as any)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="flex justify-end p-4 border-t border-b border-gray-200">
        <div className="bg-gray-600 text-white px-3 py-1 mr-3 text-sm min-w-40">
          {amountInWords}
        </div>
        <div className="bg-[#00b3b3] text-white px-3 py-1 text-sm font-bold text-right w-24">
          {formatCurrency(invoice.total, invoice.currency as any)}
        </div>
      </div>
      
      <div className="flex justify-between p-6 border-b border-gray-200">
        <div className="payment-details text-sm">
          <h3 className="underline font-bold mb-2">Payment Account Details</h3>
          <p className="mb-1">
            Account Holder: {invoice.paymentDetails?.accountHolder || "Jithin Jacob Issic"}<br />
            Bank Name: {invoice.paymentDetails?.bankName || "Federal Bank"}<br />
            Account Number: {invoice.paymentDetails?.accountNumber || "99980111697400"}<br />
            IFSC: {invoice.paymentDetails?.ifsc || "FDRL0001443"}<br />
            Branch: {invoice.paymentDetails?.branch || "Mallappally"}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm mb-2">
            For {companySettings.name},<br />
            <span className="font-bold">RICHU EAPEN GEORGE</span>
          </div>
          {companySettings.stamp ? (
            <img 
              src={companySettings.stamp}
              alt="Company Stamp"
              className="w-24 h-auto inline-block object-contain"
              onError={(e) => {
                console.error("Stamp load error:", e);
                const target = e.target as HTMLImageElement;
                target.src = "/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png";
              }}
            />
          ) : (
            <img 
              src="/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png"
              alt="Default Company Stamp"
              className="w-24 h-auto inline-block object-contain"
            />
          )}
        </div>
      </div>
      
      <div className="py-4 text-center border-b border-gray-200 text-base">
        {invoiceSettings.defaultNotes}
      </div>
      
      <div className="bg-gray-600 text-white p-4 text-center text-sm italic">
        {invoiceSettings.footerText}
      </div>
      
      <div className="bg-[#00b3b3] text-white p-4">
        <h3 className="text-base font-bold mb-2">Note:</h3>
        <ul className="list-disc pl-5 text-sm space-y-1">
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
