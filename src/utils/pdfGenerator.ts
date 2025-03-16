
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
 * Generate and download a PDF for the given invoice
 */
export async function generatePDF(invoice: Invoice): Promise<void> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  // Document defaults
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Add header with logo and company details
  doc.setFillColor(0, 188, 212); // #00BCD4
  doc.rect(0, 0, pageWidth, 40, "F");
  
  // We can't add the actual image here, but in a real app you'd use:
  // doc.addImage("logo_url", "PNG", margin, 10, 40, 20);
  
  // Add company info
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Techius Solutions", margin + 45, 18);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Mallappally, Kerala", margin + 45, 24);
  doc.text("Phone: +91-9961560545", margin + 45, 30);
  doc.text("Email: info@techiussolutions.in", margin + 45, 36);
  
  // Add invoice title and details
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("INVOICE", margin, 60);
  
  // Invoice number and dates
  doc.setFontSize(12);
  doc.text("Invoice Number:", pageWidth - margin - 80, 60);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoiceNumber, pageWidth - margin - 30, 60);
  
  doc.setFont("helvetica", "bold");
  doc.text("Date:", pageWidth - margin - 80, 68);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(invoice.date), pageWidth - margin - 30, 68);
  
  doc.setFont("helvetica", "bold");
  doc.text("Due Date:", pageWidth - margin - 80, 76);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(invoice.dueDate), pageWidth - margin - 30, 76);
  
  // Status
  doc.setFont("helvetica", "bold");
  doc.text("Status:", pageWidth - margin - 80, 84);
  doc.setFont("helvetica", "normal");
  const status = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
  doc.text(status, pageWidth - margin - 30, 84);
  
  // Bill To section
  doc.setFillColor(0, 188, 212);
  doc.rect(margin, 70, 40, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("BILL TO", margin + 5, 77);
  
  // Customer information
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(invoice.customer.name, margin, 90);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(invoice.customer.address, margin, 97);
  if (invoice.customer.email) {
    doc.text(`Email: ${invoice.customer.email}`, margin, 104);
  }
  if (invoice.customer.phone) {
    doc.text(`Phone: ${invoice.customer.phone}`, margin, 111);
  }
  
  // Invoice items table
  const tableColumns = [
    { header: "Item", dataKey: "description" },
    { header: "Qty", dataKey: "quantity" },
    { header: "Price", dataKey: "price" },
    { header: "Amount", dataKey: "total" },
  ];
  
  const tableRows = invoice.items.map((item) => {
    return {
      description: item.description,
      quantity: item.quantity,
      price: formatCurrency(item.price),
      total: formatCurrency(item.price * item.quantity),
    };
  });
  
  doc.autoTable({
    head: [tableColumns.map(col => col.header)],
    body: tableRows.map(row => [
      row.description,
      row.quantity,
      row.price,
      row.total,
    ]),
    startY: 130,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  });
  
  // Get the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Summary table (subtotal, tax, total)
  doc.autoTable({
    body: [
      ["Subtotal", formatCurrency(invoice.subtotal)],
      ["Tax", formatCurrency(invoice.tax)],
      ["Total", formatCurrency(invoice.total)],
    ],
    startY: finalY,
    margin: { left: pageWidth - margin - 80, right: margin },
    theme: 'plain',
    styles: {
      fontSize: 12,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, halign: 'left' },
      1: { cellWidth: 40, halign: 'right' },
    },
  });
  
  // Add footer
  const footerPosition = pageHeight - 30;
  
  doc.setDrawColor(0, 188, 212);
  doc.setLineWidth(0.5);
  doc.line(margin, footerPosition, pageWidth - margin, footerPosition);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for your business!", pageWidth / 2, footerPosition + 10, { align: "center" });
  
  // Save the PDF
  doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
}
