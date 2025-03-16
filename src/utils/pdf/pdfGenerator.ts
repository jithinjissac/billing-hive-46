
import { Invoice, CurrencyCode } from "@/types/invoice";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getCompanySettings, getInvoiceSettings } from "@/services/settingsService";
import { SectionPositions } from "./types";
import { getCurrencySymbol } from "./currencyUtils";
import {
  addHeaderSection,
  addInvoiceTitleSection,
  addClientSection,
  addInvoiceTable,
  addTotalSection,
  addPaymentSection,
  addFooterSection
} from "./sectionGenerators";

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
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Get company settings and invoice settings
    const companySettings = getCompanySettings();
    const invoiceSettings = getInvoiceSettings();
    
    // Get currency code and symbol
    const currencyCode = invoice.currency as CurrencyCode || "INR" as CurrencyCode;
    const currencySymbol = getCurrencySymbol(currencyCode);
    
    // Create positions object for section generators
    const positions: SectionPositions = {
      currentY: margin,
      pageWidth,
      margin,
      contentWidth
    };
    
    // Generate each section of the PDF
    addHeaderSection(doc, companySettings, positions);
    positions.currentY += 45; // Update position after header

    addInvoiceTitleSection(doc, invoice, positions);
    positions.currentY += 25; // Update position after invoice title

    addClientSection(doc, invoice, positions);
    positions.currentY += 35; // Update position after client info
    
    // Generate items table
    positions.currentY = addInvoiceTable(doc, invoice, currencySymbol, positions);
    
    // Generate total section
    positions.currentY = addTotalSection(doc, invoice, currencySymbol, currencyCode, positions);
    
    // Generate payment section
    positions.currentY = addPaymentSection(doc, invoice, companySettings, positions);
    
    // Generate footer section
    addFooterSection(doc, invoiceSettings, positions);
    
    // Save the PDF for download if requested
    if (autoDownload) {
      const pdfName = `${invoice.customer.name}_${invoice.invoiceNumber}.pdf`;
      doc.save(pdfName);
    }
    
    // Return base64 data for preview
    return doc.output('datauristring');
  } catch (error) {
    console.error("Error generating PDF:", error);
    return undefined;
  }
}
