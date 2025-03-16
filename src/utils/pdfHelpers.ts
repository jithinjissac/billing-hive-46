
import jsPDF from "jspdf";

/**
 * Add multi-line text to PDF with word wrap
 */
export function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = 5,
  options?: { align?: "left" | "center" | "right" }
): number {
  // If text is empty, return original y position
  if (!text || text.trim() === '') return y;
  
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = doc.getTextWidth(testLine);
    
    if (testWidth > maxWidth && i > 0) {
      // Add the line to the document with proper alignment
      if (options?.align === 'center') {
        doc.text(line.trim(), x + maxWidth / 2, currentY, { align: 'center' });
      } else if (options?.align === 'right') {
        doc.text(line.trim(), x + maxWidth, currentY, { align: 'right' });
      } else {
        doc.text(line.trim(), x, currentY);
      }
      
      // Start a new line
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  // Add the last line
  if (line.trim() !== '') {
    if (options?.align === 'center') {
      doc.text(line.trim(), x + maxWidth / 2, currentY, { align: 'center' });
    } else if (options?.align === 'right') {
      doc.text(line.trim(), x + maxWidth, currentY, { align: 'right' });
    } else {
      doc.text(line.trim(), x, currentY);
    }
  }
  
  // Return the new Y position
  return currentY + lineHeight;
}

/**
 * Creates a properly indented and wrapped table row
 */
export function createTableRow(
  doc: jsPDF,
  description: string,
  amount: string,
  startY: number,
  margin: number,
  pageWidth: number,
  indent: number = 0
): number {
  const contentWidth = pageWidth - (margin * 2);
  const descriptionWidth = contentWidth - 100 - indent; // 100px for amount column
  
  // Add the description with word wrap
  const newY = addWrappedText(
    doc,
    description,
    margin + indent,
    startY,
    descriptionWidth
  );
  
  // Add the amount on the right
  doc.text(amount, pageWidth - margin, startY, { align: 'right' });
  
  return newY;
}
