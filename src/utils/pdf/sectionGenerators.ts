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
  positions: SectionPositions
): void {
  const { pageWidth, margin, contentWidth, currentY } = positions;
  
  // Add accent bar at the top (teal color)
  doc.setFillColor(0, 179, 179); // #00b3b3 - teal
  doc.rect(0, 0, pageWidth, 10, 'F');
  
  // Header section with logo and company info
  doc.setDrawColor(221, 221, 221); // #ddd
  doc.setLineWidth(0.5);
  
  // Get logo with fallback
  const defaultLogoUrl = "/lovable-uploads/5222bf6a-5b4c-403b-ac0f-8208640df06d.png";
  
  console.log("Company settings in PDF Generator:", companySettings);
  console.log("Logo URL in PDF:", companySettings.logo || defaultLogoUrl);
  
  // Add company logo
  try {
    // First try with the user-uploaded logo
    if (companySettings.logo && companySettings.logo.trim() !== "") {
      // Check if it's a base64 image
      if (companySettings.logo.startsWith('data:image')) {
        doc.addImage(companySettings.logo, 'AUTO', margin, currentY, 50, 20);
      } else {
        // Assume it's a URL
        doc.addImage(companySettings.logo, 'AUTO', margin, currentY, 50, 20);
      }
    } else {
      // If no logo, use default
      throw new Error("No logo found, using default");
    }
    
    doc.setFontSize(10);
    doc.setTextColor(85, 85, 85); // #555
    doc.text(companySettings.slogan, margin, currentY + 25);
  } catch (error) {
    console.error("Could not add logo image:", error);
    // Try fallback image
    try {
      doc.addImage(defaultLogoUrl, 'PNG', margin, currentY, 50, 20);
    } catch (e) {
      console.error("Could not add fallback image either:", e);
    }
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
    doc.text(line, pageWidth - margin - textWidth, currentY + 5 + (i * 5));
  });
  
  // Add border line after header
  doc.line(margin, currentY + 30, pageWidth - margin, currentY + 30);
}

/**
 * Adds the invoice title section
 */
export function addInvoiceTitleSection(
  doc: jsPDF,
  invoice: Invoice,
  positions: SectionPositions
): void {
  const { pageWidth, margin, contentWidth, currentY } = positions;
  
  // Invoice title and details section with light gray background
  doc.setFillColor(249, 249, 249); // #f9f9f9
  doc.rect(margin, currentY, contentWidth, 20, 'F');
  
  // Add Invoice title
  doc.setFontSize(24);
  doc.setTextColor(102, 102, 102); // #666
  doc.text("INVOICE", margin + 5, currentY + 15);
  
  // Add invoice details on the right
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Format the date properly
  const formattedDate = formatDate(invoice.date);
  const formattedDueDate = invoice.dueDate ? formatDate(invoice.dueDate) : '';
  
  // Right align the details with bold for labels
  doc.setFont("helvetica", "bold");
  doc.text("Date:", pageWidth - margin - doc.getTextWidth("Date: " + formattedDate), currentY + 8);
  doc.text("Invoice No:", pageWidth - margin - doc.getTextWidth("Invoice No: " + invoice.invoiceNumber), currentY + 13);
  
  // Add due date if available
  if (invoice.dueDate) {
    doc.text("Due Date:", pageWidth - margin - doc.getTextWidth("Due Date: " + formattedDueDate), currentY + 18);
  }
  
  doc.setFont("helvetica", "normal");
  
  // Right align the values
  const dateX = pageWidth - margin - doc.getTextWidth(formattedDate) + doc.getTextWidth("Date: ");
  const invoiceNoX = pageWidth - margin - doc.getTextWidth(invoice.invoiceNumber) + doc.getTextWidth("Invoice No: ");
  
  doc.text(formattedDate, dateX, currentY + 8);
  doc.text(invoice.invoiceNumber, invoiceNoX, currentY + 13);
  
  // Add due date value if available
  if (invoice.dueDate) {
    const dueDateX = pageWidth - margin - doc.getTextWidth(formattedDueDate) + doc.getTextWidth("Due Date: ");
    doc.text(formattedDueDate, dueDateX, currentY + 18);
  }
  
  // Add currency if available (at the bottom if due date is present, or in place of due date)
  if (invoice.currency) {
    const currencyY = invoice.dueDate ? currentY + 23 : currentY + 18;
    doc.text(`Currency: ${invoice.currency}`, pageWidth - margin - doc.getTextWidth(`Currency: ${invoice.currency}`), currencyY);
  }
}

/**
 * Adds the client details section
 */
export function addClientSection(
  doc: jsPDF,
  invoice: Invoice,
  positions: SectionPositions
): void {
  const { margin, pageWidth, currentY } = positions;
  
  // Add the "BILL TO" label with teal background
  doc.setFillColor(0, 179, 179); // #00b3b3
  doc.rect(margin, currentY, 25, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("BILL TO", margin + 5, currentY + 5);
  
  // Add client information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Set font to bold for customer name and address
  doc.setFont("helvetica", "bold");
  
  // Add the customer name first
  doc.text(invoice.customer.name, margin, currentY + 15);
  
  // Add email and phone if available
  let contactY = currentY + 20;
  if (invoice.customer.email) {
    doc.setFont("helvetica", "normal");
    doc.text(invoice.customer.email, margin, contactY);
    contactY += 5;
  }
  
  if (invoice.customer.phone) {
    doc.setFont("helvetica", "normal");
    doc.text(invoice.customer.phone, margin, contactY);
    contactY += 5;
  }
  
  // Split address into lines and add them
  const clientInfoLines = invoice.customer.address.split(',');
  
  // Add each line of the address
  clientInfoLines.forEach((line, i) => {
    doc.setFont("helvetica", "normal");
    doc.text(line.trim(), margin, contactY + (i * 5));
  });
  
  // Reset font to normal
  doc.setFont("helvetica", "normal");
  
  // Add border line after client details
  doc.line(margin, currentY + 30, pageWidth - margin, currentY + 30);
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
  const { pageWidth, margin, contentWidth, currentY } = positions;
  
  // Improved column widths for better alignment
  const itemColWidth = contentWidth * 0.30; // 30% for item name
  const descColWidth = contentWidth * 0.50; // 50% for description
  const amountColWidth = contentWidth * 0.20; // 20% for amount
  
  // Table header - items, description, amount
  doc.setFillColor(249, 249, 249); // #f9f9f9
  doc.rect(margin, currentY, contentWidth, 10, 'F');
  doc.setTextColor(102, 102, 102); // #666
  doc.setFontSize(11);
  
  // Add headers with fixed positions
  doc.text("ITEM", margin + 5, currentY + 7);
  doc.text("DESCRIPTION", margin + itemColWidth + 5, currentY + 7);
  
  // Right align the Amount header
  const amountHeader = "AMOUNT";
  const amountHeaderWidth = doc.getTextWidth(amountHeader);
  doc.text(amountHeader, pageWidth - margin - 5, currentY + 7, { align: "right" });
  
  // Add border line after table header
  doc.line(margin, currentY + 10, pageWidth - margin, currentY + 10);
  
  // Table content - add items with descriptions and amounts
  let y = currentY + 20;
  doc.setTextColor(0, 0, 0);
  
  // Process each invoice item
  let itemIndex = 0;
  invoice.items.forEach((item) => {
    // Only include items with quantity > 0
    if (item.quantity <= 0) return;
    
    // Item name (first column)
    let itemY = y + (itemIndex * 25);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    
    if (item.name) {
      // Handle item name with word wrap
      itemY = addWrappedText(
        doc,
        item.name,
        margin + 5,
        itemY,
        itemColWidth - 10
      );
    } else {
      // If no name, add a placeholder
      doc.text("Unnamed Item", margin + 5, itemY);
    }
    
    doc.setFont("helvetica", "normal");
    
    // Description (second column)
    if (item.description) {
      doc.setFontSize(10);
      
      // Add description at the same Y position
      addWrappedText(
        doc,
        item.description,
        margin + itemColWidth + 5,
        y + (itemIndex * 25),
        descColWidth - 10
      );
    }
    
    // Specs below description if available
    if (item.specs && item.specs.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(102, 102, 102); // #666
      
      let specsY = y + (itemIndex * 25) + 10;
      item.specs.forEach((spec) => {
        doc.text(`• ${spec}`, margin + itemColWidth + 10, specsY);
        specsY += 5;
      });
    }
    
    // Amount (third column) - properly right aligned
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const amount = formatCurrency(item.quantity * item.price, invoice.currency as CurrencyCode);
    
    // Properly align the amount to the right
    doc.text(amount, pageWidth - margin - 5, y + (itemIndex * 25), { align: "right" });
    
    // Add line after each item (except the last one)
    const visibleItems = invoice.items.filter(i => i.quantity > 0);
    if (itemIndex < visibleItems.length - 1) {
      doc.setDrawColor(221, 221, 221); // #ddd
      doc.line(margin, y + (itemIndex * 25) + 15, pageWidth - margin, y + (itemIndex * 25) + 15);
    }
    
    itemIndex++;
  });
  
  // Calculate the Y position after all items
  const visibleItemsCount = invoice.items.filter(i => i.quantity > 0).length;
  let itemsEndY = y + ((visibleItemsCount - 1) * 25) + 25;
  
  // Add the subtotal row
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SUB TOTAL", margin + 5, itemsEndY);
  const subtotalAmount = formatCurrency(invoice.subtotal, invoice.currency as CurrencyCode);
  doc.text(subtotalAmount, pageWidth - margin - 5, itemsEndY, { align: "right" });
  
  // Add tax row if applicable
  if (invoice.tax && invoice.tax > 0) {
    itemsEndY += 10;
    doc.text("TAX", margin + 5, itemsEndY);
    const taxAmount = formatCurrency(invoice.tax, invoice.currency as CurrencyCode);
    doc.text(taxAmount, pageWidth - margin - 5, itemsEndY, { align: "right" });
  }
  
  // Add discount row if applicable
  if (invoice.discount && invoice.discount > 0) {
    itemsEndY += 10;
    doc.text("DISCOUNT", margin + 5, itemsEndY);
    const discountAmount = "-" + formatCurrency(invoice.discount, invoice.currency as CurrencyCode);
    doc.text(discountAmount, pageWidth - margin - 5, itemsEndY, { align: "right" });
  }
  
  doc.setFont("helvetica", "normal");
  
  // Add border line after subtotal/tax/discount
  doc.line(margin, itemsEndY + 5, pageWidth - margin, itemsEndY + 5);
  
  return itemsEndY + 10;
}

/**
 * Adds the total section with amount in words
 */
export function addTotalSection(
  doc: jsPDF,
  invoice: Invoice,
  currencySymbol: string,
  currencyCode: CurrencyCode,
  positions: SectionPositions
): number {
  const { pageWidth, margin, currentY } = positions;
  
  // Get amount in words
  const amountInWords = convertNumberToWords(invoice.total, currencyCode);
  
  // Add total section with colored backgrounds
  doc.setFillColor(102, 102, 102); // #666 - dark gray
  doc.rect(pageWidth - margin - 210, currentY, 150, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(amountInWords, pageWidth - margin - 205, currentY + 5);
  
  // Add the amount with teal background
  doc.setFillColor(0, 179, 179); // #00b3b3
  doc.rect(pageWidth - margin - 50, currentY, 50, 8, 'F');
  const totalAmount = formatCurrency(invoice.total, currencyCode);
  doc.text(totalAmount, pageWidth - margin - 5, currentY + 5, { align: 'right' });
  
  // Add border line after total
  doc.line(margin, currentY + 15, pageWidth - margin, currentY + 15);
  
  return currentY + 20;
}

/**
 * Adds the payment details and signature section
 */
export function addPaymentSection(
  doc: jsPDF,
  invoice: Invoice,
  companySettings: any,
  positions: SectionPositions
): number {
  const { pageWidth, margin, currentY } = positions;
  
  // Payment details column
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Account Details", margin, currentY);
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, currentY + 2, margin + 60, currentY + 2);
  doc.setFont("helvetica", "normal");
  
  // Use invoice payment details if available, otherwise use default
  const paymentDetails = invoice.paymentDetails || {
    accountHolder: "Jithin Jacob Issic",
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
    doc.text(line, margin, currentY + 10 + (i * 5));
  });
  
  // Signature and stamp column
  doc.setFontSize(10);
  doc.text(`For ${companySettings.name},`, pageWidth - margin - 50, currentY + 5, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RICHU EAPEN GEORGE", pageWidth - margin - 50, currentY + 15, { align: 'right' });
  doc.setFont("helvetica", "normal");
  
  // Get stamp URL with fallback
  const defaultStampUrl = "/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png";
  
  console.log("Stamp URL in PDF:", companySettings.stamp || defaultStampUrl);
  
  // Add stamp if available
  try {
    // First try with the user-uploaded stamp
    if (companySettings.stamp && companySettings.stamp.trim() !== "") {
      // Check if it's a base64 image
      if (companySettings.stamp.startsWith('data:image')) {
        doc.addImage(companySettings.stamp, 'AUTO', pageWidth - margin - 70, currentY + 20, 35, 35);
      } else {
        // Assume it's a URL
        doc.addImage(companySettings.stamp, 'AUTO', pageWidth - margin - 70, currentY + 20, 35, 35);
      }
    } else {
      // If no stamp, use default
      throw new Error("No stamp found, using default");
    }
  } catch (error) {
    console.error("Could not add stamp image:", error);
    // Try fallback
    try {
      doc.addImage(defaultStampUrl, 'PNG', pageWidth - margin - 70, currentY + 20, 35, 35);
    } catch (e) {
      console.error("Could not add fallback stamp either:", e);
    }
  }
  
  // Add border line after payment section
  const paymentEndY = currentY + 55;
  doc.line(margin, paymentEndY, pageWidth - margin, paymentEndY);
  
  return paymentEndY;
}

/**
 * Adds the footer section with thank you message, quote and notes
 */
export function addFooterSection(
  doc: jsPDF,
  invoice: Invoice,
  invoiceSettings: any,
  positions: SectionPositions
): void {
  const { pageWidth, margin, contentWidth, currentY } = positions;
  
  // Thank you message
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(invoiceSettings.defaultNotes, pageWidth / 2, currentY + 10, { align: 'center' });
  
  // Add border lines above and below thank you message
  doc.line(margin, currentY + 15, pageWidth - margin, currentY + 15);
  
  // Quote section with gray background
  doc.setFillColor(102, 102, 102); // #666
  doc.rect(margin, currentY + 20, contentWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  
  // Add quote from settings
  addWrappedText(
    doc,
    invoiceSettings.footerText,
    pageWidth / 2,
    currentY + 28,
    contentWidth - 20,
    5,
    { align: 'center' }
  );
  
  // Notes section with teal background
  doc.setFillColor(0, 179, 179); // #00b3b3
  doc.rect(margin, currentY + 40, contentWidth, 30, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Note:", margin + 5, currentY + 50);
  
  // Process invoice notes
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Use invoice notes if available, otherwise fallback to settings notes
  const invoiceNotes = Array.isArray(invoice.notes) 
    ? invoice.notes 
    : (typeof invoice.notes === 'string' && invoice.notes.trim() !== ''
        ? invoice.notes.split('\n').filter(note => note.trim() !== '')
        : invoiceSettings.notes || [
            "Upgrading the current cloud hosting service plans are extra payable as per the client requirements.",
            "Server downtime may occur rarely during scheduled maintenances or damages due to natural disasters."
          ]);
  
  if (invoiceNotes.length > 0) {
    invoiceNotes.forEach((note, i) => {
      doc.text(`• ${note}`, margin + 15, currentY + 50 + ((i + 1) * 6));
    });
  } else {
    doc.text("• No additional notes for this invoice.", margin + 15, currentY + 56);
  }
}
