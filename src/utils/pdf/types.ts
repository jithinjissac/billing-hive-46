
import { Invoice, CurrencyCode } from "@/types/invoice";
import jsPDF from "jspdf";

// Common types for PDF generation
export interface PDFOptions {
  autoDownload?: boolean;
}

export interface SectionPositions {
  currentY: number;
  pageWidth: number;
  margin: number;
  contentWidth: number;
}

// Extend the jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: any;
  }
}
