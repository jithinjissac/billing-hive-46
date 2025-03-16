
import { CurrencyCode } from "@/types/invoice";
import { getCurrencyByCode } from "@/services/settingsService";

/**
 * Format a number as currency based on provided currency code
 */
export function formatCurrency(amount: number, currencyCode: CurrencyCode = "INR"): string {
  const currency = getCurrencyByCode(currencyCode);
  
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  
  // Handle special cases for better formatting
  let formatted = new Intl.NumberFormat('en-US', options).format(amount);
  
  // For Indian Rupee, replace with the proper symbol and add space
  if (currencyCode === 'INR') {
    formatted = formatted.replace(/\$|₹/g, "₹ ");
  }
  
  return formatted;
}

/**
 * Format a date string into DD/MM/YYYY format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Convert a number to words for Indian Rupees
 */
export function convertNumberToWords(num: number, currencyCode: CurrencyCode = "INR"): string {
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
  
  // Handle different currencies differently
  if (currencyCode === "INR") {
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
  } else {
    // For non-INR currencies, use standard millions notation
    const million = Math.floor(num / 1000000);
    const thousand = Math.floor((num % 1000000) / 1000);
    const remaining = num % 1000;
    
    if (million > 0) {
      result += convertLessThanOneThousand(million) + ' Million ';
    }
    if (thousand > 0) {
      result += convertLessThanOneThousand(thousand) + ' Thousand ';
    }
    if (remaining > 0) {
      result += convertLessThanOneThousand(remaining);
    }
  }
  
  const currency = getCurrencyByCode(currencyCode);
  return result.trim() + ' ' + currency.name + ' Only';
}
