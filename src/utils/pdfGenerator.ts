
import { Invoice } from "@/types/invoice";
import { formatCurrency, formatDate } from "./formatters";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend the jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: any;
  }
}

/**
 * Convert a number to words for Indian Rupees
 */
function convertNumberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  function convertLessThanOneThousand(n: number): string {
    if (n < 20) return ones[n];
    const digit = n % 10;
    if (n < 100) return tens[Math.floor(n / 10)] + (digit ? ' ' + ones[digit] : '');
    const hundred = Math.floor(n / 100);
    return ones[hundred] + ' Hundred' + (n % 100 === 0 ? '' : ' ' + convertLessThanOneThousand(n % 100));
  }
  
  let result = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remaining = num % 1000;
  
  if (crore > 0) {
    result += convertLessThanOneThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertLessThanOneThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertLessThanOneThousand(thousand) + ' Thousand ';
  }
  if (remaining > 0) {
    result += convertLessThanOneThousand(remaining);
  }
  
  return result.trim() + ' Only';
}

/**
 * Generate and download a PDF for the given invoice
 */
export async function generatePDF(invoice: Invoice): Promise<void> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Header section - Company logo and details
  const headerHeight = 30;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, margin, contentWidth, headerHeight, 'F');
  
  // Add Techius Solutions header text
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 136, 204); // #0088cc
  doc.setFontSize(24);
  doc.text("TECHIUS", margin + 30, margin + 10);
  
  doc.setTextColor(255, 204, 0); // #ffcc00
  doc.setFontSize(20);
  doc.text("SOLUTIONS", margin + 30, margin + 17);
  
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102); // #666
  doc.text("EXPERIENCE THE DIGITAL INNOVATION", margin + 30, margin + 22);
  
  // Add company details on the right
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  // Right-aligned company information
  const companyInfo = [
    { label: "Techius Solutions,", value: " Mallappally, Kerala" },
    { label: "UAM No:", value: " KL11D0004260" },
    { label: "Phone :", value: " +91-9961560545" },
    { label: "Web :", value: " www.techiussolutions.in" },
    { label: "E-mail :", value: " info@techiussolutions.in" }
  ];
  
  companyInfo.forEach((item, index) => {
    const y = margin + 5 + (index * 5);
    // Calculate text width for right alignment
    const textWidth = doc.getTextWidth(item.label + item.value);
    doc.setFont("helvetica", "bold");
    doc.text(item.label, pageWidth - margin - textWidth, y);
    doc.setFont("helvetica", "normal");
    doc.text(item.value, pageWidth - margin - textWidth + doc.getTextWidth(item.label), y);
  });
  
  // Add teal border line
  doc.setDrawColor(0, 179, 179); // #00b3b3
  doc.setLineWidth(1);
  doc.line(margin, margin + headerHeight, pageWidth - margin, margin + headerHeight);
  
  // Invoice title and customer section
  const invoiceTitleY = margin + headerHeight + 5;
  doc.setFillColor(249, 249, 249); // #f9f9f9
  doc.rect(margin, invoiceTitleY, contentWidth, 35, 'F');
  
  doc.setTextColor(102, 102, 102); // #666
  doc.setFontSize(28);
  doc.setFont("helvetica", "normal");
  doc.text("INVOICE", margin + 5, invoiceTitleY + 10);
  
  // Bill To section
  doc.setFillColor(0, 179, 179); // #00b3b3
  doc.rect(margin + 5, invoiceTitleY + 15, 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", margin + 7, invoiceTitleY + 21);
  
  // Customer information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.customer.name, margin + 5, invoiceTitleY + 30);
  
  const addressLines = invoice.customer.address.split(',');
  doc.setFont("helvetica", "normal");
  doc.text(addressLines[0], margin + 5, invoiceTitleY + 35);
  if (addressLines.length > 1) {
    doc.text(addressLines.slice(1).join(','), margin + 5, invoiceTitleY + 40);
  }
  
  // Invoice details on the right
  doc.setFont("helvetica", "bold");
  doc.text("Date :", pageWidth - margin - 70, invoiceTitleY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(invoice.date), pageWidth - margin - 40, invoiceTitleY + 10);
  
  doc.setFont("helvetica", "bold");
  doc.text("Invoice No :", pageWidth - margin - 70, invoiceTitleY + 17);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoiceNumber, pageWidth - margin - 40, invoiceTitleY + 17);
  
  // Invoice items section - header
  const tableStartY = invoiceTitleY + 45;
  doc.setDrawColor(221, 221, 221); // #ddd
  doc.setLineWidth(0.5);
  doc.line(margin, tableStartY, pageWidth - margin, tableStartY);
  
  doc.setTextColor(102, 102, 102); // #666
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ITEM", margin, tableStartY - 5);
  doc.text("AMOUNT", pageWidth - margin - 25, tableStartY - 5, { align: "right" });
  
  // Items content
  let y = tableStartY + 10;
  
  if (invoice.items.length > 0) {
    // Group header
    doc.setTextColor(0, 102, 204); // #0066cc
    doc.setFont("helvetica", "bold");
    doc.text(`${invoice.customer.name} Website Annual Charges`, margin, y);
    y += 10;
    
    // Individual items
    invoice.items.forEach(item => {
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(item.description, margin, y);
      doc.text(formatCurrency(item.price * item.quantity), pageWidth - margin, y, { align: "right" });
      y += 8;
    });
  }
  
  // Draw line after items
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  // Totals section
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", margin, y);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - margin, y, { align: "right" });
  
  // Draw line
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  // Discount (using tax field from the invoice as discount)
  doc.text("DISCOUNT", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatCurrency(invoice.tax), pageWidth - margin, y, { align: "right" });
  
  // Draw line
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  // Final amount
  doc.setTextColor(204, 0, 0); // #cc0000
  doc.setFont("helvetica", "bold");
  doc.text("FINAL TO BE PAID", margin, y);
  
  // Amount in words box
  const amountInWords = convertNumberToWords(invoice.total);
  
  doc.setFillColor(102, 102, 102); // #666
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.roundedRect(pageWidth - margin - 100, y - 5, 70, 8, 1, 1, 'F');
  doc.text(`Rupees ${amountInWords}`, pageWidth - margin - 65, y, { align: "center" });
  
  // Amount box
  doc.setFillColor(0, 179, 179); // #00b3b3
  doc.roundedRect(pageWidth - margin - 28, y - 5, 28, 8, 1, 1, 'F');
  doc.setFontSize(16);
  doc.text(`₹ ${invoice.total}/-`, pageWidth - margin - 14, y, { align: "center" });
  
  // Draw line
  y += 10;
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;
  
  // Payment details and signature
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Account Details", margin, y);
  doc.line(margin, y + 2, margin + 60, y + 2);
  y += 10;
  
  // Account details
  doc.setFontSize(12);
  
  // Use invoice payment details if available, otherwise use default
  const paymentDetails = invoice.paymentDetails || {
    accountHolder: "Jithin Jacob Issac",
    bankName: "Federal Bank",
    accountNumber: "99980111697400",
    ifsc: "FDRL0001443",
    branch: "Mallappally"
  };
  
  const accountDetails = [
    { label: "Account Holder:", value: ` ${paymentDetails.accountHolder}` },
    { label: "Bank Name:", value: ` ${paymentDetails.bankName}` },
    { label: "Account Number:", value: ` ${paymentDetails.accountNumber}` },
    { label: "IFSC:", value: ` ${paymentDetails.ifsc}` },
    { label: "Branch:", value: ` ${paymentDetails.branch}` }
  ];
  
  accountDetails.forEach((detail, index) => {
    doc.setFont("helvetica", "bold");
    doc.text(detail.label, margin, y + (index * 6));
    doc.setFont("helvetica", "normal");
    doc.text(detail.value, margin + doc.getTextWidth(detail.label), y + (index * 6));
  });
  
  // Signature
  doc.setFont("helvetica", "normal");
  doc.text("For Techius Solutions ,", pageWidth - margin - 50, y);
  doc.setFont("helvetica", "bold");
  doc.text("RICHU EAPEN GEORGE", pageWidth - margin - 50, y + 10);
  
  // Thank you message
  const thankYouY = y + 60;
  doc.line(margin, thankYouY - 5, pageWidth - margin, thankYouY - 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.text("Thank You for your business !", pageWidth / 2, thankYouY, { align: "center" });
  doc.line(margin, thankYouY + 5, pageWidth - margin, thankYouY + 5);
  
  // Quote
  doc.setFillColor(102, 102, 102); // #666
  doc.rect(margin, thankYouY + 10, contentWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.text('"Logic will get you from A to B. Imagination will take you everywhere." - Albert Einstein', 
    pageWidth / 2, thankYouY + 18, { align: "center" });
  
  // Footer note
  doc.setFillColor(0, 179, 179); // #00b3b3
  doc.rect(margin, thankYouY + 30, contentWidth, 15, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("Note:", margin + 5, thankYouY + 38);
  doc.setFont("helvetica", "normal");
  doc.text("• Server downtime may occur rarely during scheduled maintenances or damages due to natural disasters.", 
    margin + 5, thankYouY + 45);
  
  // Save the PDF
  doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
}
