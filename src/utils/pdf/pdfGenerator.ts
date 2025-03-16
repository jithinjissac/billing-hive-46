
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
      currentY: 0,
      pageWidth,
      margin,
      contentWidth
    };
    
    // Generate each section of the PDF
    addHeaderSection(doc, companySettings, pageWidth, margin);
    addInvoiceTitleSection(doc, invoice, positions);
    addClientSection(doc, invoice, positions);
    
    // Generate items table and get ending Y position
    const itemsEndY = addInvoiceTable(doc, invoice, currencySymbol, positions);
    
    // Generate total section and get ending Y position
    const totalEndY = addTotalSection(doc, invoice, currencySymbol, currencyCode, itemsEndY, positions);
    
    // Generate payment section and get ending Y position
    const paymentEndY = addPaymentSection(doc, invoice, companySettings, totalEndY, positions);
    
    // Generate footer section
    addFooterSection(doc, invoiceSettings, paymentEndY, positions);
    
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
