
import { Invoice } from "@/types/invoice";
import { formatCurrency, formatDate, convertNumberToWords } from "./formatters";
import { addWrappedText, createTableRow } from "./pdfHelpers";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getCompanySettings, getInvoiceSettings } from "@/services/settingsService";

// Extend the jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: any;
  }
}

/**
 * Generate and download a PDF for the given invoice
 */
export async function generatePDF(invoice: Invoice, autoDownload: boolean = false): Promise<string | undefined> {
  try {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Get company settings
    const companySettings = getCompanySettings();
    const invoiceSettings = getInvoiceSettings();
    
    // Header section - Company logo and details
    const headerHeight = 30;
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, margin, contentWidth, headerHeight, 'F');
    
    // Add logo image if available
    try {
      // Use company logo from settings
      doc.addImage(companySettings.logo, 'PNG', margin, margin, 30, 20);
    } catch (error) {
      console.error("Could not add logo image:", error);
    }
    
    // Add company header text
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 136, 204); // #0088cc
    doc.setFontSize(24);
    
    const nameParts = companySettings.name.split(' ');
    doc.text(nameParts[0] || "TECHIUS", margin + 32, margin + 10);
    
    if (nameParts.length > 1) {
      doc.setTextColor(255, 204, 0); // #ffcc00
      doc.setFontSize(20);
      doc.text(nameParts.slice(1).join(' ') || "SOLUTIONS", margin + 32, margin + 17);
    }
    
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102); // #666
    doc.text("EXPERIENCE THE DIGITAL INNOVATION", margin + 32, margin + 22);
    
    // Add company details on the right
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Right-aligned company information
    let companyInfo = [
      { label: `${companySettings.name},`, value: ` ${companySettings.address.split(',')[0]}` },
      { label: "UAM No:", value: ` ${companySettings.uamNumber}` },
      { label: "Phone :", value: ` ${companySettings.phone}` },
      { label: "Web :", value: ` ${companySettings.website}` },
      { label: "E-mail :", value: ` ${companySettings.email}` }
    ];
    
    companyInfo.forEach((item, index) => {
      const y = margin + 5 + (index * 5);
      const text = `${item.label}${item.value}`;
      // Calculate text width for right alignment
      doc.setFont("helvetica", "normal");
      const textWidth = doc.getTextWidth(text);
      doc.text(text, pageWidth - margin - textWidth, y);
    });
    
    // Add teal border line
    doc.setDrawColor(0, 179, 179); // #00b3b3
    doc.setLineWidth(1);
    doc.line(margin, margin + headerHeight, pageWidth - margin, margin + headerHeight);
    
    // Invoice title and customer section
    const invoiceTitleY = margin + headerHeight + 10;
    doc.setFillColor(249, 249, 249); // #f9f9f9
    doc.rect(margin, invoiceTitleY - 5, contentWidth, 40, 'F');
    
    doc.setTextColor(102, 102, 102); // #666
    doc.setFontSize(28);
    doc.setFont("helvetica", "normal");
    doc.text("INVOICE", margin + 5, invoiceTitleY + 5);
    
    // Bill To section
    doc.setFillColor(0, 179, 179); // #00b3b3
    doc.rect(margin + 5, invoiceTitleY + 10, 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", margin + 7, invoiceTitleY + 16);
    
    // Customer information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    
    // Customer name and address with word wrap
    let customerY = invoiceTitleY + 25;
    doc.text(invoice.customer.name, margin + 5, customerY);
    customerY += 6;
    
    // Process address with word wrap
    doc.setFont("helvetica", "normal");
    customerY = addWrappedText(
      doc, 
      invoice.customer.address, 
      margin + 5, 
      customerY, 
      contentWidth / 2 - 10
    );
    
    // Invoice details on the right
    doc.setFont("helvetica", "bold");
    doc.text("Date :", pageWidth - margin - 60, invoiceTitleY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(invoice.date), pageWidth - margin - 30, invoiceTitleY + 5);
    
    doc.setFont("helvetica", "bold");
    doc.text("Invoice No :", pageWidth - margin - 60, invoiceTitleY + 12);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.invoiceNumber, pageWidth - margin - 30, invoiceTitleY + 12);
    
    // Currency info if available
    if (invoice.currency) {
      doc.setFont("helvetica", "bold");
      doc.text("Currency :", pageWidth - margin - 60, invoiceTitleY + 19);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.currency, pageWidth - margin - 30, invoiceTitleY + 19);
    }
    
    // Invoice items section
    const tableStartY = Math.max(customerY, invoiceTitleY + 40);
    doc.setDrawColor(221, 221, 221); // #ddd
    doc.setLineWidth(0.5);
    doc.line(margin, tableStartY, pageWidth - margin, tableStartY);
    
    doc.setTextColor(102, 102, 102); // #666
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ITEM", margin, tableStartY - 5);
    doc.text("AMOUNT", pageWidth - margin - 25, tableStartY - 5, { align: "right" });
    
    // Items content with proper wrapping
    let y = tableStartY + 10;
    
    if (invoice.items.length > 0) {
      // Group header - customer name + purpose if available
      doc.setTextColor(0, 102, 204); // #0066cc
      doc.setFont("helvetica", "bold");
      const groupHeader = `${invoice.customer.name} Website Annual Charges`;
      doc.text(groupHeader, margin, y);
      y += 10;
      
      // Individual items with proper text wrapping
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      
      invoice.items.forEach(item => {
        // Create a properly formatted table row with wrapped text
        y = createTableRow(
          doc,
          item.description,
          formatCurrency(item.price * item.quantity, invoice.currency),
          y,
          margin,
          pageWidth,
          5 // indent by 5mm
        );
        y += 2; // add a bit of spacing between items
      });
    }
    
    // Draw line after items
    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Totals section
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", margin, y);
    doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - margin, y, { align: "right" });
    
    // Draw line
    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Discount (using tax field from the invoice as discount)
    doc.text("DISCOUNT", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatCurrency(invoice.tax, invoice.currency), pageWidth - margin, y, { align: "right" });
    
    // Draw line
    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Final amount
    doc.setTextColor(204, 0, 0); // #cc0000
    doc.setFont("helvetica", "bold");
    doc.text("FINAL TO BE PAID", margin, y);
    
    // Amount in words with proper wrapping
    const amountInWords = convertNumberToWords(invoice.total, invoice.currency as any);
    
    // Create properly sized and positioned boxes for the amounts
    doc.setFillColor(102, 102, 102); // #666
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    
    // Words box - properly sized
    const wordsWidth = Math.min(doc.getTextWidth(`Rupees ${amountInWords}`) + 10, 150);
    doc.roundedRect(pageWidth - margin - wordsWidth - 35, y - 5, wordsWidth, 8, 1, 1, 'F');
    doc.text(`Rupees ${amountInWords}`, pageWidth - margin - wordsWidth/2 - 35, y, { align: "center" });
    
    // Amount box
    const amountText = formatCurrency(invoice.total, invoice.currency);
    const amountWidth = doc.getTextWidth(amountText) + 10;
    doc.setFillColor(0, 179, 179); // #00b3b3
    doc.roundedRect(pageWidth - margin - amountWidth, y - 5, amountWidth, 8, 1, 1, 'F');
    doc.setFontSize(14);
    doc.text(amountText, pageWidth - margin - amountWidth/2, y, { align: "center" });
    
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
    
    // Use footer text from invoice settings
    addWrappedText(
      doc,
      invoiceSettings.footerText,
      pageWidth / 2,
      thankYouY + 18,
      contentWidth - 20,
      5,
      { align: "center" }
    );
    
    // Footer note
    doc.setFillColor(0, 179, 179); // #00b3b3
    doc.rect(margin, thankYouY + 30, contentWidth, 15, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Note:", margin + 5, thankYouY + 38);
    doc.setFont("helvetica", "normal");
    doc.text("• Server downtime may occur rarely during scheduled maintenances or damages due to natural disasters.", 
      margin + 25, thankYouY + 38);
    
    // Save the PDF for download if requested
    if (autoDownload) {
      const pdfName = `Invoice_${invoice.invoiceNumber}.pdf`;
      doc.save(pdfName);
    }
    
    // Return base64 data for preview
    return doc.output('datauristring');
  } catch (error) {
    console.error("Error generating PDF:", error);
    return undefined;
  }
}
