
import { Invoice } from "@/types/invoice";
import { formatCurrency, formatDate, convertNumberToWords } from "./formatters";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getCompanySettings } from "@/services/settingsService";

// Extend the jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: any;
  }
}

/**
 * Generate and download a PDF for the given invoice
 */
export async function generatePDF(invoice: Invoice): Promise<string | undefined> {
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
    
    // Header section - Company logo and details
    const headerHeight = 30;
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, margin, contentWidth, headerHeight, 'F');
    
    // Add Techius Solutions header text
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 136, 204); // #0088cc
    doc.setFontSize(24);
    doc.text(companySettings.name.split(' ')[0] || "TECHIUS", margin + 30, margin + 10);
    
    doc.setTextColor(255, 204, 0); // #ffcc00
    doc.setFontSize(20);
    doc.text(companySettings.name.split(' ')[1] || "SOLUTIONS", margin + 30, margin + 17);
    
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102); // #666
    doc.text("EXPERIENCE THE DIGITAL INNOVATION", margin + 30, margin + 22);
    
    // Add company details on the right
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Right-aligned company information
    const companyInfo = [
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
    
    // Truncate customer name if too long
    const customerName = invoice.customer.name.length > 35 
      ? invoice.customer.name.substring(0, 35) + "..." 
      : invoice.customer.name;
      
    doc.text(customerName, margin + 5, invoiceTitleY + 30);
    
    // Process address with word wrapping if needed
    const addressLines = [];
    const addressParts = invoice.customer.address.split(',');
    
    // First line
    addressLines.push(addressParts[0].trim());
    
    // Remaining parts - combine and wrap if needed
    if (addressParts.length > 1) {
      const remainingAddress = addressParts.slice(1).join(',').trim();
      if (remainingAddress.length > 40) {
        addressLines.push(remainingAddress.substring(0, 40) + "...");
      } else {
        addressLines.push(remainingAddress);
      }
    }
    
    doc.setFont("helvetica", "normal");
    addressLines.forEach((line, idx) => {
      doc.text(line, margin + 5, invoiceTitleY + 35 + (idx * 5));
    });
    
    // Invoice details on the right
    doc.setFont("helvetica", "bold");
    doc.text("Date :", pageWidth - margin - 70, invoiceTitleY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(invoice.date), pageWidth - margin - 40, invoiceTitleY + 10);
    
    doc.setFont("helvetica", "bold");
    doc.text("Invoice No :", pageWidth - margin - 70, invoiceTitleY + 17);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.invoiceNumber, pageWidth - margin - 40, invoiceTitleY + 17);
    
    // Invoice items section
    const tableStartY = invoiceTitleY + 50;
    doc.setDrawColor(221, 221, 221); // #ddd
    doc.setLineWidth(0.5);
    doc.line(margin, tableStartY, pageWidth - margin, tableStartY);
    
    doc.setTextColor(102, 102, 102); // #666
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ITEM", margin, tableStartY - 5);
    doc.text("AMOUNT", pageWidth - margin - 25, tableStartY - 5, { align: "right" });
    
    // Items content with truncation where needed
    let y = tableStartY + 10;
    
    if (invoice.items.length > 0) {
      // Group header - customer name + purpose
      doc.setTextColor(0, 102, 204); // #0066cc
      doc.setFont("helvetica", "bold");
      const groupHeader = `${invoice.customer.name.substring(0, 25)} Website Annual Charges`;
      doc.text(groupHeader, margin, y);
      y += 10;
      
      // Individual items
      invoice.items.forEach(item => {
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        
        // Truncate description if too long
        let description = item.description;
        if (description.length > 50) {
          description = description.substring(0, 50) + "...";
        }
        
        doc.text(description, margin, y);
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
    
    // Amount in words box - ensure it's not too wide
    const amountInWords = convertNumberToWords(invoice.total);
    
    doc.setFillColor(102, 102, 102); // #666
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    
    // Adjust words box if amount is too long
    let wordsBoxWidth = 70;
    let shortenedWords = amountInWords;
    if (amountInWords.length > 25) {
      shortenedWords = amountInWords.substring(0, 22) + "...";
      wordsBoxWidth = 65;
    }
    
    doc.roundedRect(pageWidth - margin - 100, y - 5, wordsBoxWidth, 8, 1, 1, 'F');
    doc.text(`Rupees ${shortenedWords}`, pageWidth - margin - 65, y, { align: "center" });
    
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
    
    // Save the PDF for download
    const pdfName = `Invoice_${invoice.invoiceNumber}.pdf`;
    doc.save(pdfName);
    
    // Return base64 data for preview
    return doc.output('datauristring');
  } catch (error) {
    console.error("Error generating PDF:", error);
    return undefined;
  }
}
