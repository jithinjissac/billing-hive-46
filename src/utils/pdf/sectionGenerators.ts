
import jsPDF from "jspdf";
import { SectionPositions } from "./types";
import { Invoice, CurrencyCode } from "@/types/invoice";
import { formatCurrency, formatDate, convertNumberToWords } from "../formatters";
import { addWrappedText } from "../pdfHelpers";

/**
 * Adds the header section with logo and company info
 */
export function addHeaderSection(
  doc: jsPDF, 
  companySettings: any,
  pageWidth: number,
  margin: number
): void {
  // Add accent bar at the top (teal color)
  doc.setFillColor(0, 179, 179); // #00b3b3 - teal
  doc.rect(0, 0, pageWidth, 10, 'F');
  
  // Header section with logo and company info
  doc.setDrawColor(221, 221, 221); // #ddd
  doc.setLineWidth(0.5);
  
  // Add company logo
  try {
    doc.addImage(companySettings.logo, 'JPEG', margin, 15, 40, 15);
    doc.setFontSize(10);
    doc.setTextColor(85, 85, 85); // #555
    doc.text(companySettings.slogan, margin, 35);
  } catch (error) {
    console.error("Could not add logo image:", error);
  }
  
  // Add company details on the right
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Company information - right aligned
  const companyInfo = `${companySettings.name}, ${companySettings.address}\nUAM No: ${companySettings.uamNumber}\nPhone: ${companySettings.phone}\nWeb: ${companySettings.website}\nE-mail: ${companySettings.email}`;
  
  // Right align the text
  const companyInfoLines = companyInfo.split('\n');
  companyInfoLines.forEach((line, i) => {
    const textWidth = doc.getTextWidth(line);
    doc.text(line, pageWidth - margin - textWidth, 20 + (i * 5));
  });
  
  // Add border line after header
  doc.line(margin, 40, pageWidth - margin, 40);
}

/**
 * Adds the invoice title section
 */
export function addInvoiceTitleSection(
  doc: jsPDF,
  invoice: Invoice,
  positions: SectionPositions
): void {
  const { pageWidth, margin, contentWidth } = positions;
  
  // Invoice title and details section with light gray background
  doc.setFillColor(249, 249, 249); // #f9f9f9
  doc.rect(margin, 45, contentWidth, 20, 'F');
  
  // Add Invoice title
  doc.setFontSize(28);
  doc.setTextColor(102, 102, 102); // #666
  doc.text("INVOICE", margin + 5, 60);
  
  // Add invoice details on the right
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Format the date properly
  const formattedDate = formatDate(invoice.date);
  
  // Right align the details
  const details = [
    `Date: ${formattedDate}`,
    `Invoice No: ${invoice.invoiceNumber}`
  ];
  
  details.forEach((line, i) => {
    const textWidth = doc.getTextWidth(line);
    doc.text(line, pageWidth - margin - textWidth, 53 + (i * 5));
  });
}

/**
 * Adds the client details section
 */
export function addClientSection(
  doc: jsPDF,
  invoice: Invoice,
  positions: SectionPositions
): void {
  const { margin } = positions;
  
  // Add the "BILL TO" label with teal background
  doc.setFillColor(0, 179, 179); // #00b3b3
  doc.rect(margin, 70, 25, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("BILL TO", margin + 5, 75);
  
  // Add client information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Split address into lines and add them
  const clientInfo = `${invoice.customer.name}\n${invoice.customer.address}`;
  const clientInfoLines = clientInfo.split('\n');
  
  // Add each line of the address
  clientInfoLines.forEach((line, i) => {
    doc.text(line, margin, 85 + (i * 5));
  });
  
  // Add border line after client details
  doc.line(margin, 105, positions.pageWidth - margin, 105);
}

/**
 * Adds the invoice items table
 */
export function addInvoiceTable(
  doc: jsPDF,
  invoice: Invoice,
  currencySymbol: string,
  positions: SectionPositions
): number {
  const { pageWidth, margin, contentWidth } = positions;
  
  // Improved column widths for better alignment
  const itemColWidth = contentWidth * 0.40; // 40% for item description
  const descColWidth = contentWidth * 0.40; // 40% for specs
  const amountColWidth = contentWidth * 0.20; // 20% for amount
  
  // Table header - items, description, amount
  doc.setFillColor(249, 249, 249); // #f9f9f9
  doc.rect(margin, 110, contentWidth, 10, 'F');
  doc.setTextColor(102, 102, 102); // #666
  doc.setFontSize(11);
  
  // Add headers with fixed positions
  doc.text("ITEM", margin + 5, 117);
  doc.text("DESCRIPTION", margin + itemColWidth + 5, 117);
  doc.text("AMOUNT", pageWidth - margin - amountColWidth + 5, 117);
  
  // Add border line after table header
  doc.line(margin, 120, pageWidth - margin, 120);
  
  // Table content - add items with descriptions and amounts
  let y = 130;
  doc.setTextColor(0, 0, 0);
  
  // Process each invoice item
  invoice.items.forEach((item, i) => {
    // Item description (first column)
    let itemY = y + (i * 30);
    doc.setFontSize(11);
    
    // Handle item description with word wrap
    itemY = addWrappedText(
      doc,
      item.description,
      margin + 5,
      itemY,
      itemColWidth - 10
    );
    
    // Specs (second column)
    if (item.specs && item.specs.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102); // #666
      
      let specsY = y + (i * 30);
      item.specs.forEach((spec) => {
        specsY += 5;
        doc.text(`• ${spec}`, margin + itemColWidth + 5, specsY);
      });
    }
    
    // Amount (third column) - properly right aligned
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const amount = `${currencySymbol} ${(item.quantity * item.price).toLocaleString('en-IN')}/-`;
    
    // Properly align the amount to the right
    doc.text(amount, pageWidth - margin - 10, y + (i * 30), { align: "right" });
    
    // Add line after each item (except the last one)
    if (i < invoice.items.length - 1) {
      doc.setDrawColor(221, 221, 221); // #ddd
      doc.line(margin, y + (i * 30) + 15, pageWidth - margin, y + (i * 30) + 15);
    }
  });
  
  // Calculate the Y position after all items
  let itemsEndY = y + ((invoice.items.length - 1) * 30) + 25;
  
  // Add the subtotal row
  doc.setFontSize(11);
  doc.text("SUB TOTAL", margin + 5, itemsEndY);
  const subtotalAmount = `${currencySymbol} ${invoice.subtotal.toLocaleString('en-IN')}/-`;
  doc.text(subtotalAmount, pageWidth - margin - 10, itemsEndY, { align: "right" });
  
  // Add border line after subtotal
  doc.line(margin, itemsEndY + 5, pageWidth - margin, itemsEndY + 5);
  
  return itemsEndY;
}

/**
 * Adds the total section with amount in words
 */
export function addTotalSection(
  doc: jsPDF,
  invoice: Invoice,
  currencySymbol: string,
  currencyCode: CurrencyCode,
  itemsEndY: number,
  positions: SectionPositions
): number {
  const { pageWidth, margin } = positions;
  
  // Total section with amount in words and digits
  itemsEndY += 20;
  
  // Get amount in words
  const amountInWords = convertNumberToWords(invoice.total, currencyCode);
  
  // Add total section with colored backgrounds
  doc.setFillColor(102, 102, 102); // #666 - dark gray
  doc.rect(pageWidth - margin - 210, itemsEndY - 7, 150, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Rupees ${amountInWords}`, pageWidth - margin - 210 + 5, itemsEndY - 2);
  
  // Add the amount with teal background
  doc.setFillColor(0, 179, 179); // #00b3b3
  doc.rect(pageWidth - margin - 50, itemsEndY - 7, 50, 8, 'F');
  const totalAmount = `${currencySymbol} ${invoice.total.toLocaleString('en-IN')}/-`;
  doc.text(totalAmount, pageWidth - margin - 10, itemsEndY - 2, { align: 'right' });
  
  // Add border line after total
  doc.line(margin, itemsEndY + 5, pageWidth - margin, itemsEndY + 5);
  
  return itemsEndY;
}

/**
 * Adds the payment details and signature section
 */
export function addPaymentSection(
  doc: jsPDF,
  invoice: Invoice,
  companySettings: any,
  itemsEndY: number,
  positions: SectionPositions
): number {
  const { pageWidth, margin } = positions;
  
  // Payment section with bank details and signature
  itemsEndY += 15;
  
  // Payment details column
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text("Payment Account Details", margin, itemsEndY);
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, itemsEndY + 2, margin + 60, itemsEndY + 2);
  
  // Use invoice payment details if available, otherwise use default
  const paymentDetails = invoice.paymentDetails || {
    accountHolder: "Jithin Jacob Issac",
    bankName: "Federal Bank",
    accountNumber: "99980111697400",
    ifsc: "FDRL0001443",
    branch: "Mallappally"
  };
  
  // Add payment details
  doc.setFontSize(10);
  const details = [
    `Account Holder: ${paymentDetails.accountHolder}`,
    `Bank Name: ${paymentDetails.bankName}`,
    `Account Number: ${paymentDetails.accountNumber}`,
    `IFSC: ${paymentDetails.ifsc}`,
    `Branch: ${paymentDetails.branch}`
  ];
  
  details.forEach((line, i) => {
    doc.text(line, margin, itemsEndY + 10 + (i * 5));
  });
  
  // Signature and stamp column
  doc.setFontSize(10);
  doc.text("For Techius Solutions,", pageWidth - margin - 50, itemsEndY + 5, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RICHU EAPEN GEORGE", pageWidth - margin - 50, itemsEndY + 15, { align: 'right' });
  doc.setFont("helvetica", "normal");
  
  // Add stamp if available
  if (companySettings.stamp) {
    try {
      doc.addImage(companySettings.stamp, 'JPEG', pageWidth - margin - 80, itemsEndY + 20, 30, 30);
    } catch (error) {
      console.error("Could not add stamp image:", error);
    }
  }
  
  // Add border line after payment section
  const paymentEndY = itemsEndY + 60;
  doc.line(margin, paymentEndY, pageWidth - margin, paymentEndY);
  
  return paymentEndY;
}

/**
 * Adds the footer section with thank you message, quote and notes
 */
export function addFooterSection(
  doc: jsPDF,
  invoiceSettings: any,
  paymentEndY: number,
  positions: SectionPositions
): void {
  const { pageWidth, margin, contentWidth } = positions;
  
  // Thank you message
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(invoiceSettings.defaultNotes, pageWidth / 2, paymentEndY + 10, { align: 'center' });
  
  // Add border lines above and below thank you message
  doc.line(margin, paymentEndY + 15, pageWidth - margin, paymentEndY + 15);
  
  // Quote section with gray background
  doc.setFillColor(102, 102, 102); // #666
  doc.rect(margin, paymentEndY + 20, contentWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  
  // Add quote from settings
  addWrappedText(
    doc,
    invoiceSettings.footerText,
    pageWidth / 2,
    paymentEndY + 28,
    contentWidth - 20,
    5,
    { align: 'center' }
  );
  
  // Notes section with teal background
  doc.setFillColor(0, 179, 179); // #00b3b3
  doc.rect(margin, paymentEndY + 40, contentWidth, 25, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Note:", margin + 5, paymentEndY + 50);
  
  // Add notes from settings
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const notes = invoiceSettings.notes || [
    "Upgrading the current cloud hosting service plans are extra payable as per the client requirements.",
    "Server downtime may occur rarely during scheduled maintenances or damages due to natural disasters."
  ];
  
  notes.forEach((note, i) => {
    doc.text(`• ${note}`, margin + 15, paymentEndY + 50 + ((i + 1) * 6));
  });
}
