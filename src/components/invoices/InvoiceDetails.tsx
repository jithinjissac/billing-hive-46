
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
import { formatCurrency, formatDate } from "@/utils/formatters";
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
    slogan: string;
    stamp: string;
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
  
  // Listen for settings changes
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

  return (
    <div className="invoice-container max-w-4xl mx-auto border border-gray-200 rounded-md overflow-hidden">
      {/* Accent bar */}
      <div className="h-2 bg-[#00b3b3]"></div>
      
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="logo-section">
          <img
            src={companySettings.logo}
            alt="Logo"
            className="h-12 w-auto"
          />
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
      
      {/* Invoice Title Section */}
      <div className="flex justify-between p-6 bg-gray-50 border-b border-gray-200">
        <h1 className="text-2xl text-gray-600 font-normal">INVOICE</h1>
        <div className="text-right text-sm">
          <p>
            Date: {formatDate(invoice.date)}<br />
            Invoice No: {invoice.invoiceNumber}<br />
            {invoice.currency && `Currency: ${invoice.currency}`}
          </p>
        </div>
      </div>
      
      {/* Client Details */}
      <div className="p-6 border-b border-gray-200">
        <div className="inline-block px-4 py-1 mb-2 bg-[#00b3b3] text-white text-sm">BILL TO</div>
        <p className="text-sm">
          {invoice.customer.name}<br />
          {invoice.customer.address.split(',').join(',\n')}
        </p>
      </div>
      
      {/* Invoice Items */}
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
            <TableRow key={item.id}>
              <TableCell className="align-top">{item.description}</TableCell>
              <TableCell className="align-top">
                {item.specs && item.specs.length > 0 ? (
                  <ul className="list-none pl-0 text-xs text-gray-500 space-y-1">
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
          ))}
          <TableRow className="font-bold">
            <TableCell>SUB TOTAL</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right">{formatCurrency(invoice.subtotal, invoice.currency as any)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      {/* Total Section */}
      <div className="flex justify-end p-4 border-t border-b border-gray-200">
        <div className="bg-gray-600 text-white px-3 py-1 mr-3 text-sm min-w-40">
          Rupees {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: invoice.currency as string || 'INR',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          }).format(invoice.total).replace(/[^\d]/g, '')} Only
        </div>
        <div className="bg-[#00b3b3] text-white px-3 py-1 text-sm font-bold text-right w-24">
          {formatCurrency(invoice.total, invoice.currency as any)}
        </div>
      </div>
      
      {/* Payment and Signature Section */}
      <div className="flex justify-between p-6 border-b border-gray-200">
        <div className="payment-details text-sm">
          <h3 className="underline font-bold mb-2">Payment Account Details</h3>
          <p className="mb-1">
            Account Holder: {invoice.paymentDetails?.accountHolder || "Jithin Jacob Issac"}<br />
            Bank Name: {invoice.paymentDetails?.bankName || "Federal Bank"}<br />
            Account Number: {invoice.paymentDetails?.accountNumber || "99980111697400"}<br />
            IFSC: {invoice.paymentDetails?.ifsc || "FDRL0001443"}<br />
            Branch: {invoice.paymentDetails?.branch || "Mallappally"}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm mb-2">
            For Techius Solutions,<br />
            <span className="font-bold">RICHU EAPEN GEORGE</span>
          </div>
          {companySettings.stamp && (
            <img 
              src={companySettings.stamp} 
              alt="Company Stamp"
              className="w-20 h-auto inline-block"
            />
          )}
        </div>
      </div>
      
      {/* Thank You */}
      <div className="py-4 text-center border-b border-gray-200 text-base">
        {invoiceSettings.defaultNotes}
      </div>
      
      {/* Quote */}
      <div className="bg-gray-600 text-white p-4 text-center text-sm italic">
        {invoiceSettings.footerText}
      </div>
      
      {/* Notes Section */}
      <div className="bg-[#00b3b3] text-white p-4">
        <h3 className="text-base font-bold mb-2">Note:</h3>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {(invoiceSettings.notes || []).map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
