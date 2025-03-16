
import { CurrencyCode } from "@/types/invoice";

/**
 * Get currency symbol based on currency code
 */
export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  switch (currencyCode) {
    case "USD":
      return "$";
    case "GBP":
      return "£";
    case "AUD":
      return "A$";
    case "INR":
    default:
      return "₹";
  }
}
