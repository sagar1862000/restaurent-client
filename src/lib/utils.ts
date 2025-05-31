import { type ClassValue, clsx } from "clsx"; import { twMerge } from "tailwind-merge"; export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

/**
 * Gets the appropriate price for an item, handling fullPrice, halfPrice and legacy price field
 * @param item The menu item
 * @param isHalfPortion Whether to get the half portion price if available
 * @returns The appropriate price as a number
 */
export const getItemPrice = (item: any, isHalfPortion: boolean = false): number => {
  if (!item) return 0;
  
  // For half portions
  if (isHalfPortion && item.halfPrice !== undefined && item.halfPrice !== null) {
    const halfPrice = typeof item.halfPrice === 'number' ? item.halfPrice : parseFloat(String(item.halfPrice));
    return isNaN(halfPrice) ? 0 : halfPrice;
  }
  
  // Handle fullPrice first (new schema)
  if (item.fullPrice !== undefined && item.fullPrice !== null) {
    const fullPrice = typeof item.fullPrice === 'number' ? item.fullPrice : parseFloat(String(item.fullPrice));
    return isNaN(fullPrice) ? 0 : fullPrice;
  }
  
  // Legacy support for price field
  if (item.price !== undefined && item.price !== null) {
    const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
    return isNaN(price) ? 0 : price;
  }
  
  return 0;
};

/**
 * Formats a price as currency
 * @param price The price to format
 * @param currency The currency symbol (default: ₹)
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string = '₹'): string => {
  if (isNaN(price) || price === null || price === undefined) return `${currency}0.00`;
  
  // Check if price is a valid number
  const validPrice = typeof price === 'number' ? price : parseFloat(String(price));
  
  // Format with Indian numbering system and proper decimal places
  try {
    return `${currency}${validPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${currency}0.00`;
  }
};

/**
 * Checks if an item has half portion pricing available
 * @param item The menu item
 * @returns True if the item has half portion pricing
 */
export const hasHalfPortionPrice = (item: any): boolean => {
  return item.halfPrice !== undefined && item.halfPrice !== null;
};
