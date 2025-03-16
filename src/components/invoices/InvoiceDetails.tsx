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
  };
}

export function InvoiceDetails({ 
  invoice, 
  companySettings = {
    name: "Techius Solutions",
    address: "Mallappally, Kerala",
    uamNumber: "KL11D0004260",
    phone: "+91-9961560545",
    website: "www.techiussolutions.in",
    email: "info@techiussolutions.in",
    logo: "/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png"
  }
}: InvoiceDetailsProps) {
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
    <div>
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div>
          <img
            src={companySettings.logo}
            alt="Logo"
            className="h-16 w-auto"
          />
          <h1 className="text-3xl font-bold mt-4">INVOICE</h1>
          <Badge 
            className={getStatusColor(invoice.status)}
            variant="outline"
          >
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
        </div>
        
        <div className="text-right">
          <div className="font-medium">{companySettings.name}</div>
          <div className="text-sm text-gray-500">{companySettings.address}</div>
          <div className="text-sm text-gray-500">UAM No: {companySettings.uamNumber}</div>
          <div className="text-sm text-gray-500">Phone: {companySettings.phone}</div>
          <div className="text-sm text-gray-500">Web: {companySettings.website}</div>
          <div className="text-sm text-gray-500">E-mail: {companySettings.email}</div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="text-sm text-gray-500">Bill To</div>
          <div className="font-medium">{invoice.customer.name}</div>
          <div className="text-sm text-gray-500">{invoice.customer.address}</div>
          {invoice.customer.email && (
            <div className="text-sm text-gray-500">{invoice.customer.email}</div>
          )}
          {invoice.customer.phone && (
            <div className="text-sm text-gray-500">{invoice.customer.phone}</div>
          )}
        </div>
        
        <div className="text-right">
          <div className="grid grid-cols-2 gap-1">
            <div className="text-sm text-gray-500">Invoice Number:</div>
            <div className="font-medium">{invoice.invoiceNumber}</div>
            
            <div className="text-sm text-gray-500">Date:</div>
            <div>{formatDate(invoice.date)}</div>
            
            <div className="text-sm text-gray-500">Due Date:</div>
            <div>{formatDate(invoice.dueDate)}</div>
          </div>
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.quantity * item.price)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
            <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={3} className="text-right">Tax</TableCell>
            <TableCell className="text-right">{formatCurrency(invoice.tax)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
            <TableCell className="text-right font-bold">{formatCurrency(invoice.total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      
      {invoice.notes && (
        <div className="mt-8">
          <h3 className="font-medium mb-2">Notes</h3>
          <p className="text-sm text-gray-600">{invoice.notes}</p>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">Thank you for your business!</p>
      </div>
    </div>
  );
}
